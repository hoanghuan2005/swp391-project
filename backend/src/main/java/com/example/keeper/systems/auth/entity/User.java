package com.example.keeper.systems.auth.entity;

import com.example.keeper.systems.base.BaseEntity;
import com.example.keeper.systems.course.entity.Course;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users") //
@Data
@EqualsAndHashCode(callSuper = true)
public class User extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    private String resetToken;

    @Column(name = "survey_completed")
    private boolean surveyCompleted;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;

    @Column(nullable = false)
    private boolean isBanned = false;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private UserProfile profile;

    @ManyToMany
    @JoinTable(name = "user_languages", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "language_id"))
    private Set<Language> languages = new HashSet<>();

    @ManyToMany
    @JoinTable(name = "user_follow_courses", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "course_id"))
    private List<Course> followedCourses = new ArrayList<>();
}