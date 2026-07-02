package com.example.keeper.systems.payment.service.impl;

import com.example.keeper.config.VnpayConfig;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.enums.SubscriptionTier;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.auth.service.EmailService;
import com.example.keeper.systems.notification.service.NotificationService;
import com.example.keeper.systems.notification.enums.NotificationType;
import com.example.keeper.systems.payment.dto.response.ConfirmVnpayReturnResponse;
import com.example.keeper.systems.payment.dto.response.CreateVnpayPaymentResponse;
import com.example.keeper.systems.payment.entity.PaymentTransaction;
import com.example.keeper.systems.payment.enums.PaymentStatus;
import com.example.keeper.systems.payment.repository.PaymentTransactionRepository;
import com.example.keeper.systems.payment.service.VnpayPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VnpayPaymentServiceImpl implements VnpayPaymentService {

    private static final long PRO_PRICE_VND = 10_000L;
    private static final String VNP_VERSION = "2.1.0";
    private static final String VNP_COMMAND = "pay";
    private static final String VNP_CURRENCY = "VND";
    private static final String VNP_LOCALE = "vn";
    private static final String VNP_ORDER_TYPE = "other";
    private static final DateTimeFormatter VNP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final VnpayConfig vnpayConfig;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public CreateVnpayPaymentResponse createProPayment(String userEmail, HttpServletRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String txnRef = generateTxnRef();
        String orderInfo = "Upgrade_StudyMate_AI_account_to_PRO";

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setUser(user);
        transaction.setTxnRef(txnRef);
        transaction.setAmountVnd(PRO_PRICE_VND);
        transaction.setOrderInfo(orderInfo);
        transaction.setStatus(PaymentStatus.PENDING);
        paymentTransactionRepository.save(transaction);

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", VNP_VERSION);
        params.put("vnp_Command", VNP_COMMAND);
        params.put("vnp_TmnCode", vnpayConfig.getTmnCode());
        params.put("vnp_Amount", String.valueOf(PRO_PRICE_VND * 100));
        params.put("vnp_CurrCode", VNP_CURRENCY);
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", VNP_ORDER_TYPE);
        params.put("vnp_Locale", VNP_LOCALE);
        params.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl());
        params.put("vnp_IpAddr", resolveClientIp(request));
        params.put("vnp_CreateDate", VNP_DATE_FORMAT.format(LocalDateTime.now()));

        String secureHash = hmacSha512(vnpayConfig.getHashSecret(), buildHashData(params));
        String paymentUrl = vnpayConfig.getPayUrl()
                + "?"
                + buildQueryString(params)
                + "&vnp_SecureHash="
                + urlEncode(secureHash);

        return CreateVnpayPaymentResponse.builder()
                .paymentUrl(paymentUrl)
                .txnRef(txnRef)
                .build();
    }

    @Override
    @Transactional
    public Map<String, String> handleIpn(Map<String, String> params) {
        if (!isValidSecureHash(params)) {
            return ipnResponse("97", "Invalid checksum");
        }

        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isBlank()) {
            return ipnResponse("01", "Order not found");
        }

        Optional<PaymentTransaction> optionalTransaction =
                paymentTransactionRepository.findByTxnRefForUpdate(txnRef);
        if (optionalTransaction.isEmpty()) {
            return ipnResponse("01", "Order not found");
        }

        PaymentTransaction transaction = optionalTransaction.get();
        if (!isAmountValid(params.get("vnp_Amount"), transaction.getAmountVnd())) {
            return ipnResponse("04", "Invalid amount");
        }

        if (transaction.getStatus() != PaymentStatus.PENDING) {
            return ipnResponse("02", "Order already confirmed");
        }

        applyVnpayFields(transaction, params);

        boolean successful = "00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.get("vnp_TransactionStatus"));

        if (successful) {
            transaction.setStatus(PaymentStatus.SUCCESS);
            transaction.setProcessedAt(LocalDateTime.now());

            User user = transaction.getUser();
            user.setSubscriptionTier(SubscriptionTier.PRO);
            userRepository.save(user);
            paymentTransactionRepository.save(transaction);

            try {
                emailService.sendSubscriptionSuccessEmail(user.getEmail(), user.getUsername());
            } catch (Exception e) {
                System.err.println("Failed to send subscription success email: " + e.getMessage());
            }

            try {
                notificationService.createNotification(
                        user,
                        null,
                        NotificationType.PRO_UPGRADE_SUCCESS,
                        "Upgrade to PRO Successful",
                        "Congratulations! Your account has been successfully upgraded to the PRO plan. You now have access to unlimited AI requests and advanced features.",
                        null,
                        null
                );
            } catch (Exception e) {
                System.err.println("Failed to create subscription success notification: " + e.getMessage());
            }

            return ipnResponse("00", "Confirm Success");
        }

        transaction.setStatus(PaymentStatus.FAILED);
        transaction.setProcessedAt(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        return ipnResponse("00", "Confirm Success");
    }

    @Override
    @Transactional
    public ConfirmVnpayReturnResponse confirmReturn(String userEmail, Map<String, String> params) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isBlank()) {
            throw new IllegalArgumentException("Transaction reference is required");
        }

        // Use regular read (no pessimistic lock) to avoid deadlock with IPN handler
        PaymentTransaction transaction = paymentTransactionRepository.findByTxnRef(txnRef)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        User transactionUser = transaction.getUser();
        if (!isAdmin(currentUser) && !transactionUser.getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("Transaction does not belong to current user");
        }

        // If IPN already processed, return immediately
        if (transaction.getStatus() == PaymentStatus.SUCCESS) {
            return toConfirmReturnResponse(transaction);
        }
        if (transaction.getStatus() == PaymentStatus.FAILED) {
            return toConfirmReturnResponse(transaction);
        }

        // Transaction is still PENDING — try to process it from URL params
        if (!isValidSecureHash(params)) {
            throw new IllegalArgumentException("Invalid VNPAY signature");
        }

        if (!isAmountValid(params.get("vnp_Amount"), transaction.getAmountVnd())) {
            throw new IllegalArgumentException("Invalid VNPAY amount");
        }

        applyVnpayFields(transaction, params);

        boolean successful = "00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.get("vnp_TransactionStatus"));

        transaction.setProcessedAt(LocalDateTime.now());
        if (successful) {
            transaction.setStatus(PaymentStatus.SUCCESS);
            transactionUser.setSubscriptionTier(SubscriptionTier.PRO);
            userRepository.save(transactionUser);

            try {
                emailService.sendSubscriptionSuccessEmail(transactionUser.getEmail(), transactionUser.getUsername());
            } catch (Exception e) {
                System.err.println("Failed to send subscription success email: " + e.getMessage());
            }

            try {
                notificationService.createNotification(
                        transactionUser,
                        null,
                        NotificationType.PRO_UPGRADE_SUCCESS,
                        "Upgrade to PRO Successful",
                        "Congratulations! Your account has been successfully upgraded to the PRO plan. You now have access to unlimited AI requests and advanced features.",
                        null,
                        null
                );
            } catch (Exception e) {
                System.err.println("Failed to create subscription success notification: " + e.getMessage());
            }
        } else {
            transaction.setStatus(PaymentStatus.FAILED);
        }

        paymentTransactionRepository.save(transaction);
        return toConfirmReturnResponse(transaction);
    }

    private void applyVnpayFields(PaymentTransaction transaction, Map<String, String> params) {
        transaction.setVnpTransactionNo(params.get("vnp_TransactionNo"));
        transaction.setVnpResponseCode(params.get("vnp_ResponseCode"));
        transaction.setVnpTransactionStatus(params.get("vnp_TransactionStatus"));
        transaction.setVnpBankCode(params.get("vnp_BankCode"));
        transaction.setVnpPayDate(params.get("vnp_PayDate"));
        transaction.setRawIpnParams(new TreeMap<>(params).toString());
    }

    private boolean isValidSecureHash(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null || receivedHash.isBlank()) {
            System.out.println("[VNPAY DEBUG] vnp_SecureHash is missing or blank");
            return false;
        }

        Map<String, String> signedParams = new TreeMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key == null || value == null || value.isBlank()) {
                continue;
            }
            if ("vnp_SecureHash".equals(key) || "vnp_SecureHashType".equals(key)) {
                continue;
            }
            // VNPAY 2.1.0 only hashes parameters starting with vnp_
            if (key.startsWith("vnp_")) {
                signedParams.put(key, value);
            }
        }

        String hashData = buildHashData(signedParams);
        String expectedHash = hmacSha512(vnpayConfig.getHashSecret(), hashData);
        System.out.println("[VNPAY DEBUG] Received params: " + params);
        System.out.println("[VNPAY DEBUG] Signed params: " + signedParams);
        System.out.println("[VNPAY DEBUG] Hash data string: " + hashData);
        System.out.println("[VNPAY DEBUG] Expected hash: " + expectedHash);
        System.out.println("[VNPAY DEBUG] Received hash: " + receivedHash);
        boolean matches = expectedHash.equalsIgnoreCase(receivedHash);
        System.out.println("[VNPAY DEBUG] Hash matches: " + matches);
        return matches;
    }

    private boolean isAmountValid(String vnpAmount, Long amountVnd) {
        if (vnpAmount == null || amountVnd == null) {
            return false;
        }

        try {
            return Long.parseLong(vnpAmount) == amountVnd * 100;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private String buildHashData(Map<String, String> params) {
        Map<String, String> sortedParams = new TreeMap<>(params);
        StringBuilder hashData = new StringBuilder();

        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isBlank()) {
                continue;
            }
            if (hashData.length() > 0) {
                hashData.append('&');
            }
            hashData.append(urlEncode(entry.getKey()))
                    .append('=')
                    .append(urlEncode(entry.getValue()));
        }

        return hashData.toString();
    }

    private String buildQueryString(Map<String, String> params) {
        Map<String, String> sortedParams = new TreeMap<>(params);
        StringBuilder query = new StringBuilder();

        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isBlank()) {
                continue;
            }
            if (query.length() > 0) {
                query.append('&');
            }
            query.append(urlEncode(entry.getKey()))
                    .append('=')
                    .append(urlEncode(entry.getValue()));
        }

        return query.toString();
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac.init(secretKey);
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder result = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                result.append(String.format("%02x", b));
            }
            return result.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign VNPAY request", e);
        }
    }

    private String generateTxnRef() {
        return "PRO"
                + VNP_DATE_FORMAT.format(LocalDateTime.now())
                + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String urlEncode(String value) {
        if (value == null) {
            return "";
        }
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private Map<String, String> ipnResponse(String code, String message) {
        Map<String, String> response = new LinkedHashMap<>();
        response.put("RspCode", code);
        response.put("Message", message);
        return response;
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
    }

    private ConfirmVnpayReturnResponse toConfirmReturnResponse(PaymentTransaction transaction) {
        return ConfirmVnpayReturnResponse.builder()
                .txnRef(transaction.getTxnRef())
                .status(transaction.getStatus().name())
                .subscriptionTier(transaction.getUser().getSubscriptionTier().name())
                .build();
    }
}
