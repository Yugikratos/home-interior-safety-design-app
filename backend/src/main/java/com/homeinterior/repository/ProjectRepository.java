package com.homeinterior.repository;

import com.homeinterior.model.Project;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUserEmailOrderByCreatedAtDesc(String email);
    Optional<Project> findByIdAndUserEmail(Long id, String email);
}
