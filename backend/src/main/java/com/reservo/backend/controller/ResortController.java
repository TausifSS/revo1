package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.Resort;
import com.reservo.backend.service.ResortService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/resorts")
@RequiredArgsConstructor
public class ResortController {

    private final ResortService resortService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Resort>>> getAllResorts() {
        return ResponseEntity.ok(ApiResponse.success(resortService.getAllApprovedResorts()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Resort>> getResortById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(resortService.getResortById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Resort>>> searchResorts(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "query", required = false) String query) {
        String searchTerm = (search != null && !search.isBlank()) ? search
                : (location != null && !location.isBlank()) ? location
                : (query != null && !query.isBlank()) ? query : "";
        return ResponseEntity.ok(
                ApiResponse.success(
                        resortService.searchResorts(searchTerm)
                )
        );
    }
    @GetMapping("/filter")
    public ResponseEntity<ApiResponse<List<Resort>>> filterResorts(
        @RequestParam(required = false) String location,
        @RequestParam(required = false) BigDecimal minPrice,
        @RequestParam(required = false) BigDecimal maxPrice,
        @RequestParam(required = false) Double minRating) {

        return ResponseEntity.ok(
            ApiResponse.success(
                    resortService.filterResorts(
                            location,
                            minPrice,
                            maxPrice,
                            minRating
                    )
            )
    );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Resort>> createResort(@RequestBody Resort resort) {
        Resort created = resortService.createResort(resort);
        return ResponseEntity.ok(ApiResponse.success(created, "Resort submitted for approval"));
    }

    @GetMapping("/admin-all")
    public ResponseEntity<ApiResponse<List<Resort>>> getAdminAllResorts() {
        return ResponseEntity.ok(ApiResponse.success(resortService.getAllResortsForAdmin()));
    }

    @PostMapping("/update-status")
    public ResponseEntity<ApiResponse<Resort>> updateResortStatus(
            @RequestParam String resortId,
            @RequestParam Resort.ResortStatus status) {
        Resort updated = resortService.updateResortStatus(resortId, status);
        return ResponseEntity.ok(ApiResponse.success(updated, "Resort status updated successfully"));
    }

    @PostMapping("/request-changes")
    public ResponseEntity<ApiResponse<Resort>> requestChanges(
            @RequestParam String resortId,
            @RequestBody Map<String, String> body) {
        String comment = body.get("comment");
        Resort updated = resortService.requestChanges(resortId, comment);
        return ResponseEntity.ok(ApiResponse.success(updated, "Changes requested successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Resort>> updateResort(
            @PathVariable String id,
            @RequestBody Resort resort) {

        Resort updated = resortService.updateResortByOwner(id, resort);

        return ResponseEntity.ok(
                ApiResponse.success(
                        updated,
                        "Property updated and submitted for Admin approval"
                )
        );
    }

    @GetMapping("/my-properties")
    public ResponseEntity<ApiResponse<List<Resort>>> getMyProperties() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        List<Resort> myResorts = resortService.getResortsByOwnerEmail(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(myResorts, "Owner properties retrieved successfully"));
    }
}
