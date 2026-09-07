package com.reservo.backend.entity;

import com.google.cloud.firestore.annotation.Exclude;

import java.math.BigDecimal;
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
public class Room {

    /** Firestore document ID. */
    private String id;

    /** Firestore document ID of the resort. */
    private String resortId;

    private String roomNumber;
    private String roomType;
    private String description;
    private BigDecimal pricePerNight;
    private Integer capacity;
    private Integer bedCount;
    private String bedType;
    private String imageUrl;

    @Builder.Default
    private RoomStatus status = RoomStatus.AVAILABLE;

    @Builder.Default
    private CleaningStatus cleaningStatus = CleaningStatus.CLEAN;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    public enum RoomStatus {
        AVAILABLE,
        BOOKED,
        MAINTENANCE,
        INACTIVE
    }

    public enum CleaningStatus {
        CLEAN,
        DIRTY,
        IN_PROGRESS,
        INSPECTED
    }

    public void updateTimestamp() {
        this.updatedAt = Instant.now();
    }

    /** Backward-compatible alias for older code. */
    public String getType() {
        return roomType;
    }

    /** Backward-compatible alias for older code. */
    public void setType(String type) {
        this.roomType = type;
    }
    /**
     * The canonical entity ID is the Firestore document ID.
     * Do not read/write a separate `id` field from/to Firestore.
     */
    @Exclude
    public String getId() {
        return id;
    }

}
