package com.example.keeper.systems.major.entity;

import com.example.keeper.systems.base.BaseEntity;
import com.example.keeper.systems.school.entity.School;
import com.example.keeper.systems.course.entity.Course;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "majors", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"school_id", "code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Major extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String code;

    private String description;

    @ManyToOne
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @OneToMany(mappedBy = "major", cascade = CascadeType.ALL)
    @JsonIgnore
    @Builder.Default
    private List<Course> courses = new ArrayList<>();
}
