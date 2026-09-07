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
import com.reservo.backend.entity.ResortDocument;

@Repository
public class ResortDocumentRepository {

    private static final String COLLECTION = "resort_documents";

    private final Firestore firestore;

    public ResortDocumentRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save or update a resort document.
     */
    public ResortDocument save(ResortDocument document) {

        try {

            if (document.getId() == null) {
                document.setId(generateId());
            }

            if (document.getCreatedAt() == null) {
                document.setCreatedAt(Instant.now());
            }

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(document.getId()))
                    .set(document)
                    .get();

            return document;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while saving resort document",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save resort document",
                    e
            );
        }
    }

    /**
     * Find document by ID.
     */
    public Optional<ResortDocument> findById(String id) {

        try {

            DocumentSnapshot snapshot =
                    firestore
                            .collection(COLLECTION)
                            .document(String.valueOf(id))
                            .get()
                            .get();

            if (!snapshot.exists()) {
                return Optional.empty();
            }

            ResortDocument document =
                    snapshot.toObject(ResortDocument.class);

            return Optional.ofNullable(document);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding resort document",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find resort document",
                    e
            );
        }
    }

    /**
     * Find all documents belonging to a resort.
     */
    public List<ResortDocument> findByResortId(String resortId) {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo("resortId", resortId)
                            .get()
                            .get()
                            .getDocuments();

            List<ResortDocument> result =
                    new ArrayList<>();

            for (QueryDocumentSnapshot snapshot : documents) {

                ResortDocument document =
                        snapshot.toObject(ResortDocument.class);

                if (document != null) {
                    result.add(document);
                }
            }

            return result;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding resort documents",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find resort documents",
                    e
            );
        }
    }

    /**
     * Get all resort documents.
     */
    public List<ResortDocument> findAll() {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .get()
                            .get()
                            .getDocuments();

            List<ResortDocument> result =
                    new ArrayList<>();

            for (QueryDocumentSnapshot snapshot : documents) {

                ResortDocument document =
                        snapshot.toObject(ResortDocument.class);

                if (document != null) {
                    result.add(document);
                }
            }

            return result;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while loading resort documents",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load resort documents",
                    e
            );
        }
    }

    /**
     * Delete a document.
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
                    "Interrupted while deleting resort document",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete resort document",
                    e
            );
        }
    }

    /**
     * Generate numeric ID.
     *
     * We keep Long IDs for compatibility
     * with the existing application.
     */
    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }
}