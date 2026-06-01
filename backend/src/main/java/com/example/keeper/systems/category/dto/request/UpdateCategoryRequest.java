package com.example.keeper.systems.category.dto.request;

import lombok.Data;

@Data
public class UpdateCategoryRequest {
    private String name;
    private String description;
    private String icon;
    private String color;
    private Boolean active;
}
