package com.homeinterior.repository;

import com.homeinterior.model.DesignPreference;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DesignPreferenceRepository extends JpaRepository<DesignPreference, Long> {
    Optional<DesignPreference> findByProjectId(Long projectId);
}
