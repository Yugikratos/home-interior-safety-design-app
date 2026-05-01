package com.homeinterior.service;

import com.homeinterior.model.DesignSuggestion;
import com.homeinterior.model.FurnitureItem;
import com.homeinterior.model.Room;
import com.homeinterior.repository.DesignPreferenceRepository;
import com.homeinterior.repository.FurnitureItemRepository;
import com.homeinterior.repository.RoomRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class SuggestionService {
    private final RoomRepository roomRepository;
    private final DesignPreferenceRepository preferenceRepository;
    private final FurnitureItemRepository furnitureItemRepository;
    private final ProjectService projectService;

    public SuggestionService(RoomRepository roomRepository, DesignPreferenceRepository preferenceRepository,
                             FurnitureItemRepository furnitureItemRepository, ProjectService projectService) {
        this.roomRepository = roomRepository;
        this.preferenceRepository = preferenceRepository;
        this.furnitureItemRepository = furnitureItemRepository;
        this.projectService = projectService;
    }

    public List<DesignSuggestion> suggestions(Long projectId, String email) {
        projectService.detail(projectId, email);
        String style = preferenceRepository.findByProjectId(projectId).map(p -> p.getStyle()).orElse("Modern");
        String budget = preferenceRepository.findByProjectId(projectId).map(p -> p.getBudget()).orElse("Medium");
        return roomRepository.findByProjectIdOrderByIdAsc(projectId).stream()
                .map(room -> suggestion(room, style, budget, furnitureItemRepository.findByRoomIdOrderByIdAsc(room.getId())))
                .toList();
    }

    private DesignSuggestion suggestion(Room room, String style, String budget, List<FurnitureItem> placedFurniture) {
        String key = (room.getType() + " " + style).toLowerCase();
        List<String> items = new ArrayList<>();
        if (key.contains("bedroom") && key.contains("modern")) {
            items.addAll(List.of("Platform bed", "Sliding wardrobe", "Layered warm lighting"));
        } else if (key.contains("living") && key.contains("minimal")) {
            items.addAll(List.of("Low-profile sofa", "Coffee table", "Wall-mounted TV unit"));
        } else if (key.contains("kitchen")) {
            items.addAll(List.of("Task lighting", "Heat-resistant backsplash", "Closed storage"));
        } else if (key.contains("bath")) {
            items.addAll(List.of("Anti-slip flooring", "Vanity storage", "Mirror lighting"));
        } else {
            items.addAll(List.of("Primary furniture scaled to room size", "Ambient lighting", "Storage unit"));
        }
        double area = room.getLength() * room.getWidth();
        double narrowness = Math.max(room.getLength(), room.getWidth()) / Math.max(0.1, Math.min(room.getLength(), room.getWidth()));
        if (area < 100) {
            items.add("Compact furniture");
            items.removeIf(item -> item.toLowerCase(Locale.ROOT).contains("open shelving"));
        } else if (area > 220) {
            items.addAll(List.of("Accent chair", "Decor lighting"));
        }
        if (narrowness > 1.8) {
            items.add("Wall-mounted storage");
            items.removeIf(item -> item.toLowerCase(Locale.ROOT).contains("bulky"));
        }
        if (placedFurniture.stream().noneMatch(item -> item.getType().toLowerCase(Locale.ROOT).contains("table")) && !key.contains("bath")) {
            items.add("Small utility table");
        }
        String note = "Suggested for a " + room.getLength() + " x " + room.getWidth() + " room with " + style
                + " style, " + budget + " budget, and " + placedFurniture.size() + " placed furniture item"
                + (placedFurniture.size() == 1 ? "." : "s.");
        return new DesignSuggestion(room.getId(), room.getName(), room.getType(), style, items.stream().distinct().toList(), note);
    }
}
