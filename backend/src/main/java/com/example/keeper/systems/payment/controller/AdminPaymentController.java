package com.example.keeper.systems.payment.controller;

import com.example.keeper.systems.payment.entity.PaymentTransaction;
import com.example.keeper.systems.payment.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final PaymentTransactionRepository paymentTransactionRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllTransactions() {
        List<PaymentTransaction> txns = paymentTransactionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        
        List<Map<String, Object>> response = txns.stream().map(t -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", t.getId());
            map.put("txnRef", t.getTxnRef());
            map.put("amountVnd", t.getAmountVnd());
            map.put("orderInfo", t.getOrderInfo());
            map.put("status", t.getStatus().name());
            map.put("vnpTransactionNo", t.getVnpTransactionNo());
            map.put("vnpBankCode", t.getVnpBankCode());
            map.put("vnpPayDate", t.getVnpPayDate());
            map.put("createdAt", t.getCreatedAt());
            
            if (t.getUser() != null) {
                map.put("userId", t.getUser().getId());
                map.put("username", t.getUser().getUsername());
                map.put("email", t.getUser().getEmail());
                map.put("subscriptionTier", t.getUser().getSubscriptionTier().name());
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
