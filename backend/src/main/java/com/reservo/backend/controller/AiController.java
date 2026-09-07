package com.reservo.backend.controller;

import com.reservo.backend.dto.AiChatRequest;
import com.reservo.backend.dto.AiChatResponse;
import com.reservo.backend.dto.AiItineraryRequest;
import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.AiChatSession;
import com.reservo.backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chatWithRivo(@RequestBody AiChatRequest request) {
        AiChatResponse response = aiService.handleChat(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Response generated successfully"));
    }

    @PostMapping("/itinerary")
    public ResponseEntity<ApiResponse<String>> generateItinerary(@RequestBody AiItineraryRequest request) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String userEmail = (auth != null) ? auth.getName() : null;
        String itineraryJson = aiService.generateItinerary(request, userEmail);
        return ResponseEntity.ok(ApiResponse.success(itineraryJson, "Itinerary generated successfully"));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<AiChatSession>>> getUserSessions(@RequestParam(required = false) String userId) {
        // Fallback to default user 1 if not specified
        String targetUserId = userId != null ? userId : "1";
        List<AiChatSession> sessions = aiService.getUserSessions(targetUserId);
        return ResponseEntity.ok(ApiResponse.success(sessions, "Sessions retrieved successfully"));
    }
}
