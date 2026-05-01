package com.homeinterior.controller;

import com.homeinterior.dto.BlueprintFile;
import com.homeinterior.dto.ProjectDtos.*;
import com.homeinterior.model.DesignSuggestion;
import com.homeinterior.model.SafetyRecommendation;
import com.homeinterior.service.ProjectService;
import com.homeinterior.service.SafetyService;
import com.homeinterior.service.SuggestionService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.security.Principal;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/projects")
public class ProjectController {
    private final ProjectService projectService;
    private final SuggestionService suggestionService;
    private final SafetyService safetyService;

    public ProjectController(ProjectService projectService, SuggestionService suggestionService, SafetyService safetyService) {
        this.projectService = projectService;
        this.suggestionService = suggestionService;
        this.safetyService = safetyService;
    }

    @GetMapping
    public List<ProjectResponse> list(Principal principal) {
        return projectService.list(principal.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse create(@Valid @RequestBody ProjectRequest request, Principal principal) {
        return projectService.create(request, principal.getName());
    }

    @GetMapping("/{id}")
    public ProjectDetailResponse detail(@PathVariable Long id, Principal principal) {
        return projectService.detail(id, principal.getName());
    }

    @PutMapping("/{id}")
    public ProjectResponse update(@PathVariable Long id, @Valid @RequestBody ProjectRequest request, Principal principal) {
        return projectService.update(id, request, principal.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Principal principal) {
        projectService.delete(id, principal.getName());
    }

    @PostMapping("/{id}/blueprint")
    public BlueprintResponse uploadBlueprint(@PathVariable Long id, @RequestParam("file") MultipartFile file, Principal principal) throws IOException {
        return projectService.uploadBlueprint(id, file, principal.getName());
    }

    @GetMapping("/{id}/blueprint/file")
    public ResponseEntity<Resource> blueprintFile(@PathVariable Long id, Principal principal) throws IOException {
        BlueprintFile file = projectService.blueprintFile(id, principal.getName());
        MediaType mediaType = file.contentType() == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(file.contentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(file.originalFileName()).build().toString())
                .body(file.resource());
    }

    @GetMapping("/{id}/rooms")
    public List<RoomResponse> rooms(@PathVariable Long id, Principal principal) {
        return projectService.rooms(id, principal.getName());
    }

    @PostMapping("/{id}/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse addRoom(@PathVariable Long id, @Valid @RequestBody RoomRequest request, Principal principal) {
        return projectService.addRoom(id, request, principal.getName());
    }

    @PutMapping("/{id}/rooms/{roomId}")
    public RoomResponse updateRoom(@PathVariable Long id, @PathVariable Long roomId, @Valid @RequestBody RoomRequest request, Principal principal) {
        return projectService.updateRoom(id, roomId, request, principal.getName());
    }

    @DeleteMapping("/{id}/rooms/{roomId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoom(@PathVariable Long id, @PathVariable Long roomId, Principal principal) {
        projectService.deleteRoom(id, roomId, principal.getName());
    }

    @PostMapping("/{id}/rooms/{roomId}/furniture")
    @ResponseStatus(HttpStatus.CREATED)
    public FurnitureResponse addFurniture(@PathVariable Long id, @PathVariable Long roomId, @Valid @RequestBody FurnitureRequest request, Principal principal) {
        return projectService.addFurniture(id, roomId, request, principal.getName());
    }

    @PutMapping("/{id}/rooms/{roomId}/furniture/{furnitureId}")
    public FurnitureResponse updateFurniture(@PathVariable Long id, @PathVariable Long roomId, @PathVariable Long furnitureId,
                                             @Valid @RequestBody FurnitureRequest request, Principal principal) {
        return projectService.updateFurniture(id, roomId, furnitureId, request, principal.getName());
    }

    @DeleteMapping("/{id}/rooms/{roomId}/furniture/{furnitureId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFurniture(@PathVariable Long id, @PathVariable Long roomId, @PathVariable Long furnitureId, Principal principal) {
        projectService.deleteFurniture(id, roomId, furnitureId, principal.getName());
    }

    @GetMapping("/{id}/preferences")
    public PreferenceResponse getPreferences(@PathVariable Long id, Principal principal) {
        return projectService.getPreference(id, principal.getName());
    }

    @PostMapping("/{id}/preferences")
    public PreferenceResponse savePreferences(@PathVariable Long id, @Valid @RequestBody PreferenceRequest request, Principal principal) {
        return projectService.savePreference(id, request, principal.getName());
    }

    @GetMapping("/{id}/suggestions")
    public List<DesignSuggestion> suggestions(@PathVariable Long id, Principal principal) {
        return suggestionService.suggestions(id, principal.getName());
    }

    @GetMapping("/{id}/safety")
    public List<SafetyRecommendation> safety(@PathVariable Long id, Principal principal) {
        return safetyService.recommendations(id, principal.getName());
    }
}
