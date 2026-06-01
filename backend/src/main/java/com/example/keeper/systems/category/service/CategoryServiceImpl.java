package com.example.keeper.systems.category.service;

import com.example.keeper.systems.category.dto.request.CreateCategoryRequest;
import com.example.keeper.systems.category.dto.request.UpdateCategoryRequest;
import com.example.keeper.systems.category.dto.response.CategoryResponse;
import com.example.keeper.systems.category.entity.Category;
import com.example.keeper.systems.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public CategoryResponse create(
            CreateCategoryRequest request) {

        if (categoryRepository.existsByCode(
                request.getCode().toUpperCase())) {

            throw new RuntimeException(
                    "Category code already exists");
        }

        if (categoryRepository.existsByName(
                request.getName())) {

            throw new RuntimeException(
                    "Category name already exists");
        }

        Category category = Category.builder()
                .name(request.getName())
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .icon(request.getIcon())
                .color(request.getColor())
                .build();

        categoryRepository.save(category);

        return mapToResponse(category);
    }

    @Override
    public List<CategoryResponse> getAll() {

        return categoryRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<CategoryResponse> getAllActive() {

        return categoryRepository.findByActiveTrue()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public CategoryResponse getById(
            UUID id) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Category not found"));

        return mapToResponse(category);
    }

    @Override
    public CategoryResponse update(
            UUID id,
            UpdateCategoryRequest request) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Category not found"));

        if (request.getName() != null) {
            category.setName(request.getName());
        }

        if (request.getDescription() != null) {
            category.setDescription(
                    request.getDescription());
        }

        if (request.getIcon() != null) {
            category.setIcon(request.getIcon());
        }

        if (request.getColor() != null) {
            category.setColor(request.getColor());
        }

        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }

        categoryRepository.save(category);

        return mapToResponse(category);
    }

    @Override
    public void delete(
            UUID id) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Category not found"));

        category.setActive(false);

        categoryRepository.save(category);
    }

    private CategoryResponse mapToResponse(
            Category category) {

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .code(category.getCode())
                .description(category.getDescription())
                .icon(category.getIcon())
                .color(category.getColor())
                .active(category.getActive())
                .documentCount(category.getDocumentCount())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
