package com.example.keeper.systems.subject.entity;

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
@Table(name = "subjects")
public class Subject extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code; // Mã môn học, vd: SWP391

    @Column(nullable = false)
    private String name; // Tên môn học

    @Column(columnDefinition = "TEXT")
    private String description; // Mô tả môn học
}