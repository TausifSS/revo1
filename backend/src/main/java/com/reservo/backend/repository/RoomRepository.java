package com.reservo.backend.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.reservo.backend.entity.Room;

@Repository
public class RoomRepository {

    private static final String COLLECTION = "rooms";

    private final Firestore firestore;

    public RoomRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    // =========================================================
    // SAVE / UPDATE
    // =========================================================

    public Room save(Room room) {

        try {

            if (room.getId() == null) {
                room.setId(generateId());
            }

            if (room.getCreatedAt() == null) {
                room.setCreatedAt(java.time.Instant.now());
            }

            room.updateTimestamp();

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(room.getId()))
                    .set(toFirestoreMap(room))
                    .get();

            return room;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while saving room",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save room",
                    e
            );
        }
    }

    // =========================================================
    // FIND BY ID
    // =========================================================

    public java.util.Optional<Room> findById(String id) {

        try {
            var document = firestore.collection(COLLECTION)
                    .document(id)
                    .get()
                    .get();

            if (!document.exists()) {
                return java.util.Optional.empty();
            }

            return java.util.Optional.ofNullable(fromDocument(document));

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while finding room", e);
        } catch (java.util.concurrent.ExecutionException e) {
            throw new RuntimeException("Failed to find room", e);
        }
    }

    // =========================================================
    // FIND ALL
    // =========================================================

    public List<Room> findAll() {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .get()
                            .get()
                            .getDocuments();

            return convertDocuments(documents);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while loading rooms",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load rooms",
                    e
            );
        }
    }

    // =========================================================
    // FIND BY RESORT
    // =========================================================

    public List<Room> findByResortId(String resortId) {

    try {

        List<QueryDocumentSnapshot> documents =
                firestore
                        .collection(COLLECTION)
                        .whereEqualTo(
                                "resortId",
                                resortId
                        )
                        .get()
                        .get()
                        .getDocuments();

        List<Room> rooms = convertDocuments(documents);

        // Legacy Firestore data may contain resortId as a number instead of a
        // string. Fall back to a full scan and compare canonical string values
        // so those rooms remain bookable after the ID type was normalized.
        if (rooms.isEmpty()) {
            List<QueryDocumentSnapshot> allDocuments = firestore
                    .collection(COLLECTION)
                    .get()
                    .get()
                    .getDocuments();
            rooms = convertDocuments(allDocuments).stream()
                    .filter(room -> room.getResortId() != null
                            && room.getResortId().equals(String.valueOf(resortId)))
                    .toList();
        }

        return rooms;

    } catch (InterruptedException e) {

        Thread.currentThread().interrupt();

        throw new RuntimeException(
                "Interrupted while finding rooms for resort",
                e
        );

    } catch (ExecutionException e) {

        throw new RuntimeException(
                "Failed to find rooms for resort",
                e
        );
    }
}

    // =========================================================
    // FIND BY STATUS
    // =========================================================

    public List<Room> findByStatus(
            Room.RoomStatus status
    ) {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo(
                                    "status",
                                    status.name()
                            )
                            .get()
                            .get()
                            .getDocuments();

            return convertDocuments(documents);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding rooms by status",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find rooms by status",
                    e
            );
        }
    }

    // =========================================================
    // COUNT BY STATUS
    // =========================================================

    public long countByStatus(
            Room.RoomStatus status
    ) {

        return findByStatus(status).size();
    }

    // =========================================================
    // EXISTS
    // =========================================================

    public boolean existsById(String id) {
        return findById(id).isPresent();
    }

    // =========================================================
    // DELETE
    // =========================================================

    public void deleteById(String id) {

        try {

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(id))
                    .delete()
                    .get();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while deleting room",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete room",
                    e
            );
        }
    }

    // =========================================================
    // CONVERT DOCUMENTS
    // =========================================================

    private List<Room> convertDocuments(
            List<QueryDocumentSnapshot> documents
    ) {

        List<Room> rooms =
                new ArrayList<>();

        for (QueryDocumentSnapshot document :
                documents) {

            Room room =
                    fromDocument(document);

            if (room != null) {

                /*
                 * The application uses Long IDs.
                 *
                 * If the document ID is numeric,
                 * restore it into the entity.
                 */
                if (room.getId() == null) {

                    try {
                        room.setId(
                                document.getId()
                        );
                    } catch (NumberFormatException ignored) {
                        // Keep the value from Firestore
                    }
                }

                rooms.add(room);
            }
        }

        return rooms;
    }

    private java.util.Map<String, Object> toFirestoreMap(Room room) {
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("resortId", room.getResortId());
        data.put("roomNumber", room.getRoomNumber());
        data.put("roomType", room.getRoomType());
        data.put("description", room.getDescription());
        data.put("pricePerNight", room.getPricePerNight() != null ? room.getPricePerNight().doubleValue() : 0d);
        data.put("capacity", room.getCapacity());
        data.put("bedCount", room.getBedCount());
        data.put("bedType", room.getBedType());
        data.put("imageUrl", room.getImageUrl());
        data.put("status", room.getStatus() != null ? room.getStatus().name() : Room.RoomStatus.AVAILABLE.name());
        data.put("cleaningStatus", room.getCleaningStatus() != null ? room.getCleaningStatus().name() : Room.CleaningStatus.CLEAN.name());
        if (room.getCreatedAt() != null) {
            java.time.Instant i = room.getCreatedAt();
            data.put("createdAt", com.google.cloud.Timestamp.ofTimeSecondsAndNanos(i.getEpochSecond(), i.getNano()));
        }
        if (room.getUpdatedAt() != null) {
            java.time.Instant i = room.getUpdatedAt();
            data.put("updatedAt", com.google.cloud.Timestamp.ofTimeSecondsAndNanos(i.getEpochSecond(), i.getNano()));
        }
        return data;
    }

    private Room fromDocument(com.google.cloud.firestore.DocumentSnapshot document) {
        java.util.Map<String, Object> d = document.getData();
        if (d == null) return null;
        Room room = new Room();
        room.setId(document.getId());
        room.setResortId(asString(d.get("resortId")));
        room.setRoomNumber(asString(d.get("roomNumber")));
        String roomType = asString(d.get("roomType"));
        if (roomType == null) roomType = asString(d.get("type"));
        room.setRoomType(roomType);
        room.setDescription(asString(d.get("description")));
        room.setPricePerNight(asBigDecimal(d.get("pricePerNight")));
        room.setCapacity(asInteger(d.get("capacity")));
        room.setBedCount(asInteger(d.get("bedCount")));
        room.setBedType(asString(d.get("bedType")));
        room.setImageUrl(asString(d.get("imageUrl")));
        String status = asString(d.get("status"));
        if (status != null) { try { room.setStatus(Room.RoomStatus.valueOf(status)); } catch (Exception ignored) {} }
        String cleaning = asString(d.get("cleaningStatus"));
        if (cleaning != null) { try { room.setCleaningStatus(Room.CleaningStatus.valueOf(cleaning)); } catch (Exception ignored) {} }
        room.setCreatedAt(asInstant(d.get("createdAt")));
        room.setUpdatedAt(asInstant(d.get("updatedAt")));
        if (room.getCreatedAt() == null) room.setCreatedAt(java.time.Instant.now());
        if (room.getUpdatedAt() == null) room.setUpdatedAt(room.getCreatedAt());
        return room;
    }

    private String asString(Object value) { return value == null ? null : String.valueOf(value); }
    private Integer asInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(value)); } catch (Exception e) { return null; }
    }
    private java.math.BigDecimal asBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof java.math.BigDecimal bd) return bd;
        if (value instanceof Number n) return new java.math.BigDecimal(n.toString());
        try { return new java.math.BigDecimal(String.valueOf(value)); } catch (Exception e) { return null; }
    }
    private java.time.Instant asInstant(Object value) {
        if (value == null) return null;
        if (value instanceof com.google.cloud.Timestamp ts) return ts.toDate().toInstant();
        if (value instanceof java.util.Date date) return date.toInstant();
        String text = String.valueOf(value).trim();
        try { return java.time.Instant.parse(text); } catch (Exception ignored) {}
        try { return java.time.LocalDateTime.parse(text, java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")).toInstant(java.time.ZoneOffset.UTC); } catch (Exception ignored) {}
        return null;
    }

    // =========================================================
    // GENERATE NUMERIC ID
    // =========================================================

    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }
}