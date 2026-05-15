package com.example.keeper.systems.auth.entity;

import com.example.keeper.systems.base.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.HashSet;
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

    private String school;

    @Column(name = "study_start_year")
    private Integer studyStartYear;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_preferred_languages", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "language")
    private Set<String> preferredLanguages = new HashSet<>();

    @Column(name = "survey_completed")
    private boolean surveyCompleted;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;
}