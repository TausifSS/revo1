package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.ResortPost;
import com.reservo.backend.repository.ResortPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/resorts")
@RequiredArgsConstructor
public class ResortPostController {

    private final ResortPostRepository resortPostRepository;

    @GetMapping("/{resortId}/posts")
    public ResponseEntity<ApiResponse<List<ResortPost>>> getPostsByResort(@PathVariable String resortId) {
        List<ResortPost> posts = resortPostRepository.findByResortIdOrderByCreatedAtDesc(resortId);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    @PostMapping("/{resortId}/posts")
    public ResponseEntity<ApiResponse<ResortPost>> createPost(@PathVariable String resortId, @RequestBody ResortPost post) {
        post.setResortId(resortId);
        ResortPost saved = resortPostRepository.save(post);
        return ResponseEntity.ok(ApiResponse.success(saved, "Social post added successfully"));
    }
}
