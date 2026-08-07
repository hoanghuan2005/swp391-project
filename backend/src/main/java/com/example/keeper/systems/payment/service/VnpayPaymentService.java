package com.example.keeper.systems.payment.service;

import com.example.keeper.systems.payment.dto.response.CreateVnpayPaymentResponse;
import com.example.keeper.systems.payment.dto.response.ConfirmVnpayReturnResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

public interface VnpayPaymentService {
    CreateVnpayPaymentResponse createPayment(String userEmail, String planCode, HttpServletRequest request);

    CreateVnpayPaymentResponse createProPayment(String userEmail, String planCode, HttpServletRequest request);

    Map<String, String> handleIpn(Map<String, String> params);

    ConfirmVnpayReturnResponse confirmReturn(Map<String, String> params);
}
