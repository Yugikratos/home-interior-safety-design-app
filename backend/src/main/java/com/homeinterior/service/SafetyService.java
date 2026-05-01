package com.homeinterior.service;

import com.homeinterior.model.SafetyRecommendation;
import com.homeinterior.model.FurnitureItem;
import com.homeinterior.model.Room;
import com.homeinterior.repository.FurnitureItemRepository;
import com.homeinterior.repository.RoomRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SafetyService {
    private final RoomRepository roomRepository;
    private final FurnitureItemRepository furnitureItemRepository;
    private final ProjectService projectService;

    public SafetyService(RoomRepository roomRepository, FurnitureItemRepository furnitureItemRepository, ProjectService projectService) {
        this.roomRepository = roomRepository;
        this.furnitureItemRepository = furnitureItemRepository;
        this.projectService = projectService;
    }

    public List<SafetyRecommendation> recommendations(Long projectId, String email) {
        projectService.detail(projectId, email);
        List<SafetyRecommendation> items = new ArrayList<>();
        List<Room> rooms = roomRepository.findByProjectIdOrderByIdAsc(projectId);
        rooms.forEach(room -> {
            List<FurnitureItem> furniture = furnitureItemRepository.findByRoomIdOrderByIdAsc(room.getId());
            items.add(new SafetyRecommendation("Smoke detector", "Install one smoke detector in " + room.getName() + ".", true,
                    "High", "Every enclosed room needs smoke detection coverage."));
            addExitPathWarning(items, room, furniture);
            addOvercrowdingWarning(items, room, furniture);
            addOverlapWarnings(items, room, furniture);
        });
        boolean hasKitchen = rooms.stream().anyMatch(room -> room.getType().toLowerCase().contains("kitchen"));
        items.add(new SafetyRecommendation("Fire extinguisher", "Place a fire extinguisher near the " + (hasKitchen ? "kitchen" : "main exit") + ".", true,
                "High", "The highest fire risk area should have fast extinguisher access."));
        items.add(new SafetyRecommendation("Electrical safety", "Avoid overloading outlets and keep cords away from wet areas.", false,
                "Low", "Cord management reduces trip and electrical hazards around furniture."));
        return items;
    }

    private void addExitPathWarning(List<SafetyRecommendation> items, Room room, List<FurnitureItem> furniture) {
        boolean centerBlocked = furniture.stream().anyMatch(item ->
                item.getXPercent() < 55 && item.getXPercent() + item.getWidthPercent() > 45
                        && item.getYPercent() < 55 && item.getYPercent() + item.getHeightPercent() > 45);
        String priority = centerBlocked ? "High" : "Medium";
        String recommendation = centerBlocked
                ? "Move furniture away from the center path in " + room.getName() + "."
                : "Keep a clear route from the center of " + room.getName() + " to the nearest boundary.";
        items.add(new SafetyRecommendation("Exit path", recommendation, true, priority,
                centerBlocked ? "A furniture item crosses the likely center exit route." : "Layout has no detected center blockage, but exit clearance should remain visible."));
    }

    private void addOvercrowdingWarning(List<SafetyRecommendation> items, Room room, List<FurnitureItem> furniture) {
        double area = room.getLength() * room.getWidth();
        double furnitureCoverage = furniture.stream().mapToDouble(item -> item.getWidthPercent() * item.getHeightPercent()).sum();
        if ((area < 100 && furniture.size() > 3) || furnitureCoverage > 4200) {
            items.add(new SafetyRecommendation("Exit path", "Reduce furniture density in " + room.getName() + ".", true,
                    area < 100 ? "High" : "Medium", "Furniture count or coverage is high for the room size."));
        }
    }

    private void addOverlapWarnings(List<SafetyRecommendation> items, Room room, List<FurnitureItem> furniture) {
        for (int i = 0; i < furniture.size(); i++) {
            for (int j = i + 1; j < furniture.size(); j++) {
                if (overlapRatio(furniture.get(i), furniture.get(j)) > 0.35) {
                    items.add(new SafetyRecommendation("Electrical safety", "Separate overlapping furniture in " + room.getName() + ".", false,
                            "Medium", "Heavy overlap can hide cords, block outlets, or reduce usable walking space."));
                    return;
                }
            }
        }
    }

    private double overlapRatio(FurnitureItem first, FurnitureItem second) {
        double overlapWidth = Math.max(0, Math.min(first.getXPercent() + first.getWidthPercent(), second.getXPercent() + second.getWidthPercent()) - Math.max(first.getXPercent(), second.getXPercent()));
        double overlapHeight = Math.max(0, Math.min(first.getYPercent() + first.getHeightPercent(), second.getYPercent() + second.getHeightPercent()) - Math.max(first.getYPercent(), second.getYPercent()));
        double overlap = overlapWidth * overlapHeight;
        double smaller = Math.min(first.getWidthPercent() * first.getHeightPercent(), second.getWidthPercent() * second.getHeightPercent());
        return smaller == 0 ? 0 : overlap / smaller;
    }
}
