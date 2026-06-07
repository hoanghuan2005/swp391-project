package com.example.keeper.systems.base.controller;

import com.example.keeper.systems.base.service.BaseCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

public abstract class BaseAdminCrudController<
        ID,
        CREATE_REQ,
        UPDATE_REQ,
        RESPONSE> {

    protected abstract BaseCrudService<
                ID,
                CREATE_REQ,
                UPDATE_REQ,
                RESPONSE> service();

    @PostMapping
    public RESPONSE create(
            @RequestBody CREATE_REQ request) {

        return service().create(request);
    }

    @PutMapping("/{id}")
    public RESPONSE update(
            @PathVariable ID id,
            @RequestBody UPDATE_REQ request) {

        return service().update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable ID id) {

        service().delete(id);
    }

    @GetMapping("/{id}")
    public RESPONSE getById(
            @PathVariable ID id) {

        return service().getById(id);
    }

    @GetMapping
    public Page<RESPONSE> getAll(
            Pageable pageable) {

        return service().getAll(pageable);
    }
}