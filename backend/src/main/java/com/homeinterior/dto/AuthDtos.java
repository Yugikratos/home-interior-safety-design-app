package com.homeinterior.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record RegisterRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(min = 6, max = 120) String password) {}
    public record LoginRequest(
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank String password) {}
    public record AuthResponse(String token, Long userId, String name, String email) {}
}
