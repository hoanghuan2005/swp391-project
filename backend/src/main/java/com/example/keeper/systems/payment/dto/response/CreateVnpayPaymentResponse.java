package com.example.keeper.systems.payment.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateVnpayPaymentResponse {
    private String paymentUrl;
    private String txnRef;
}
