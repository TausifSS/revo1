package com.reservo.backend.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.reservo.backend.entity.Review;

@Repository
public class ReviewRepository {

    private static final String COLLECTION = "reviews";

    private final Firestore firestore;

    public ReviewRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save a new review or update an existing review.
     */
    public Review save(Review review) {

        try {

            if (review.getId() == null) {
                review.setId(generateId());
            }

            if (review.getCreatedAt() == null) {
                review.setCreatedAt(Instant.now());
            }

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(review.getId()))
                    .set(review)
                    .get();

            return review;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to save review",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save review",
                    e
            );
        }
    }

    /**
     * Find review by ID.
     */
    public Optional<Review> findById(String id) {

        try {

            DocumentSnapshot document =
                    firestore
                            .collection(COLLECTION)
                            .document(String.valueOf(id))
                            .get()
                            .get();

            if (!document.exists()) {
                return Optional.empty();
            }

            Review review =
                    document.toObject(Review.class);

            return Optional.ofNullable(review);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to find review",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find review",
                    e
            );
        }
    }

    /**
     * Find all reviews for a resort.
     */
    public List<Review> findByResortId(String resortId) {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo("resortId", resortId)
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            List<Review> reviews = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                Review review =
                        document.toObject(Review.class);

                if (review != null) {
                    reviews.add(review);
                }
            }

            return reviews;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to fetch reviews for resort",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to fetch reviews for resort",
                    e
            );
        }
    }

    /**
     * Get all reviews.
     */
    public List<Review> findAll() {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore
                            .collection(COLLECTION)
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            List<Review> reviews = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                Review review =
                        document.toObject(Review.class);

                if (review != null) {
                    reviews.add(review);
                }
            }

            return reviews;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to load reviews",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load reviews",
                    e
            );
        }
    }

    /**
     * Delete review by ID.
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
                    "Failed to delete review",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete review",
                    e
            );
        }
    }

    /**
     * Check whether a review exists.
     */
    public boolean existsById(String id) {
        return findById(id).isPresent();
    }

    /**
     * Generate numeric ID.
     *
     * We keep Long IDs so the rest of the Reservo
     * application does not need unnecessary changes.
     */
    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }
}