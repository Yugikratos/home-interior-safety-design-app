package com.homeinterior.repository;

import com.homeinterior.model.FurnitureItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FurnitureItemRepository extends JpaRepository<FurnitureItem, Long> {
    List<FurnitureItem> findByRoomProjectIdOrderByIdAsc(Long projectId);
    List<FurnitureItem> findByRoomIdOrderByIdAsc(Long roomId);
}
