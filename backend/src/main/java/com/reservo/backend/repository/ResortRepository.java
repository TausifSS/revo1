package com.reservo.backend.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.reservo.backend.entity.Resort;

@Repository
public class ResortRepository {

    private static final String COLLECTION = "resorts";

    private final Firestore firestore;

    public ResortRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    // =========================================================
    // SAVE
    // =========================================================

    public Resort save(Resort resort) {

        try {
            if (resort.getId() == null || resort.getId().isBlank()) {
                resort.setId(
                        firestore.collection(COLLECTION)
                                .document()
                                .getId()
                );
            }

            if (resort.getCreatedAt() == null) {
                resort.setCreatedAt(Instant.now());
            }

            // Resort.id is intentionally excluded from Firestore fields.
            // The Firestore document ID is the canonical resort ID.
            firestore.collection(COLLECTION)
                    .document(resort.getId())
                    .set(resort)
                    .get();

            return resort;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while saving resort", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to save resort", e);
        }
    }

    // =========================================================
    // FIND BY ID
    // =========================================================

    public Optional<Resort> findById(String id) {

        try {
            var document = firestore.collection(COLLECTION)
                    .document(id)
                    .get()
                    .get();

            if (!document.exists()) {
                return Optional.empty();
            }

            return Optional.of(convertDocument(document));

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while finding resort", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to find resort", e);
        }
    }

    // =========================================================
    // FIND ALL
    // =========================================================

    public List<Resort> findAll() {

        try {
            List<QueryDocumentSnapshot> documents = firestore
                    .collection(COLLECTION)
                    .get()
                    .get()
                    .getDocuments();

            return convertDocuments(documents);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while loading resorts", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to load resorts", e);
        }
    }

    // =========================================================
    // FIND BY STATUS
    // =========================================================

    public List<Resort> findByStatus(Resort.ResortStatus status) {

        try {
            List<QueryDocumentSnapshot> documents = firestore
                    .collection(COLLECTION)
                    .whereEqualTo("status", status.name())
                    .get()
                    .get()
                    .getDocuments();

            return convertDocuments(documents);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(
                    "Interrupted while finding resorts by status", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to find resorts by status", e);
        }
    }

    // =========================================================
    // FIND BY OWNER
    // =========================================================

    public List<Resort> findByOwnerId(String ownerId) {

        // Do not query Firestore directly by ownerId here because the
        // existing database may contain ownerId as either String or Number.
        // Read the documents and normalize the value during conversion.
        return findAll().stream()
                .filter(resort -> ownerId != null
                        && ownerId.equals(resort.getOwnerId()))
                .toList();
    }

    // =========================================================
    // SEARCH
    // =========================================================

    public List<Resort> search(String search) {

        List<Resort> resorts = findAll();

        if (search == null || search.isBlank()) {
            return resorts;
        }

        String value = search.trim().toLowerCase();

        return resorts.stream()
                .filter(resort -> {
                    boolean nameMatch = resort.getName() != null
                            && resort.getName().toLowerCase().contains(value);

                    boolean locationMatch = resort.getLocation() != null
                            && resort.getLocation().toLowerCase().contains(value);

                    return nameMatch || locationMatch;
                })
                .toList();
    }

    // =========================================================
    // LOCATION SEARCH
    // =========================================================

    public List<Resort> findByLocationContainingIgnoreCase(String location) {

        List<Resort> resorts = findAll();

        if (location == null || location.isBlank()) {
            return resorts;
        }

        String value = location.trim().toLowerCase();

        return resorts.stream()
                .filter(resort -> resort.getLocation() != null
                        && resort.getLocation().toLowerCase().contains(value))
                .toList();
    }

    // =========================================================
    // NAME OR LOCATION SEARCH
    // =========================================================

    public List<Resort> findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(
            String name,
            String location
    ) {

        List<Resort> resorts = findAll();

        String nameValue = name == null ? "" : name.trim().toLowerCase();
        String locationValue = location == null ? "" : location.trim().toLowerCase();

        return resorts.stream()
                .filter(resort -> {
                    boolean nameMatch = resort.getName() != null
                            && resort.getName().toLowerCase().contains(nameValue);

                    boolean locationMatch = resort.getLocation() != null
                            && resort.getLocation().toLowerCase().contains(locationValue);

                    return nameMatch || locationMatch;
                })
                .toList();
    }

    // =========================================================
    // COUNT BY STATUS
    // =========================================================

    public long countByStatus(Resort.ResortStatus status) {
        return findByStatus(status).size();
    }

    // =========================================================
    // DELETE
    // =========================================================

    public void deleteById(String id) {

        try {
            firestore.collection(COLLECTION)
                    .document(id)
                    .delete()
                    .get();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while deleting resort", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to delete resort", e);
        }
    }

    // =========================================================
    // FIRESTORE -> ENTITY CONVERSION
    // =========================================================

    private List<Resort> convertDocuments(List<QueryDocumentSnapshot> documents) {

        List<Resort> resorts = new ArrayList<>();

        for (QueryDocumentSnapshot document : documents) {
            resorts.add(convertDocument(document));
        }

        return resorts;
    }

    /**
     * Converts a Firestore document without using document.toObject(Resort.class).
     *
     * This is intentional. The existing Firestore data contains legacy values
     * where fields such as id/ownerId may have been stored as numeric values.
     * The document ID is always the canonical Resort.id.
     */
    private Resort convertDocument(com.google.cloud.firestore.DocumentSnapshot document) {

        Resort resort = new Resort();

        // Canonical ID: ALWAYS the Firestore document ID.
        resort.setId(document.getId());

        resort.setName(asString(document.get("name")));
        resort.setLocation(asString(document.get("location")));
        resort.setDescription(asString(document.get("description")));
        resort.setImageUrl(asString(document.get("imageUrl")));
        resort.setFeaturedTag(asString(document.get("featuredTag")));
        resort.setCategory(asString(document.get("category")));
        resort.setGalleryUrls(asString(document.get("galleryUrls")));
        resort.setVideoUrls(asString(document.get("videoUrls")));
        resort.setHighlights(asString(document.get("highlights")));
        resort.setAmenities(asString(document.get("amenities")));

        // Legacy-safe owner ID conversion: Long/Integer/String -> String.
        resort.setOwnerId(asString(document.get("ownerId")));

        resort.setRating(asDouble(document.get("rating")));
        resort.setReviewCount(asInteger(document.get("reviewCount")));
        resort.setDiscountPercentage(asInteger(document.get("discountPercentage")));
        resort.setGuests(asInteger(document.get("guests")));
        resort.setBedrooms(asInteger(document.get("bedrooms")));
        resort.setBeds(asInteger(document.get("beds")));
        resort.setBathrooms(asInteger(document.get("bathrooms")));

        resort.setPricePerNight(asBigDecimal(document.get("pricePerNight")));

        String status = asString(document.get("status"));
        if (status != null && !status.isBlank()) {
            try {
                resort.setStatus(Resort.ResortStatus.valueOf(status));
            } catch (IllegalArgumentException ignored) {
                resort.setStatus(null);
            }
        }

        resort.setCreatedAt(asInstant(document.get("createdAt")));

        return resort;
    }

    // =========================================================
    // TYPE NORMALIZATION HELPERS
    // =========================================================

    private String asString(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof List<?> list) {
            return list.stream()
                    .map(this::asString)
                    .filter(valueString -> valueString != null)
                    .reduce((a, b) -> a + "," + b)
                    .orElse("");
        }

        return String.valueOf(value);
    }

    private Integer asInteger(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Number number) {
            return number.intValue();
        }

        try {
            return Integer.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Double asDouble(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Number number) {
            return number.doubleValue();
        }

        try {
            return Double.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal asBigDecimal(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }

        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }

        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Instant asInstant(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Timestamp timestamp) {
            return timestamp.toDate().toInstant();
        }

        if (value instanceof Date date) {
            return date.toInstant();
        }

        if (value instanceof Instant instant) {
            return instant;
        }

        String text = value.toString().trim();

        if (text.isBlank()) {
            return null;
        }

        try {
            return Instant.parse(text);
        } catch (DateTimeParseException ignored) {
            // Legacy values may be stored without timezone information.
            try {
                return LocalDateTime.parse(
                                text,
                                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                        )
                        .atZone(java.time.ZoneId.systemDefault())
                        .toInstant();
            } catch (DateTimeParseException ignoredAgain) {
                return null;
            }
        }
    }
}
