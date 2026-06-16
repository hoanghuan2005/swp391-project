package com.example.keeper.systems.payment.controller;

import com.example.keeper.systems.payment.dto.response.CreateVnpayPaymentResponse;
import com.example.keeper.systems.payment.service.VnpayPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
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
    public ResponseEntity<CreateVnpayPaymentResponse> create(HttpServletRequest request) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return ResponseEntity.ok(vnpayPaymentService.createProPayment(email, request));
    }

    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> ipn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(vnpayPaymentService.handleIpn(params));
    }
}
