package com.reservo.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialAuthRequestDTO {

    @NotBlank(message = "Firebase ID token is required")
    private String firebaseIdToken;

    private String provider;

    private String role;

    private String name;

    private String photoUrl;
}