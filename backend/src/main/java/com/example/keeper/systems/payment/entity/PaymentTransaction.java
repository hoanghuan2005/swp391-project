package com.example.keeper.systems.payment.entity;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.base.BaseEntity;
import com.example.keeper.systems.payment.enums.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "payment_transactions",
        uniqueConstraints = @UniqueConstraint(name = "uk_payment_transactions_txn_ref", columnNames = "txn_ref")
)
@Getter
@Setter
@NoArgsConstructor
public class PaymentTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "txn_ref", nullable = false, unique = true)
    private String txnRef;

    @Column(name = "amount_vnd", nullable = false)
    private Long amountVnd;

    @Column(name = "order_info", nullable = false)
    private String orderInfo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "vnp_transaction_no")
    private String vnpTransactionNo;

    @Column(name = "vnp_response_code")
    private String vnpResponseCode;

    @Column(name = "vnp_transaction_status")
    private String vnpTransactionStatus;

    @Column(name = "vnp_bank_code")
    private String vnpBankCode;

    @Column(name = "vnp_pay_date")
    private String vnpPayDate;

    @Column(name = "raw_ipn_params", columnDefinition = "TEXT")
    private String rawIpnParams;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
