package com.homeinterior.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public class ProjectDtos {
    public record ProjectRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 1000) String description) {}
    public record ProjectResponse(Long id, String name, String description, Instant createdAt, BlueprintResponse blueprint) {}
    public record BlueprintResponse(Long id, String originalFileName, String contentType, long sizeBytes, Instant uploadedAt) {}
    public record RoomRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(max = 80) String type,
            @DecimalMin(value = "0.1") double length,
            @DecimalMin(value = "0.1") double width) {}
    public record RoomResponse(Long id, String name, String type, double length, double width) {}
    public record PreferenceRequest(
            @NotBlank @Size(max = 80) String style,
            @NotBlank @Size(max = 80) String budget,
            @Size(max = 120) String colorPalette) {}
    public record PreferenceResponse(Long id, String style, String budget, String colorPalette) {}
    public record ProjectDetailResponse(ProjectResponse project, List<RoomResponse> rooms, PreferenceResponse preference) {}
}
