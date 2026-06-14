package com.example.keeper.systems.major.repository;

import com.example.keeper.systems.major.entity.Major;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MajorRepository extends JpaRepository<Major, UUID> {
    Optional<Major> findBySchoolIdAndCode(UUID schoolId, String code);
    
    boolean existsBySchoolIdAndCode(UUID schoolId, String code);
    
    boolean existsBySchoolIdAndCodeAndIdNot(UUID schoolId, String code, UUID id);
    
    List<Major> findBySchoolId(UUID schoolId);
}
