package com.example.keeper.systems.base.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BaseCrudService<
        ID,
        CREATE_REQ,
        UPDATE_REQ,
        RESPONSE> {

    RESPONSE create(CREATE_REQ request);

    RESPONSE update(ID id, UPDATE_REQ request);

    void delete(ID id);

    RESPONSE getById(ID id);

    Page<RESPONSE> getAll(Pageable pageable);
}
