package com.homeinterior.repository;

import com.homeinterior.model.Room;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByProjectIdOrderByIdAsc(Long projectId);
}
