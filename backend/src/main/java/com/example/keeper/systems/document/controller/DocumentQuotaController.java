package com.example.keeper.systems.document.controller;

import com.example.keeper.systems.document.dto.response.DocumentQuotaResponse;
import com.example.keeper.systems.document.service.DocumentQuotaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/document-quota")
@RequiredArgsConstructor
public class DocumentQuotaController {

    private final DocumentQuotaService documentQuotaService;

    @GetMapping("/me")
    public DocumentQuotaResponse getMyQuota() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return documentQuotaService.getQuota(email);
    }
}
