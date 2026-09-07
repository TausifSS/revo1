package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.Review;
import com.reservo.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/resort/{resortId}")
    public ResponseEntity<ApiResponse<List<Review>>> getReviewsByResort(@PathVariable String resortId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getReviewsByResort(resortId)));
    }

    @PostMapping("/resort/{resortId}")
    public ResponseEntity<ApiResponse<Review>> createReview(
            @PathVariable String resortId,
            @RequestBody Map<String, Object> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Double rating = Double.valueOf(body.get("rating").toString());
        String comment = (String) body.get("comment");
        Review created = reviewService.createReview(auth.getName(), resortId, rating, comment);
        return ResponseEntity.ok(ApiResponse.success(created, "Review posted successfully"));
    }
}
