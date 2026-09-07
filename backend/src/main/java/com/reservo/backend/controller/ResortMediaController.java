package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class ResortMediaController {

    @Value("${app.media.storage-dir:uploads/media}")
    private String storageDirectory;

    private Path storagePath() {
        return Paths.get(storageDirectory).toAbsolutePath().normalize();
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("File cannot be empty");
            }
            String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
            if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
                throw new IllegalArgumentException("Only image and video files are allowed");
            }
            if (file.getSize() > 25L * 1024 * 1024) {
                throw new IllegalArgumentException("Media file must be 25 MB or smaller");
            }

            Path storage = storagePath();
            Files.createDirectories(storage);

            String original = file.getOriginalFilename() == null ? "media" : file.getOriginalFilename();
            String extension = "";
            int dot = original.lastIndexOf('.');
            if (dot >= 0) extension = original.substring(dot).replaceAll("[^A-Za-z0-9.]", "");

            String fileName = UUID.randomUUID() + extension;
            Path target = storage.resolve(fileName).normalize();
            if (!target.startsWith(storage)) {
                throw new IllegalArgumentException("Invalid file name");
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String url = "/api/v1/media/files/" + fileName;
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("fileUrl", url, "fileName", original),
                    "Media uploaded successfully"));
        } catch (IOException e) {
            throw new RuntimeException("Could not store media file", e);
        }
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> get(@PathVariable String filename) {
        try {
            Path storage = storagePath();
            Path file = storage.resolve(filename).normalize();

            if (!file.startsWith(storage)) {
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(file);
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            if (contentType != null) {
                try {
                    mediaType = MediaType.parseMediaType(contentType);
                } catch (Exception ignored) { }
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
