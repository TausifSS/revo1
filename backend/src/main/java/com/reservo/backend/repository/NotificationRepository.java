package com.reservo.backend.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.reservo.backend.entity.Notification;

@Repository
public class NotificationRepository {

    private static final String COLLECTION = "notifications";

    private final Firestore firestore;

    public NotificationRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save or update a notification.
     */
    public Notification save(Notification notification) {

        try {

            if (notification.getId() == null) {
                notification.setId(generateId());
            }

            if (notification.getCreatedAt() == null) {
                notification.setCreatedAt(InstantNow());
            }

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(notification.getId()))
                    .set(notification)
                    .get();

            return notification;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to save notification",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save notification",
                    e
            );
        }
    }

    /**
     * Get all notifications for a user.
     *
     * Newest notifications appear first.
     */
    public List<Notification> findByUserIdOrderByCreatedAtDesc(
            String userId
    ) {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo("userId", userId)
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            List<Notification> notifications =
                    convertDocuments(documents);

            notifications.sort(
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

            return notifications;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to fetch user notifications",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to fetch user notifications",
                    e
            );
        }
    }

    /**
     * Get unread notifications for a user.
     *
     * Newest notifications appear first.
     */
    public List<Notification>
    findByUserIdAndReadFalseOrderByCreatedAtDesc(
            String userId
    ) {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo("userId", userId)
                            .whereEqualTo("read", false)
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            List<Notification> notifications =
                    convertDocuments(documents);

            notifications.sort(
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

            return notifications;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to fetch unread notifications",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to fetch unread notifications",
                    e
            );
        }
    }

    /**
     * Find notification by ID.
     */
    public java.util.Optional<Notification> findById(String id) {
        try {
            var document = firestore.collection(COLLECTION)
                    .document(id)
                    .get()
                    .get();
            if (!document.exists()) return java.util.Optional.empty();
            Notification notification = document.toObject(Notification.class);
            if (notification != null && notification.getId() == null) {
                notification.setId(document.getId());
            }
            return java.util.Optional.ofNullable(notification);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to find notification", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to find notification", e);
        }
    }

    public List<Notification> findAll() {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore
                            .collection(COLLECTION)
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            return convertDocuments(documents);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to load notifications",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load notifications",
                    e
            );
        }
    }

    /**
     * Delete notification.
     */
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
                    "Failed to delete notification",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete notification",
                    e
            );
        }
    }

    /**
     * Convert Firestore documents into Notification objects.
     */
    private List<Notification> convertDocuments(
            List<QueryDocumentSnapshot> documents
    ) {

        List<Notification> notifications =
                new ArrayList<>();

        for (QueryDocumentSnapshot document : documents) {

            Notification notification =
                    document.toObject(Notification.class);

            if (notification != null) {

                /*
                 * Keep Firestore document ID available
                 * in the Java object.
                 */
                try {
                    notification.setId(
                            document.getId()
                    );
                } catch (NumberFormatException ignored) {
                    // Ignore non-numeric document IDs.
                }

                notifications.add(notification);
            }
        }

        return notifications;
    }

    /**
     * Generate next numeric ID.
     */
    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }

    /**
     * Get current timestamp.
     */
    private java.time.Instant InstantNow() {
        return java.time.Instant.now();
    }
}