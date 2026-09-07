package com.reservo.backend.entity;

import com.google.cloud.firestore.annotation.Exclude;

import java.time.Instant;

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
public class AdminAuditLog {

    /** Firestore document ID. */
    private String id;

    private String adminUsername;
    private String action;
    private String targetEntity;
    private String targetId;
    private String details;
    private String ipAddress;

    @Builder.Default
    private Instant timestamp = Instant.now();
    /**
     * The canonical entity ID is the Firestore document ID.
     * Do not read/write a separate `id` field from/to Firestore.
     */
    @Exclude
    public String getId() {
        return id;
    }

}
