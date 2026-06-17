package com.example.keeper.systems.payment.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConfirmVnpayReturnResponse {
    private String txnRef;
    private String status;
    private String subscriptionTier;
}
