package com.example.keeper.systems.payment.controller;

import com.example.keeper.systems.payment.dto.response.ConfirmVnpayReturnResponse;
import com.example.keeper.systems.payment.dto.response.CreateVnpayPaymentResponse;
import com.example.keeper.systems.payment.service.VnpayPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
@RequiredArgsConstructor
public class VnpayPaymentController {

    private final VnpayPaymentService vnpayPaymentService;

    @PostMapping("/create")
    public ResponseEntity<CreateVnpayPaymentResponse> create(
            @RequestParam(required = false) String planCode,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        String code = planCode;
        if ((code == null || code.isBlank()) && body != null) {
            code = body.get("planCode");
        }

        return ResponseEntity.ok(vnpayPaymentService.createProPayment(email, code, request));
    }

    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> ipn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(vnpayPaymentService.handleIpn(params));
    }

    @PostMapping("/confirm-return")
    public ResponseEntity<ConfirmVnpayReturnResponse> confirmReturn(@RequestBody Map<String, String> params) {
        return ResponseEntity.ok(vnpayPaymentService.confirmReturn(params));
    }
}
