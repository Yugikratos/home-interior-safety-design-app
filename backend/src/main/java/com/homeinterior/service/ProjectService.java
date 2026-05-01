package com.homeinterior.service;

import com.homeinterior.config.AppProperties;
import com.homeinterior.dto.BlueprintFile;
import com.homeinterior.dto.ProjectDtos.*;
import com.homeinterior.exception.ApiNotFoundException;
import com.homeinterior.exception.ApiValidationException;
import com.homeinterior.model.*;
import com.homeinterior.repository.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProjectService {
    private static final Set<String> ROOM_TYPES = Set.of("bedroom", "living room", "kitchen", "bathroom", "dining room");
    private static final Set<String> STYLES = Set.of("modern", "minimal", "classic", "industrial");
    private static final Set<String> BUDGETS = Set.of("low", "medium", "high");
    private static final Set<String> CONTENT_TYPES = Set.of("application/pdf", "image/png", "image/jpeg");
    private static final Set<String> EXTENSIONS = Set.of(".pdf", ".png", ".jpg", ".jpeg");
    private static final long MAX_UPLOAD_BYTES = 10L * 1024L * 1024L;
    private static final double DEFAULT_DETECTED_ROOM_LENGTH = 12.0;
    private static final double DEFAULT_DETECTED_ROOM_WIDTH = 10.0;

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final FurnitureItemRepository furnitureItemRepository;
    private final BlueprintRepository blueprintRepository;
    private final DesignPreferenceRepository preferenceRepository;
    private final AppProperties properties;

    public ProjectService(ProjectRepository projectRepository, UserRepository userRepository, RoomRepository roomRepository,
                          FurnitureItemRepository furnitureItemRepository, BlueprintRepository blueprintRepository, DesignPreferenceRepository preferenceRepository,
                          AppProperties properties) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.furnitureItemRepository = furnitureItemRepository;
        this.blueprintRepository = blueprintRepository;
        this.preferenceRepository = preferenceRepository;
        this.properties = properties;
    }

    public List<ProjectResponse> list(String email) {
        return projectRepository.findByUserEmailOrderByCreatedAtDesc(email).stream().map(this::toProjectResponse).toList();
    }

    public ProjectDetailResponse detail(Long id, String email) {
        Project project = ownedProject(id, email);
        return new ProjectDetailResponse(toProjectResponse(project), rooms(id), preferenceRepository.findByProjectId(id).map(this::toPreferenceResponse).orElse(null));
    }

    public ProjectResponse create(ProjectRequest request, String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        Project project = new Project();
        project.setName(request.name().trim());
        project.setDescription(cleanOptional(request.description()));
        project.setUser(user);
        return toProjectResponse(projectRepository.save(project));
    }

    public ProjectResponse update(Long id, ProjectRequest request, String email) {
        Project project = ownedProject(id, email);
        project.setName(request.name().trim());
        project.setDescription(cleanOptional(request.description()));
        return toProjectResponse(projectRepository.save(project));
    }

    public void delete(Long id, String email) {
        projectRepository.delete(ownedProject(id, email));
    }

    @Transactional
    public BlueprintResponse uploadBlueprint(Long projectId, MultipartFile file, String email) throws IOException {
        Project project = ownedProject(projectId, email);
        validateUpload(file);
        Path uploadDir = Path.of(properties.getUploadDir()).toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);
        String originalName = Objects.requireNonNullElse(file.getOriginalFilename(), "blueprint");
        String safeName = UUID.randomUUID() + "-" + originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path target = uploadDir.resolve(safeName).normalize();
        if (!target.startsWith(uploadDir)) {
            throw new ApiValidationException("Invalid upload path");
        }
        file.transferTo(target);

        Blueprint blueprint = blueprintRepository.findByProjectId(projectId).orElseGet(Blueprint::new);
        String previousFile = blueprint.getStoredFileName();
        blueprint.setProject(project);
        blueprint.setOriginalFileName(originalName);
        blueprint.setStoredFileName(safeName);
        blueprint.setContentType(file.getContentType());
        blueprint.setSizeBytes(file.getSize());
        Blueprint saved = blueprintRepository.save(blueprint);
        deletePreviousBlueprint(uploadDir, previousFile, safeName);
        return toBlueprintResponse(saved);
    }

    public BlueprintFile blueprintFile(Long projectId, String email) throws IOException {
        ownedProject(projectId, email);
        Blueprint blueprint = blueprintRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ApiNotFoundException("Blueprint not found"));
        Path uploadDir = Path.of(properties.getUploadDir()).toAbsolutePath().normalize();
        Path filePath = uploadDir.resolve(blueprint.getStoredFileName()).normalize();
        if (!filePath.startsWith(uploadDir) || !Files.exists(filePath)) {
            throw new ApiNotFoundException("Blueprint file not found");
        }
        Resource resource = new UrlResource(filePath.toUri());
        return new BlueprintFile(resource, blueprint.getOriginalFileName(), blueprint.getContentType());
    }

    public List<RoomResponse> rooms(Long projectId, String email) {
        ownedProject(projectId, email);
        return rooms(projectId);
    }

    public RoomResponse addRoom(Long projectId, RoomRequest request, String email) {
        Project project = ownedProject(projectId, email);
        Room room = new Room();
        room.setProject(project);
        applyRoom(room, request);
        return toRoomResponse(roomRepository.save(room));
    }

    public RoomResponse updateRoom(Long projectId, Long roomId, RoomRequest request, String email) {
        ownedProject(projectId, email);
        Room room = roomRepository.findById(roomId)
                .filter(existing -> Objects.equals(existing.getProject().getId(), projectId))
                .orElseThrow(() -> new ApiNotFoundException("Room not found"));
        applyRoom(room, request);
        return toRoomResponse(roomRepository.save(room));
    }

    public void deleteRoom(Long projectId, Long roomId, String email) {
        ownedProject(projectId, email);
        Room room = roomRepository.findById(roomId)
                .filter(existing -> Objects.equals(existing.getProject().getId(), projectId))
                .orElseThrow(() -> new ApiNotFoundException("Room not found"));
        roomRepository.delete(room);
    }

    @Transactional
    public List<RoomResponse> detectRoomsFromBlueprint(Long projectId, String email) {
        Project project = ownedProject(projectId, email);
        Blueprint blueprint = blueprintRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ApiNotFoundException("Blueprint not found"));
        if (blueprint.getContentType() == null || !blueprint.getContentType().startsWith("image/")) {
            throw new ApiValidationException("Auto detection is available for PNG and JPG blueprints only");
        }

        Path uploadDir = Path.of(properties.getUploadDir()).toAbsolutePath().normalize();
        Path filePath = uploadDir.resolve(blueprint.getStoredFileName()).normalize();
        if (!filePath.startsWith(uploadDir) || !Files.exists(filePath)) {
            throw new ApiNotFoundException("Blueprint file not found");
        }

        List<BlueprintDetectionResponse> detections = requestBlueprintDetections(filePath);
        int existingRooms = roomRepository.findByProjectIdOrderByIdAsc(projectId).size();
        int index = 1;
        for (BlueprintDetectionResponse detection : detections) {
            Room room = new Room();
            room.setProject(project);
            room.setName("Detected Room " + (existingRooms + index));
            room.setType("Bedroom");
            room.setLength(DEFAULT_DETECTED_ROOM_LENGTH);
            room.setWidth(DEFAULT_DETECTED_ROOM_WIDTH);
            room.setMapX(detection.xPercent());
            room.setMapY(detection.yPercent());
            room.setMapWidth(detection.widthPercent());
            room.setMapHeight(detection.heightPercent());
            roomRepository.save(room);
            index++;
        }
        return rooms(projectId);
    }

    public FurnitureResponse addFurniture(Long projectId, Long roomId, FurnitureRequest request, String email) {
        Room room = ownedRoom(projectId, roomId, email);
        FurnitureItem furniture = new FurnitureItem();
        furniture.setRoom(room);
        applyFurniture(furniture, request);
        return toFurnitureResponse(furnitureItemRepository.save(furniture));
    }

    public FurnitureResponse updateFurniture(Long projectId, Long roomId, Long furnitureId, FurnitureRequest request, String email) {
        ownedRoom(projectId, roomId, email);
        FurnitureItem furniture = furnitureItemRepository.findById(furnitureId)
                .filter(existing -> Objects.equals(existing.getRoom().getId(), roomId))
                .filter(existing -> Objects.equals(existing.getRoom().getProject().getId(), projectId))
                .orElseThrow(() -> new ApiNotFoundException("Furniture item not found"));
        applyFurniture(furniture, request);
        return toFurnitureResponse(furnitureItemRepository.save(furniture));
    }

    public void deleteFurniture(Long projectId, Long roomId, Long furnitureId, String email) {
        ownedRoom(projectId, roomId, email);
        FurnitureItem furniture = furnitureItemRepository.findById(furnitureId)
                .filter(existing -> Objects.equals(existing.getRoom().getId(), roomId))
                .filter(existing -> Objects.equals(existing.getRoom().getProject().getId(), projectId))
                .orElseThrow(() -> new ApiNotFoundException("Furniture item not found"));
        furnitureItemRepository.delete(furniture);
    }

    @Transactional
    public List<FurnitureResponse> autoArrangeFurniture(Long projectId, Long roomId, String email) {
        Room room = ownedRoom(projectId, roomId, email);
        furnitureItemRepository.deleteAll(furnitureItemRepository.findByRoomIdOrderByIdAsc(roomId));
        List<FurnitureItem> arranged = autoFurnitureForRoom(room).stream()
                .peek(item -> item.setRoom(room))
                .map(furnitureItemRepository::save)
                .toList();
        return arranged.stream().map(this::toFurnitureResponse).toList();
    }

    private void applyRoom(Room room, RoomRequest request) {
        validateAllowed(ROOM_TYPES, request.type(), "Unsupported room type");
        room.setName(request.name().trim());
        room.setType(request.type().trim());
        room.setLength(request.length());
        room.setWidth(request.width());
        if (hasAnyMappingValue(request)) {
            validateMapping(request);
            room.setMapX(request.mapX());
            room.setMapY(request.mapY());
            room.setMapWidth(request.mapWidth());
            room.setMapHeight(request.mapHeight());
        }
    }

    public PreferenceResponse getPreference(Long projectId, String email) {
        ownedProject(projectId, email);
        return preferenceRepository.findByProjectId(projectId).map(this::toPreferenceResponse).orElse(null);
    }

    public PreferenceResponse savePreference(Long projectId, PreferenceRequest request, String email) {
        Project project = ownedProject(projectId, email);
        validateAllowed(STYLES, request.style(), "Unsupported style");
        validateAllowed(BUDGETS, request.budget(), "Unsupported budget");
        DesignPreference preference = preferenceRepository.findByProjectId(projectId).orElseGet(DesignPreference::new);
        preference.setProject(project);
        preference.setStyle(request.style().trim());
        preference.setBudget(request.budget().trim());
        preference.setColorPalette(cleanOptional(request.colorPalette()));
        return toPreferenceResponse(preferenceRepository.save(preference));
    }

    private Project ownedProject(Long id, String email) {
        return projectRepository.findByIdAndUserEmail(id, email).orElseThrow(() -> new ApiNotFoundException("Project not found"));
    }

    private List<RoomResponse> rooms(Long projectId) {
        return roomRepository.findByProjectIdOrderByIdAsc(projectId).stream().map(this::toRoomResponse).toList();
    }

    private Room ownedRoom(Long projectId, Long roomId, String email) {
        ownedProject(projectId, email);
        return roomRepository.findById(roomId)
                .filter(existing -> Objects.equals(existing.getProject().getId(), projectId))
                .orElseThrow(() -> new ApiNotFoundException("Room not found"));
    }

    private ProjectResponse toProjectResponse(Project project) {
        BlueprintResponse blueprint = blueprintRepository.findByProjectId(project.getId()).map(this::toBlueprintResponse).orElse(null);
        return new ProjectResponse(project.getId(), project.getName(), project.getDescription(), project.getCreatedAt(), blueprint);
    }

    private BlueprintResponse toBlueprintResponse(Blueprint blueprint) {
        return new BlueprintResponse(blueprint.getId(), blueprint.getOriginalFileName(), blueprint.getContentType(), blueprint.getSizeBytes(), blueprint.getUploadedAt());
    }

    private RoomResponse toRoomResponse(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getType(),
                room.getLength(),
                room.getWidth(),
                room.getMapX(),
                room.getMapY(),
                room.getMapWidth(),
                room.getMapHeight(),
                furnitureItemRepository.findByRoomIdOrderByIdAsc(room.getId()).stream().map(this::toFurnitureResponse).toList());
    }

    private FurnitureResponse toFurnitureResponse(FurnitureItem furniture) {
        return new FurnitureResponse(furniture.getId(), furniture.getType(), furniture.getXPercent(), furniture.getYPercent(), furniture.getWidthPercent(), furniture.getHeightPercent(), furniture.getRotationAngle());
    }

    private List<BlueprintDetectionResponse> requestBlueprintDetections(Path filePath) {
        try {
            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            HttpEntity<FileSystemResource> fileEntity = new HttpEntity<>(new FileSystemResource(filePath), fileHeaders);
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileEntity);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<BlueprintDetectionResponse[]> response = new RestTemplate().postForEntity(
                    properties.getBlueprintProcessorUrl() + "/process-blueprint",
                    request,
                    BlueprintDetectionResponse[].class);
            BlueprintDetectionResponse[] responseBody = response.getBody();
            return responseBody == null ? List.of() : List.of(responseBody);
        } catch (Exception ex) {
            throw new ApiValidationException("Could not process blueprint image");
        }
    }

    private PreferenceResponse toPreferenceResponse(DesignPreference preference) {
        return new PreferenceResponse(preference.getId(), preference.getStyle(), preference.getBudget(), preference.getColorPalette());
    }

    private void validateAllowed(Set<String> allowed, String value, String message) {
        if (value == null || !allowed.contains(value.trim().toLowerCase(Locale.ROOT))) {
            throw new ApiValidationException(message);
        }
    }

    private boolean hasAnyMappingValue(RoomRequest request) {
        return request.mapX() != null || request.mapY() != null || request.mapWidth() != null || request.mapHeight() != null;
    }

    private void validateMapping(RoomRequest request) {
        if (request.mapX() == null || request.mapY() == null || request.mapWidth() == null || request.mapHeight() == null) {
            throw new ApiValidationException("Complete room mapping coordinates are required");
        }
        if (request.mapX() < 0 || request.mapY() < 0 || request.mapWidth() <= 0 || request.mapHeight() <= 0) {
            throw new ApiValidationException("Room mapping coordinates must be positive");
        }
    }

    private void applyFurniture(FurnitureItem furniture, FurnitureRequest request) {
        furniture.setType(request.type().trim());
        if (request.xPercent() + request.widthPercent() > 100 || request.yPercent() + request.heightPercent() > 100) {
            throw new ApiValidationException("Furniture must stay inside room bounds");
        }
        furniture.setXPercent(request.xPercent());
        furniture.setYPercent(request.yPercent());
        furniture.setWidthPercent(request.widthPercent());
        furniture.setHeightPercent(request.heightPercent());
        furniture.setRotationAngle(request.rotationAngle() == null ? 0 : request.rotationAngle());
    }

    private List<FurnitureItem> autoFurnitureForRoom(Room room) {
        String type = room.getType().toLowerCase(Locale.ROOT);
        boolean narrow = room.getWidth() > 0 && room.getLength() / room.getWidth() > 1.8;
        if (type.contains("bedroom")) {
            return narrow
                    ? List.of(furniture("Bed", 8, 8, 42, 32, 0), furniture("Wardrobe", 70, 8, 18, 42, 0))
                    : List.of(furniture("Bed", 8, 12, 38, 34, 0), furniture("Wardrobe", 72, 10, 18, 42, 0), furniture("Table", 52, 58, 16, 16, 0));
        }
        if (type.contains("living")) {
            return List.of(furniture("Sofa", 18, 58, 34, 20, 0), furniture("TV unit", 22, 12, 30, 12, 0), furniture("Table", 38, 38, 18, 18, 0));
        }
        if (type.contains("dining")) {
            return List.of(furniture("Table", 36, 34, 28, 24, 0), furniture("Sofa", 12, 72, 22, 14, 0));
        }
        if (type.contains("kitchen")) {
            return List.of(furniture("Table", 36, 42, 24, 18, 0), furniture("Wardrobe", 6, 8, 18, 72, 0));
        }
        return List.of(furniture("Table", 38, 38, 24, 22, 0));
    }

    private FurnitureItem furniture(String type, double xPercent, double yPercent, double widthPercent, double heightPercent, double rotationAngle) {
        FurnitureItem item = new FurnitureItem();
        item.setType(type);
        item.setXPercent(xPercent);
        item.setYPercent(yPercent);
        item.setWidthPercent(widthPercent);
        item.setHeightPercent(heightPercent);
        item.setRotationAngle(rotationAngle);
        return item;
    }

    private void validateUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiValidationException("Blueprint file is required");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new ApiValidationException("Blueprint file must be 10MB or smaller");
        }
        String originalName = Objects.requireNonNullElse(file.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        boolean extensionAllowed = EXTENSIONS.stream().anyMatch(originalName::endsWith);
        boolean contentTypeAllowed = file.getContentType() != null && CONTENT_TYPES.contains(file.getContentType().toLowerCase(Locale.ROOT));
        if (!extensionAllowed || !contentTypeAllowed) {
            throw new ApiValidationException("Blueprint must be a PDF, PNG, JPG, or JPEG file");
        }
    }

    private void deletePreviousBlueprint(Path uploadDir, String previousFile, String currentFile) throws IOException {
        if (previousFile == null || previousFile.equals(currentFile)) {
            return;
        }
        Path previous = uploadDir.resolve(previousFile).normalize();
        if (previous.startsWith(uploadDir)) {
            Files.deleteIfExists(previous);
        }
    }

    private String cleanOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
