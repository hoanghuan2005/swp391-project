package com.example.keeper.systems.course.entity;

import com.example.keeper.systems.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "courses")
public class Course extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code; // Course code, e.g. SWP391

    @Column(nullable = false)
    private String name; // Course name

    @Column(columnDefinition = "TEXT")
    private String description; // Course description
}
