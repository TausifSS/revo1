package com.reservo.backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.ResortDocument;
import com.reservo.backend.repository.ResortDocumentRepository;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class ResortDocumentController {

    private final ResortDocumentRepository resortDocumentRepository;

    private final Path fileStorageLocation =
            Paths.get("uploads/documents")
                    .toAbsolutePath()
                    .normalize();

    @PostConstruct
    public void init() {

        try {

            Files.createDirectories(
                    this.fileStorageLocation
            );

        } catch (Exception ex) {

            throw new RuntimeException(
                    "Could not create document upload directory.",
                    ex
            );
        }
    }

    /**
     * Get all documents for a resort.
     *
     * GET /api/v1/documents/resort/{resortId}
     */
    @GetMapping("/resort/{resortId}")
    public ResponseEntity<ApiResponse<List<ResortDocument>>>
    getDocumentsByResort(
            @PathVariable String resortId
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        resortDocumentRepository
                                .findByResortId(resortId)
                )
        );
    }

    /**
     * Create/save a resort document.
     *
     * POST /api/v1/documents
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ResortDocument>>
    uploadDocument(
            @RequestBody ResortDocument document
    ) {

        ResortDocument saved =
                resortDocumentRepository.save(document);

        return ResponseEntity.ok(
                ApiResponse.success(
                        saved,
                        "Document uploaded for verification"
                )
        );
    }

    /**
     * Upload physical file.
     *
     * POST /api/v1/documents/upload
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>>
    uploadFile(
            @RequestParam("file") MultipartFile file
    ) {

        try {

            if (file == null || file.isEmpty()) {

                throw new IllegalArgumentException(
                        "File cannot be empty"
                );
            }

            String originalFileName =
                    file.getOriginalFilename();

            String extension = "";

            if (originalFileName != null
                    && originalFileName.contains(".")) {

                extension =
                        originalFileName.substring(
                                originalFileName.lastIndexOf(".")
                        );
            }

            String fileName =
                    UUID.randomUUID()
                            + extension;

            Path targetLocation =
                    this.fileStorageLocation
                            .resolve(fileName)
                            .normalize();

            Files.copy(
                    file.getInputStream(),
                    targetLocation,
                    StandardCopyOption.REPLACE_EXISTING
            );

            String fileDownloadUrl =
                    "/api/v1/documents/files/"
                            + fileName;

            Map<String, String> data =
                    new HashMap<>();

            data.put(
                    "fileName",
                    originalFileName
            );

            data.put(
                    "fileUrl",
                    fileDownloadUrl
            );

            data.put(
                    "fileSize",
                    String.format(
                            "%.1f MB",
                            (double) file.getSize()
                                    / (1024 * 1024)
                    )
            );

            return ResponseEntity.ok(
                    ApiResponse.success(
                            data,
                            "File uploaded successfully"
                    )
            );

        } catch (IOException ex) {

            throw new RuntimeException(
                    "Could not store file. Please try again!",
                    ex
            );
        }
    }

    /**
     * Download/view uploaded file.
     *
     * GET /api/v1/documents/files/{filename}
     */
    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource>
    downloadFile(
            @PathVariable String filename,
            HttpServletRequest request
    ) {

        try {

            Path filePath =
                    this.fileStorageLocation
                            .resolve(filename)
                            .normalize();

            // Prevent path traversal
            if (!filePath.startsWith(
                    this.fileStorageLocation
            )) {

                return ResponseEntity
                        .badRequest()
                        .build();
            }

            Resource resource =
                    new UrlResource(
                            filePath.toUri()
                    );

            if (!resource.exists()
                    || !resource.isReadable()) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            String contentType =
                    request
                            .getServletContext()
                            .getMimeType(
                                    resource
                                            .getFile()
                                            .getAbsolutePath()
                            );

            if (contentType == null) {
                contentType =
                        "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(
                            MediaType.parseMediaType(
                                    contentType
                            )
                    )
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\""
                                    + resource.getFilename()
                                    + "\""
                    )
                    .body(resource);

        } catch (Exception ex) {

            return ResponseEntity
                    .internalServerError()
                    .build();
        }
    }

    /**
     * Update verification status.
     *
     * PATCH /api/v1/documents/{id}/status?status=Verified
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ResortDocument>>
    updateDocumentStatus(
            @PathVariable String id,
            @RequestParam String status
    ) {

        ResortDocument document =
                resortDocumentRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found with ID: "
                                                + id
                                )
                        );

        document.setStatus(status);

        ResortDocument updated =
                resortDocumentRepository.save(
                        document
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        updated,
                        "Document verification status updated"
                )
        );
    }
}