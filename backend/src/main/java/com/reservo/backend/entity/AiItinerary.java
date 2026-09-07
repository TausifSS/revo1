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
public class AiItinerary {

    /** Firestore document ID. */
    private String id;

    /** Optional Firestore document ID of the registered user. */
    private String userId;

    private String destination;
    private Integer durationDays;
    private String budgetLevel;
    private String itineraryJson;

    @Builder.Default
    private Instant createdAt = Instant.now();
    /**
     * The canonical entity ID is the Firestore document ID.
     * Do not read/write a separate `id` field from/to Firestore.
     */
    @Exclude
    public String getId() {
        return id;
    }

}
