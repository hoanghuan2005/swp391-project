package com.example.keeper.systems.payment.service;

import com.example.keeper.systems.payment.dto.response.CreateVnpayPaymentResponse;
import com.example.keeper.systems.payment.dto.response.ConfirmVnpayReturnResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

public interface VnpayPaymentService {
    CreateVnpayPaymentResponse createProPayment(String userEmail, HttpServletRequest request);

    Map<String, String> handleIpn(Map<String, String> params);

    ConfirmVnpayReturnResponse confirmReturn(String userEmail, Map<String, String> params);
}
