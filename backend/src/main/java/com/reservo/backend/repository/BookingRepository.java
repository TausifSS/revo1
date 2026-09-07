package com.reservo.backend.repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.Transaction;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.reservo.backend.entity.Booking;

@Repository
public class BookingRepository {

    private static final String COLLECTION = "bookings";

    private final Firestore firestore;

    public BookingRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Atomically creates a booking only when the selected room has no
     * overlapping active booking and none of the requested nights has a
     * host-level availability block.
     *
     * The deterministic room/night lock documents are the concurrency guard:
     * two simultaneous checkout requests for the same room/night cannot both
     * create the lock, even if both requests initially observe no booking.
     */
    public Booking createIfAvailable(Booking booking) {
        return createIfAvailable(booking,
                booking.getAssignedRoomIds() != null && !booking.getAssignedRoomIds().isEmpty()
                        ? booking.getAssignedRoomIds()
                        : java.util.List.of(booking.getRoomId()));
    }

    /**
     * Atomically assigns the requested number of rooms from the supplied
     * candidate rooms. A room is available only when it has no overlapping
     * active booking, no booking lock for any requested night, and the
     * property is not blocked for any requested night.
     */
    public Booking createIfAvailable(Booking booking, List<String> candidateRoomIds) {
        if (booking.getId() == null || booking.getId().isBlank()) {
            booking.setId(firestore.collection(COLLECTION).document().getId());
        }

        final int requestedRooms = Math.max(1,
                booking.getRoomsCount() == null ? 1 : booking.getRoomsCount());

        try {
            return firestore.runTransaction(transaction -> {
                QuerySnapshot snapshot = transaction.get(
                        firestore.collection(COLLECTION)
                                .whereEqualTo("resortId", String.valueOf(booking.getResortId()))
                ).get();

                List<Booking> overlappingBookings = new ArrayList<>();
                for (DocumentSnapshot document : snapshot.getDocuments()) {
                    Booking existing = fromDocument(document);
                    if (existing == null
                            || existing.getCheckInDate() == null
                            || existing.getCheckOutDate() == null
                            || existing.getStatus() == Booking.BookingStatus.CANCELLED) {
                        continue;
                    }
                    boolean overlaps = existing.getCheckInDate().isBefore(booking.getCheckOutDate())
                            && existing.getCheckOutDate().isAfter(booking.getCheckInDate());
                    if (overlaps) {
                        overlappingBookings.add(existing);
                    }
                }

                // A host block makes the whole property unavailable for the
                // affected night(s).
                for (LocalDate date = booking.getCheckInDate();
                     date.isBefore(booking.getCheckOutDate());
                     date = date.plusDays(1)) {
                    String blockId = String.valueOf(booking.getResortId()) + "_" + date;
                    DocumentSnapshot block = transaction.get(
                            firestore.collection("availability_blocks").document(blockId)
                    ).get();
                    if (block.exists()) {
                        throw new IllegalStateException(
                                "This property is not available for " + date + ". Please choose different dates.");
                    }
                }

                List<String> candidates = candidateRoomIds == null
                        ? new ArrayList<>()
                        : candidateRoomIds.stream()
                            .filter(java.util.Objects::nonNull)
                            .map(String::valueOf)
                            .filter(id -> !id.isBlank())
                            .distinct()
                            .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

                if (candidates.isEmpty()) {
                    throw new IllegalStateException("No rooms are configured for this property.");
                }

                List<String> selectedRooms = new ArrayList<>();

                for (String roomId : candidates) {
                    boolean overlapsExistingRoom = overlappingBookings.stream().anyMatch(existing -> {
                        if (existing.getAssignedRoomIds() != null && !existing.getAssignedRoomIds().isEmpty()) {
                            return existing.getAssignedRoomIds().contains(roomId);
                        }
                        return roomId.equals(existing.getRoomId());
                    });
                    if (overlapsExistingRoom) continue;

                    boolean locked = false;
                    for (LocalDate date = booking.getCheckInDate();
                         date.isBefore(booking.getCheckOutDate());
                         date = date.plusDays(1)) {
                        String lockId = roomId + "_" + date;
                        DocumentSnapshot lock = transaction.get(
                                firestore.collection("booking_locks").document(lockId)
                        ).get();
                        if (lock.exists()) {
                            locked = true;
                            break;
                        }
                    }

                    if (!locked) {
                        selectedRooms.add(roomId);
                        if (selectedRooms.size() == requestedRooms) break;
                    }
                }

                if (selectedRooms.size() < requestedRooms) {
                    throw new IllegalStateException(
                            requestedRooms == 1
                                    ? "The selected room is no longer available for these dates. Please choose different dates."
                                    : "Only " + selectedRooms.size() + " room(s) are available for the selected dates. Please reduce the number of rooms or choose different dates."
                    );
                }

                booking.setAssignedRoomIds(new ArrayList<>(selectedRooms));
                booking.setRoomId(selectedRooms.get(0));

                transaction.create(
                        firestore.collection(COLLECTION).document(booking.getId()),
                        toFirestoreMap(booking)
                );

                for (String roomId : selectedRooms) {
                    for (LocalDate date = booking.getCheckInDate();
                         date.isBefore(booking.getCheckOutDate());
                         date = date.plusDays(1)) {
                        String lockId = roomId + "_" + date;
                        DocumentReference lockRef =
                                firestore.collection("booking_locks").document(lockId);
                        transaction.create(lockRef, java.util.Map.of(
                                "bookingId", booking.getId(),
                                "bookingCode", booking.getBookingCode(),
                                "roomId", roomId,
                                "resortId", booking.getResortId(),
                                "date", date.toString()
                        ));
                    }
                }

                return booking;
            }).get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while checking booking availability", e);
        } catch (java.util.concurrent.ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof IllegalStateException) {
                throw (IllegalStateException) cause;
            }
            throw new RuntimeException(
                    "Could not create booking because the selected rooms/dates are no longer available.",
                    cause != null ? cause : e
            );
        }
    }

    /**
     * Removes the deterministic room/night locks for a cancelled booking.
     */
    public void releaseBookingLocks(Booking booking) {
        if (booking == null
                || booking.getCheckInDate() == null
                || booking.getCheckOutDate() == null) {
            return;
        }

        List<String> roomIds = booking.getAssignedRoomIds() != null
                ? new ArrayList<>(booking.getAssignedRoomIds())
                : new ArrayList<>();
        if (roomIds.isEmpty() && booking.getRoomId() != null) {
            roomIds.add(booking.getRoomId());
        }
        if (roomIds.isEmpty()) return;

        try {
            firestore.runTransaction(transaction -> {
                for (String roomId : roomIds) {
                    for (LocalDate date = booking.getCheckInDate();
                         date.isBefore(booking.getCheckOutDate());
                         date = date.plusDays(1)) {
                        String lockId = String.valueOf(roomId) + "_" + date;
                        DocumentReference lockRef =
                                firestore.collection("booking_locks").document(lockId);
                        DocumentSnapshot lock = transaction.get(lockRef).get();
                        if (lock.exists()) {
                            Object lockBookingId = lock.get("bookingId");
                            if (lockBookingId == null
                                    || String.valueOf(lockBookingId).equals(booking.getId())) {
                                transaction.delete(lockRef);
                            }
                        }
                    }
                }
                return null;
            }).get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while releasing booking availability", e);
        } catch (java.util.concurrent.ExecutionException e) {
            throw new RuntimeException("Failed to release booking availability", e);
        }
    }

    // =========================================================
    // SAVE
    // =========================================================

    public Booking save(Booking booking) {

        try {

            if (booking.getId() == null || booking.getId().isBlank()) {

                booking.setId(
                        firestore
                                .collection(COLLECTION)
                                .document()
                                .getId()
                );
            }

            if (booking.getCreatedAt() == null) {
                booking.setCreatedAt(LocalDate.now()
                        .atStartOfDay()
                        .toInstant(java.time.ZoneOffset.UTC));
            }

            // Do NOT pass Booking directly to Firestore. Booking contains
            // java.time.LocalDate fields; Firestore's bean mapper treats
            // LocalDate as a bean and can fail with "conflicting getters
            // for name getEra". Persist explicit Firestore-safe values.
            firestore
                    .collection(COLLECTION)
                    .document(booking.getId())
                    .set(toFirestoreMap(booking))
                    .get();

            return booking;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while saving booking",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save booking",
                    e
            );
        }
    }

    // =========================================================
    // FIND BY ID
    // =========================================================

    public Optional<Booking> findById(String id) {

        try {

            DocumentSnapshot document =
                    firestore
                            .collection(COLLECTION)
                            .document(id)
                            .get()
                            .get();

            if (!document.exists()) {
                return Optional.empty();
            }

            return Optional.ofNullable(fromDocument(document));

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding booking",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find booking",
                    e
            );
        }
    }

    // =========================================================
    // FIND BY BOOKING CODE
    // =========================================================

    public Optional<Booking> findByBookingCode(
            String bookingCode
    ) {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo(
                                    "bookingCode",
                                    bookingCode
                            )
                            .limit(1)
                            .get()
                            .get()
                            .getDocuments();

            if (documents.isEmpty()) {
                return Optional.empty();
            }

            QueryDocumentSnapshot document =
                    documents.get(0);

            return Optional.ofNullable(fromDocument(document));

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding booking by code",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find booking by code",
                    e
            );
        }
    }

    // =========================================================
    // FIND BY USER
    // =========================================================

    public List<Booking> findByUserId(String userId) {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo(
                                    "userId",
                                    userId
                            )
                            .get()
                            .get()
                            .getDocuments();

            return convertDocuments(documents);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding user bookings",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find user bookings",
                    e
            );
        }
    }

    // =========================================================
    // FIND USER BOOKINGS ORDERED
    // =========================================================

    public List<Booking> findByUserIdOrderByCreatedAtDesc(
            String userId
    ) {

        List<Booking> bookings =
                findByUserId(userId);

        bookings.sort(
                (a, b) -> {

                    if (a.getCreatedAt() == null &&
                            b.getCreatedAt() == null) {
                        return 0;
                    }

                    if (a.getCreatedAt() == null) {
                        return 1;
                    }

                    if (b.getCreatedAt() == null) {
                        return -1;
                    }

                    return b.getCreatedAt()
                            .compareTo(a.getCreatedAt());
                }
        );

        return bookings;
    }

    // =========================================================
    // FIND ALL
    // =========================================================

    public List<Booking> findAll() {

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
                    "Interrupted while loading bookings",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load bookings",
                    e
            );
        }
    }

    // =========================================================
    // COUNT
    // =========================================================

    public long count() {
        return findAll().size();
    }

    // =========================================================
    // COUNT BY STATUS
    // =========================================================

    public long countByStatus(
            Booking.BookingStatus status
    ) {

        try {

            return firestore
                    .collection(COLLECTION)
                    .whereEqualTo(
                            "status",
                            status.name()
                    )
                    .get()
                    .get()
                    .size();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while counting bookings",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to count bookings",
                    e
            );
        }
    }

    // =========================================================
    // DELETE
    // =========================================================

    public void deleteById(String id) {

        try {

            firestore
                    .collection(COLLECTION)
                    .document(id)
                    .delete()
                    .get();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while deleting booking",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete booking",
                    e
            );
        }
    }

    // =========================================================
    // OVERLAPPING BOOKINGS
    // =========================================================

    public List<Booking> findOverlappingBookings(
            String resortId,
            LocalDate checkInDate,
            LocalDate checkOutDate
    ) {

        List<Booking> bookings =
                findAll();

        return bookings.stream()

                .filter(b ->
                        b.getResortId() != null &&
                        b.getResortId().equals(resortId)
                )

                .filter(b ->
                        b.getStatus() !=
                                Booking.BookingStatus.CANCELLED
                )

                .filter(b ->
                        b.getCheckInDate() != null &&
                        b.getCheckOutDate() != null
                )

                .filter(b ->
                        b.getCheckInDate()
                                .isBefore(checkOutDate)
                                &&
                        b.getCheckOutDate()
                                .isAfter(checkInDate)
                )

                .toList();
    }

    // =========================================================
    // TOTAL REVENUE
    // =========================================================

    public java.math.BigDecimal calculateTotalRevenue() {

        return findAll()
                .stream()
                .filter(b ->
                        b.getStatus() ==
                                Booking.BookingStatus.CONFIRMED
                        ||
                        b.getStatus() ==
                                Booking.BookingStatus.COMPLETED
                )
                .map(Booking::getTotalAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(
                        java.math.BigDecimal.ZERO,
                        java.math.BigDecimal::add
                );
    }

    // =========================================================
    // BOOKINGS BY SOURCE
    // =========================================================

    public java.util.Map<String, Long> countBookingsBySource() {

        return findAll()
                .stream()
                .filter(b -> b.getBookingSource() != null)
                .collect(
                        java.util.stream.Collectors.groupingBy(
                                b -> b.getBookingSource().name(),
                                java.util.stream.Collectors.counting()
                        )
                );
    }

    // =========================================================
    // CONVERT DOCUMENTS
    // =========================================================

    private List<Booking> convertDocuments(
            List<QueryDocumentSnapshot> documents
    ) {

        List<Booking> bookings =
                new ArrayList<>();

        for (QueryDocumentSnapshot document :
                documents) {

            Booking booking = fromDocument(document);

            if (booking != null) {
                bookings.add(booking);
            }
        }

        return bookings;
    }
    private java.util.Map<String, Object> toFirestoreMap(Booking booking) {
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("bookingCode", booking.getBookingCode());
        data.put("userId", booking.getUserId());
        data.put("resortId", booking.getResortId());
        data.put("roomId", booking.getRoomId());
        data.put("assignedRoomIds", booking.getAssignedRoomIds() != null
                ? booking.getAssignedRoomIds() : java.util.List.of(booking.getRoomId()));
        data.put("checkInDate", booking.getCheckInDate() != null ? booking.getCheckInDate().toString() : null);
        data.put("checkOutDate", booking.getCheckOutDate() != null ? booking.getCheckOutDate().toString() : null);
        data.put("guestsCount", booking.getGuestsCount());
        data.put("roomsCount", booking.getRoomsCount());
        data.put("totalAmount", booking.getTotalAmount() != null ? booking.getTotalAmount().doubleValue() : 0d);
        data.put("guestName", booking.getGuestName());
        data.put("guestPhone", booking.getGuestPhone());
        data.put("appliedCouponCode", booking.getAppliedCouponCode());
        data.put("discountAmount", booking.getDiscountAmount() != null ? booking.getDiscountAmount().doubleValue() : 0d);
        data.put("rewardPointsUsed", booking.getRewardPointsUsed());
        data.put("rewardPointsValue", booking.getRewardPointsValue() != null ? booking.getRewardPointsValue().doubleValue() : 0d);
        data.put("status", booking.getStatus() != null ? booking.getStatus().name() : Booking.BookingStatus.PENDING.name());
        data.put("bookingSource", booking.getBookingSource() != null ? booking.getBookingSource().name() : Booking.BookingSource.DIRECT.name());
        if (booking.getCreatedAt() != null) {
            java.time.Instant i = booking.getCreatedAt();
            data.put("createdAt", Timestamp.ofTimeSecondsAndNanos(i.getEpochSecond(), i.getNano()));
        }
        return data;
    }

    // =========================================================
    // SAFE FIRESTORE -> BOOKING MAPPING
    // =========================================================
    // Older documents may contain createdAt as a String while newer
    // documents may contain a Firestore Timestamp. Never use
    // document.toObject(Booking.class) here because that mapper cannot
    // safely handle both representations.
    private Booking fromDocument(DocumentSnapshot document) {
        java.util.Map<String, Object> d = document.getData();
        if (d == null) return null;

        Booking booking = new Booking();
        booking.setId(document.getId());
        booking.setBookingCode(asString(d.get("bookingCode")));
        booking.setUserId(asString(d.get("userId")));
        booking.setResortId(asString(d.get("resortId")));
        booking.setRoomId(asString(d.get("roomId")));
        Object assigned = d.get("assignedRoomIds");
        if (assigned instanceof java.util.List<?> list) {
            booking.setAssignedRoomIds(list.stream()
                    .filter(java.util.Objects::nonNull)
                    .map(String::valueOf)
                    .toList());
        } else if (booking.getRoomId() != null) {
            booking.setAssignedRoomIds(new java.util.ArrayList<>(java.util.List.of(booking.getRoomId())));
        }
        booking.setCheckInDate(asLocalDate(d.get("checkInDate")));
        booking.setCheckOutDate(asLocalDate(d.get("checkOutDate")));
        booking.setGuestsCount(asInteger(d.get("guestsCount"), 2));
        booking.setRoomsCount(asInteger(d.get("roomsCount"), 1));
        booking.setTotalAmount(asBigDecimal(d.get("totalAmount")));
        booking.setGuestName(asString(d.get("guestName")));
        booking.setGuestPhone(asString(d.get("guestPhone")));
        booking.setAppliedCouponCode(asString(d.get("appliedCouponCode")));
        booking.setDiscountAmount(defaultZero(d.get("discountAmount")));
        booking.setRewardPointsUsed(asInteger(d.get("rewardPointsUsed"), 0));
        booking.setRewardPointsValue(defaultZero(d.get("rewardPointsValue")));

        String status = asString(d.get("status"));
        if (status != null && !status.isBlank()) {
            try {
                booking.setStatus(Booking.BookingStatus.valueOf(status));
            } catch (IllegalArgumentException ignored) {
                booking.setStatus(Booking.BookingStatus.PENDING);
            }
        }

        String source = asString(d.get("bookingSource"));
        if (source != null && !source.isBlank()) {
            try {
                booking.setBookingSource(Booking.BookingSource.valueOf(source));
            } catch (IllegalArgumentException ignored) {
                booking.setBookingSource(Booking.BookingSource.DIRECT);
            }
        }

        booking.setCreatedAt(asInstant(d.get("createdAt")));
        if (booking.getCreatedAt() == null) {
            booking.setCreatedAt(java.time.Instant.now());
        }

        return booking;
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Integer asInteger(Object value, int defaultValue) {
        if (value == null) return defaultValue;
        if (value instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(value)); }
        catch (Exception e) { return defaultValue; }
    }

    private java.math.BigDecimal asBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof java.math.BigDecimal bd) return bd;
        if (value instanceof Number n) return new java.math.BigDecimal(n.toString());
        try { return new java.math.BigDecimal(String.valueOf(value)); }
        catch (Exception e) { return null; }
    }

    private java.math.BigDecimal defaultZero(Object value) {
        java.math.BigDecimal result = asBigDecimal(value);
        return result != null ? result : java.math.BigDecimal.ZERO;
    }

    private LocalDate asLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof Timestamp ts) {
            return ts.toDate().toInstant().atZone(java.time.ZoneOffset.UTC).toLocalDate();
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant().atZone(java.time.ZoneOffset.UTC).toLocalDate();
        }
        String text = String.valueOf(value);
        try { return LocalDate.parse(text); }
        catch (Exception ignored) {
            try {
                return java.time.Instant.parse(text).atZone(java.time.ZoneOffset.UTC).toLocalDate();
            } catch (Exception ignoredAgain) { return null; }
        }
    }

    private java.time.Instant asInstant(Object value) {
        if (value == null) return null;
        if (value instanceof Timestamp ts) return ts.toDate().toInstant();
        if (value instanceof java.util.Date date) return date.toInstant();
        String text = String.valueOf(value).trim();
        try { return java.time.Instant.parse(text); }
        catch (Exception ignored) {
            try {
                return java.time.LocalDateTime.parse(text)
                        .toInstant(java.time.ZoneOffset.UTC);
            } catch (Exception ignoredAgain) {
                return null;
            }
        }
    }

}