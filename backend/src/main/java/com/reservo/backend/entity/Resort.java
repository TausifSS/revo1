package com.reservo.backend.entity;

import java.math.BigDecimal;
import java.time.Instant;

import com.google.cloud.firestore.annotation.Exclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Resort {

    /**
     * Firestore document ID.
     *
     * This is NOT stored/read as a Firestore document field.
     * The repository gets it from document.getId().
     */
    private String id;

    private String name;
    private String location;
    private String description;
    private String imageUrl;
    private BigDecimal pricePerNight;

    @Builder.Default
    private Double rating = 4.5;

    @Builder.Default
    private Integer reviewCount = 0;

    private String featuredTag;
    private Integer discountPercentage;
    private String category;
    private String galleryUrls;
    private String videoUrls;
    private String highlights;
    private String amenities;
    private Integer guests;
    private Integer bedrooms;
    private Integer beds;
    private Integer bathrooms;

    private ResortStatus status;

    /**
     * Firestore document ID of the owner user.
     */
    private String ownerId;

    @Builder.Default
    private Instant createdAt = Instant.now();

    /**
     * IMPORTANT:
     * Firestore must ignore the Resort.id property.
     *
     * The actual ID is taken from:
     * document.getId()
     */
    @Exclude
    public String getId() {
        return id;
    }

    public enum ResortStatus {
        PENDING_APPROVAL,
        APPROVED,
        REJECTED,
        SUSPENDED,
        CHANGES_REQUESTED
    }
}