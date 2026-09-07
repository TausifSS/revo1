package com.reservo.backend.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.reservo.backend.entity.Offer;

@Repository
public class OfferRepository {

    private static final String COLLECTION = "offers";

    private final Firestore firestore;

    public OfferRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save a new offer or update an existing offer.
     */
    public Offer save(Offer offer) {

        try {

            if (offer.getId() == null) {
                offer.setId(generateId());
            }

            if (offer.getCreatedAt() == null) {
                offer.setCreatedAt(Instant.now());
            }

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(offer.getId()))
                    .set(offer)
                    .get();

            return offer;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to save offer",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save offer",
                    e
            );
        }
    }

    /**
     * Find offer by Firestore/numeric ID.
     */
    public Optional<Offer> findById(String id) {

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

            Offer offer = document.toObject(Offer.class);

            if (offer != null) {
                offer.setId(id);
            }

            return Optional.ofNullable(offer);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to find offer",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find offer",
                    e
            );
        }
    }

    /**
     * Find offer by offer code.
     */
    public Optional<Offer> findByCode(String code) {

        if (code == null || code.isBlank()) {
            return Optional.empty();
        }

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo("code", code.trim())
                            .limit(1)
                            .get()
                            .get()
                            .getDocuments();

            if (documents.isEmpty()) {
                return Optional.empty();
            }

            QueryDocumentSnapshot document = documents.get(0);

            Offer offer = document.toObject(Offer.class);

            if (offer != null && offer.getId() == null) {
                try {
                    offer.setId(document.getId());
                } catch (NumberFormatException ignored) {
                    // Keep existing ID if document ID is not numeric.
                }
            }

            return Optional.ofNullable(offer);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to find offer by code",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find offer by code",
                    e
            );
        }
    }

    /**
     * Return all offers.
     */
    public List<Offer> findAll() {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .get()
                            .get()
                            .getDocuments();

            List<Offer> offers = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                Offer offer =
                        document.toObject(Offer.class);

                if (offer != null) {

                    if (offer.getId() == null) {
                        try {
                            offer.setId(
                                    document.getId()
                            );
                        } catch (NumberFormatException ignored) {
                            // Ignore non-numeric Firestore IDs.
                        }
                    }

                    offers.add(offer);
                }
            }

            return offers;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to load offers",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load offers",
                    e
            );
        }
    }

    /**
     * Delete an offer by ID.
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
                    "Failed to delete offer",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete offer",
                    e
            );
        }
    }

    /**
     * Check whether an offer exists.
     */
    public boolean existsById(String id) {
        return findById(id).isPresent();
    }

    /**
     * Generate the next numeric ID.
     *
     * We retain Long IDs so the rest of the
     * Reservo application doesn't need to change.
     */
    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }
}