package com.reservo.backend.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.WriteBatch;
import com.reservo.backend.entity.Wishlist;

@Repository
public class WishlistRepository {

    private static final String COLLECTION = "wishlists";

    private final Firestore firestore;

    public WishlistRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save or update wishlist item.
     */
    public Wishlist save(Wishlist wishlist) {

        try {

            if (wishlist.getId() == null || wishlist.getId().isBlank()) {
                wishlist.setId(
                        firestore
                                .collection(COLLECTION)
                                .document()
                                .getId()
                );
            }

            if (wishlist.getAddedAt() == null) {
                wishlist.setAddedAt(Instant.now());
            }

            firestore
                    .collection(COLLECTION)
                    .document(wishlist.getId())
                    .set(wishlist)
                    .get();

            return wishlist;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while saving wishlist",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save wishlist",
                    e
            );
        }
    }

    /**
     * Get all wishlist items for a user.
     */
    public List<Wishlist> findByUserId(String userId) {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo("userId", userId)
                            .get()
                            .get()
                            .getDocuments();

            List<Wishlist> wishlists = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                Wishlist wishlist =
                        document.toObject(Wishlist.class);

                if (wishlist != null) {
                    wishlist.setId(document.getId());
                    wishlists.add(wishlist);
                }
            }

            return wishlists;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while loading wishlist",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load wishlist",
                    e
            );
        }
    }

    /**
     * Find a wishlist item by user and resort.
     */
    public Optional<Wishlist> findByUserIdAndResortId(
            String userId,
            String resortId
    ) {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo("userId", userId)
                            .whereEqualTo("resortId", resortId)
                            .limit(1)
                            .get()
                            .get()
                            .getDocuments();

            if (documents.isEmpty()) {
                return Optional.empty();
            }

            QueryDocumentSnapshot document =
                    documents.get(0);

            Wishlist wishlist =
                    document.toObject(Wishlist.class);

            if (wishlist != null) {
                wishlist.setId(document.getId());
            }

            return Optional.ofNullable(wishlist);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding wishlist item",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find wishlist item",
                    e
            );
        }
    }

    /**
     * Check whether a resort exists in a user's wishlist.
     */
    public boolean existsByUserIdAndResortId(
            String userId,
            String resortId
    ) {
        return findByUserIdAndResortId(userId, resortId)
                .isPresent();
    }

    /**
     * Delete a wishlist item.
     */
    public void delete(Wishlist wishlist) {

        if (wishlist == null || wishlist.getId() == null) {
            return;
        }

        deleteById(wishlist.getId());
    }

    /**
     * Delete wishlist item by Firestore document ID.
     */
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
                    "Interrupted while deleting wishlist item",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete wishlist item",
                    e
            );
        }
    }

    /**
     * Delete all wishlist items for a user.
     */
    public void deleteAll(List<Wishlist> wishlists) {

        if (wishlists == null || wishlists.isEmpty()) {
            return;
        }

        try {

            WriteBatch batch = firestore.batch();

            for (Wishlist wishlist : wishlists) {

                if (wishlist.getId() != null) {

                    batch.delete(
                            firestore
                                    .collection(COLLECTION)
                                    .document(wishlist.getId())
                    );
                }
            }

            batch.commit().get();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while clearing wishlist",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to clear wishlist",
                    e
            );
        }
    }
}