package com.homeinterior.service;

import com.homeinterior.model.DesignSuggestion;
import com.homeinterior.model.Room;
import com.homeinterior.repository.DesignPreferenceRepository;
import com.homeinterior.repository.RoomRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SuggestionService {
    private final RoomRepository roomRepository;
    private final DesignPreferenceRepository preferenceRepository;
    private final ProjectService projectService;

    public SuggestionService(RoomRepository roomRepository, DesignPreferenceRepository preferenceRepository, ProjectService projectService) {
        this.roomRepository = roomRepository;
        this.preferenceRepository = preferenceRepository;
        this.projectService = projectService;
    }

    public List<DesignSuggestion> suggestions(Long projectId, String email) {
        projectService.detail(projectId, email);
        String style = preferenceRepository.findByProjectId(projectId).map(p -> p.getStyle()).orElse("Modern");
        return roomRepository.findByProjectIdOrderByIdAsc(projectId).stream()
                .map(room -> suggestion(room, style))
                .toList();
    }

    private DesignSuggestion suggestion(Room room, String style) {
        String key = (room.getType() + " " + style).toLowerCase();
        List<String> items;
        if (key.contains("bedroom") && key.contains("modern")) {
            items = List.of("Platform bed", "Sliding wardrobe", "Layered warm lighting", "Compact side tables");
        } else if (key.contains("living") && key.contains("minimal")) {
            items = List.of("Low-profile sofa", "Coffee table", "Wall-mounted TV unit", "Open shelving");
        } else if (key.contains("kitchen")) {
            items = List.of("Task lighting", "Heat-resistant backsplash", "Closed storage", "Clear counter zones");
        } else if (key.contains("bath")) {
            items = List.of("Anti-slip flooring", "Vanity storage", "Mirror lighting", "Ventilation fan");
        } else {
            items = List.of("Primary furniture scaled to room size", "Ambient lighting", "Storage unit", "Clear walking path");
        }
        return new DesignSuggestion(room.getId(), room.getName(), room.getType(), style, items,
                "Suggested for a " + room.getLength() + " x " + room.getWidth() + " room with " + style + " preference.");
    }
}
