package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.Room;
import com.reservo.backend.service.AvailabilityService;
import com.reservo.backend.service.AuthService;
import com.reservo.backend.repository.ResortRepository;
import com.reservo.backend.entity.User;
import com.reservo.backend.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;
    private final AuthService authService;
    private final ResortRepository resortRepository;

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<List<Room>>> checkAvailability(
            @RequestParam String resortId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        List<Room> availableRooms = availabilityService.checkAvailability(resortId, checkIn, checkOut);
        return ResponseEntity.ok(ApiResponse.success(availableRooms));
    }

    @PostMapping("/block")
    public ResponseEntity<ApiResponse<String>> setBlocked(
            @RequestParam String resortId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "true") boolean blocked) {
        User user = authService.getAuthenticatedUser();
        if (user.getRole() != User.Role.ROLE_OWNER && user.getRole() != User.Role.ROLE_ADMIN) {
            throw new UnauthorizedException("Only property owners can change availability");
        }
        if (user.getRole() == User.Role.ROLE_OWNER) {
            var resort = resortRepository.findById(resortId)
                    .orElseThrow(() -> new com.reservo.backend.exception.ResourceNotFoundException("Resort not found"));
            if (!user.getId().equals(resort.getOwnerId())) {
                throw new UnauthorizedException("You can only change availability for your own property");
            }
        }
        availabilityService.setDateBlocked(resortId, date, blocked);
        return ResponseEntity.ok(ApiResponse.success(
                blocked ? "BLOCKED" : "AVAILABLE",
                blocked ? "Date blocked successfully" : "Date made available successfully"));
    }

    }
