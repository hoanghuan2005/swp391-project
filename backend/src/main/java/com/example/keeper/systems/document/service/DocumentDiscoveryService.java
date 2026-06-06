package com.example.keeper.systems.document.service;

import com.example.keeper.systems.document.entity.Document;

import java.util.List;

public interface DocumentDiscoveryService {

    DiscoveryResult discover(String message);

    record DiscoveryResult(boolean documentSearchIntent, List<Document> documents) {
    }
}
