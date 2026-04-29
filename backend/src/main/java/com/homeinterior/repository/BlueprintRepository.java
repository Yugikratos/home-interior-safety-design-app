package com.homeinterior.repository;

import com.homeinterior.model.Blueprint;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlueprintRepository extends JpaRepository<Blueprint, Long> {
    Optional<Blueprint> findByProjectId(Long projectId);
}
