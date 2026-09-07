package com.reservo.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Repository
public class AvailabilityBlockRepository {
    private static final String COLLECTION = "availability_blocks";
    private final Firestore firestore;

    public AvailabilityBlockRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    private String documentId(String resortId, LocalDate date) {
        return String.valueOf(resortId) + "_" + date;
    }

    public void block(String resortId, LocalDate date) {
        try {
            firestore.collection(COLLECTION)
                    .document(documentId(resortId, date))
                    .set(java.util.Map.of(
                            "resortId", String.valueOf(resortId),
                            "date", date.toString(),
                            "blocked", true,
                            "updatedAt", com.google.cloud.Timestamp.now()
                    )).get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while blocking date", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to block date", e);
        }
    }

    public void unblock(String resortId, LocalDate date) {
        try {
            firestore.collection(COLLECTION)
                    .document(documentId(resortId, date))
                    .delete().get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while unblocking date", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to unblock date", e);
        }
    }

    public boolean isBlocked(String resortId, LocalDate date) {
        try {
            return firestore.collection(COLLECTION)
                    .document(documentId(resortId, date))
                    .get().get().exists();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while checking blocked date", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to check blocked date", e);
        }
    }

    public List<LocalDate> findBlockedDates(String resortId, LocalDate from, LocalDate to) {
        try {
            List<QueryDocumentSnapshot> docs = firestore.collection(COLLECTION)
                    .whereEqualTo("resortId", String.valueOf(resortId))
                    .get().get().getDocuments();

            return docs.stream()
                    .map(d -> {
                        Object value = d.get("date");
                        try { return LocalDate.parse(String.valueOf(value)); }
                        catch (Exception e) { return null; }
                    })
                    .filter(java.util.Objects::nonNull)
                    .filter(d -> !d.isBefore(from) && d.isBefore(to))
                    .collect(Collectors.toList());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while loading blocked dates", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to load blocked dates", e);
        }
    }
}
