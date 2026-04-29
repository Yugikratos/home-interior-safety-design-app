package com.homeinterior.service;

import com.homeinterior.model.SafetyRecommendation;
import com.homeinterior.repository.RoomRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SafetyService {
    private final RoomRepository roomRepository;
    private final ProjectService projectService;

    public SafetyService(RoomRepository roomRepository, ProjectService projectService) {
        this.roomRepository = roomRepository;
        this.projectService = projectService;
    }

    public List<SafetyRecommendation> recommendations(Long projectId, String email) {
        projectService.detail(projectId, email);
        List<SafetyRecommendation> items = new ArrayList<>();
        roomRepository.findByProjectIdOrderByIdAsc(projectId).forEach(room ->
                items.add(new SafetyRecommendation("Smoke detector", "Install one smoke detector in " + room.getName() + ".", true)));
        items.add(new SafetyRecommendation("Fire extinguisher", "Place a fire extinguisher near the kitchen or main exit.", true));
        items.add(new SafetyRecommendation("Exit path", "Keep a clear exit path from bedrooms and living areas to the nearest exterior door.", true));
        items.add(new SafetyRecommendation("Electrical safety", "Avoid overloading outlets and keep cords away from wet areas.", false));
        return items;
    }
}
