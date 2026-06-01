package com.example.keeper.systems.category.service;

import com.example.keeper.systems.category.dto.request.CreateCategoryRequest;
import com.example.keeper.systems.category.dto.request.UpdateCategoryRequest;
import com.example.keeper.systems.category.dto.response.CategoryResponse;
import java.util.List;
import java.util.UUID;

public interface CategoryService {
    CategoryResponse create(CreateCategoryRequest request);

    List<CategoryResponse> getAll();

    List<CategoryResponse> getAllActive();

    CategoryResponse getById(UUID id);

    CategoryResponse update(UUID id, UpdateCategoryRequest request);

    void delete(UUID id);
}
