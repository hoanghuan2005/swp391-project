package com.example.keeper.systems.base.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

@RequiredArgsConstructor
public abstract class BaseCrudServiceImpl<
        E,
        ID,
        CREATE_REQ,
        UPDATE_REQ,
        RESPONSE>
        implements BaseCrudService<
        ID,
        CREATE_REQ,
        UPDATE_REQ,
        RESPONSE> {

    protected abstract JpaRepository<E, ID> repository();

    protected abstract E createEntity(CREATE_REQ request);

    protected abstract void updateEntity(
            E entity,
            UPDATE_REQ request);

    protected abstract RESPONSE toResponse(E entity);

    @Override
    public RESPONSE create(CREATE_REQ request) {

        E entity = createEntity(request);

        return toResponse(
                repository().save(entity)
        );
    }

    @Override
    public RESPONSE update(
            ID id,
            UPDATE_REQ request) {

        E entity = repository()
                .findById(id)
                .orElseThrow();

        updateEntity(entity, request);

        return toResponse(
                repository().save(entity)
        );
    }

    @Override
    public void delete(ID id) {

        repository().deleteById(id);
    }

    @Override
    public RESPONSE getById(ID id) {

        return repository()
                .findById(id)
                .map(this::toResponse)
                .orElseThrow();
    }

    @Override
    public Page<RESPONSE> getAll(Pageable pageable) {

        return repository()
                .findAll(pageable)
                .map(this::toResponse);
    }
}
