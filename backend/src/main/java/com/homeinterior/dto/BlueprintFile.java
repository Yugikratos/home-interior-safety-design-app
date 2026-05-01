package com.homeinterior.dto;

import org.springframework.core.io.Resource;

public record BlueprintFile(Resource resource, String originalFileName, String contentType) {
}
