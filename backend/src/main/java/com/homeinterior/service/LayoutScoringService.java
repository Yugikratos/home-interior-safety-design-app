package com.homeinterior.service;

import com.homeinterior.dto.ProjectDtos.LayoutScoreBreakdown;
import com.homeinterior.dto.ProjectDtos.LayoutSuggestionResponse;
import com.homeinterior.dto.ProjectDtos.RoomLayoutScoreResponse;
import com.homeinterior.exception.ApiNotFoundException;
import com.homeinterior.model.FurnitureItem;
import com.homeinterior.model.Room;
import com.homeinterior.repository.FurnitureItemRepository;
import com.homeinterior.repository.RoomRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class LayoutScoringService {
    private static final double OVERLAP_WARNING_THRESHOLD = 0.18;
    private static final double WALL_ALIGNMENT_THRESHOLD = 8.0;

    private final RoomRepository roomRepository;
    private final FurnitureItemRepository furnitureItemRepository;
    private final ProjectService projectService;

    public LayoutScoringService(RoomRepository roomRepository, FurnitureItemRepository furnitureItemRepository, ProjectService projectService) {
        this.roomRepository = roomRepository;
        this.furnitureItemRepository = furnitureItemRepository;
        this.projectService = projectService;
    }

    public RoomLayoutScoreResponse scoreRoom(Long projectId, Long roomId, String email) {
        projectService.detail(projectId, email);
        Room room = roomRepository.findById(roomId)
                .filter(existing -> existing.getProject().getId().equals(projectId))
                .orElseThrow(() -> new ApiNotFoundException("Room not found"));
        List<FurnitureItem> furniture = furnitureItemRepository.findByRoomIdOrderByIdAsc(roomId);

        double occupiedPercent = furniture.stream()
                .mapToDouble(item -> item.getWidthPercent() * item.getHeightPercent())
                .sum() / 100.0;
        double unusedSpacePercent = clamp(100.0 - occupiedPercent, 0, 100);

        List<LayoutSuggestionResponse> suggestions = new ArrayList<>();
        double overlapPenalty = overlapPenalty(furniture, suggestions);
        double spacingScore = clamp(100 - overlapPenalty - spacingPenalty(furniture, suggestions), 0, 100);
        double alignmentScore = alignmentScore(furniture, suggestions);
        double safetyScore = safetyScore(room, furniture, occupiedPercent, overlapPenalty, suggestions);
        double spaceScore = spaceScore(room, occupiedPercent, unusedSpacePercent, furniture.size(), suggestions);
        double overall = round((spaceScore * 0.25) + (spacingScore * 0.25) + (alignmentScore * 0.2) + (safetyScore * 0.3));

        return new RoomLayoutScoreResponse(
                room.getId(),
                overall,
                new LayoutScoreBreakdown(round(spaceScore), round(spacingScore), round(alignmentScore), round(safetyScore)),
                round(unusedSpacePercent),
                suggestions);
    }

    private double spaceScore(Room room, double occupiedPercent, double unusedSpacePercent, int furnitureCount, List<LayoutSuggestionResponse> suggestions) {
        double roomArea = room.getLength() * room.getWidth();
        if (furnitureCount == 0) {
            suggestions.add(new LayoutSuggestionResponse("Add furniture to start evaluating this room layout.", "suggestion", List.of()));
            return 65;
        }
        double idealOccupied = roomArea < 100 ? 24 : roomArea > 220 ? 38 : 32;
        double score = 100 - Math.abs(occupiedPercent - idealOccupied) * 2.1;
        if (unusedSpacePercent > 78 && roomArea > 120) {
            suggestions.add(new LayoutSuggestionResponse("Room has unused space, consider adding a table or accent chair.", "suggestion", List.of()));
        }
        if (occupiedPercent > 52 || (roomArea < 100 && furnitureCount > 3)) {
            suggestions.add(new LayoutSuggestionResponse("Room is crowded for its size. Remove or shrink one furniture item.", "warning", List.of()));
            score -= 22;
        }
        return clamp(score, 0, 100);
    }

    private double spacingPenalty(List<FurnitureItem> furniture, List<LayoutSuggestionResponse> suggestions) {
        double penalty = 0;
        for (int i = 0; i < furniture.size(); i++) {
            for (int j = i + 1; j < furniture.size(); j++) {
                FurnitureItem first = furniture.get(i);
                FurnitureItem second = furniture.get(j);
                double gap = gapBetween(first, second);
                if (gap > 0 && gap < 4) {
                    penalty += 8;
                    suggestions.add(new LayoutSuggestionResponse("Increase spacing between " + first.getType() + " and " + second.getType() + ".", "improve", List.of(first.getId(), second.getId())));
                }
            }
        }
        return penalty;
    }

    private double overlapPenalty(List<FurnitureItem> furniture, List<LayoutSuggestionResponse> suggestions) {
        double penalty = 0;
        for (int i = 0; i < furniture.size(); i++) {
            for (int j = i + 1; j < furniture.size(); j++) {
                FurnitureItem first = furniture.get(i);
                FurnitureItem second = furniture.get(j);
                double overlap = overlapRatio(first, second);
                if (overlap > OVERLAP_WARNING_THRESHOLD) {
                    penalty += 30 + overlap * 40;
                    suggestions.add(new LayoutSuggestionResponse("Furniture overlap detected between " + first.getType() + " and " + second.getType() + ".", "warning", List.of(first.getId(), second.getId())));
                }
            }
        }
        return penalty;
    }

    private double alignmentScore(List<FurnitureItem> furniture, List<LayoutSuggestionResponse> suggestions) {
        if (furniture.isEmpty()) {
            return 70;
        }
        long aligned = furniture.stream().filter(this::nearWall).count();
        double score = (aligned / (double) furniture.size()) * 100;
        furniture.stream()
                .filter(item -> !nearWall(item))
                .limit(2)
                .forEach(item -> suggestions.add(new LayoutSuggestionResponse("Move " + item.getType() + " closer to a wall for a cleaner layout.", "improve", List.of(item.getId()))));
        return clamp(score, 20, 100);
    }

    private double safetyScore(Room room, List<FurnitureItem> furniture, double occupiedPercent, double overlapPenalty, List<LayoutSuggestionResponse> suggestions) {
        double score = 100;
        List<Long> centerBlockers = furniture.stream()
                .filter(item -> item.getXPercent() < 55 && item.getXPercent() + item.getWidthPercent() > 45
                        && item.getYPercent() < 55 && item.getYPercent() + item.getHeightPercent() > 45)
                .map(FurnitureItem::getId)
                .toList();
        if (!centerBlockers.isEmpty()) {
            score -= 35;
            suggestions.add(new LayoutSuggestionResponse("Center-to-exit path may be blocked. Move furniture away from the room center.", "warning", centerBlockers));
        }
        if (occupiedPercent > 52 || (room.getLength() * room.getWidth() < 100 && furniture.size() > 3)) {
            score -= 25;
            suggestions.add(new LayoutSuggestionResponse("Overcrowding detected. Reduce furniture density to keep movement clear.", "warning", furniture.stream().map(FurnitureItem::getId).toList()));
        }
        score -= Math.min(35, overlapPenalty * 0.45);
        return clamp(score, 0, 100);
    }

    private boolean nearWall(FurnitureItem item) {
        return item.getXPercent() <= WALL_ALIGNMENT_THRESHOLD
                || item.getYPercent() <= WALL_ALIGNMENT_THRESHOLD
                || item.getXPercent() + item.getWidthPercent() >= 100 - WALL_ALIGNMENT_THRESHOLD
                || item.getYPercent() + item.getHeightPercent() >= 100 - WALL_ALIGNMENT_THRESHOLD;
    }

    private double gapBetween(FurnitureItem first, FurnitureItem second) {
        double horizontalGap = Math.max(0, Math.max(first.getXPercent(), second.getXPercent()) - Math.min(first.getXPercent() + first.getWidthPercent(), second.getXPercent() + second.getWidthPercent()));
        double verticalGap = Math.max(0, Math.max(first.getYPercent(), second.getYPercent()) - Math.min(first.getYPercent() + first.getHeightPercent(), second.getYPercent() + second.getHeightPercent()));
        return Math.sqrt(horizontalGap * horizontalGap + verticalGap * verticalGap);
    }

    private double overlapRatio(FurnitureItem first, FurnitureItem second) {
        double overlapWidth = Math.max(0, Math.min(first.getXPercent() + first.getWidthPercent(), second.getXPercent() + second.getWidthPercent()) - Math.max(first.getXPercent(), second.getXPercent()));
        double overlapHeight = Math.max(0, Math.min(first.getYPercent() + first.getHeightPercent(), second.getYPercent() + second.getHeightPercent()) - Math.max(first.getYPercent(), second.getYPercent()));
        double overlap = overlapWidth * overlapHeight;
        double smaller = Math.min(first.getWidthPercent() * first.getHeightPercent(), second.getWidthPercent() * second.getHeightPercent());
        return smaller == 0 ? 0 : overlap / smaller;
    }

    private double clamp(double value, double min, double max) {
        return Math.min(max, Math.max(min, value));
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
