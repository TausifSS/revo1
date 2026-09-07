package com.reservo.backend.repository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.reservo.backend.entity.LoyaltyTransaction;

@Repository
public class LoyaltyTransactionRepository {

    private static final String COLLECTION =
            "loyalty_transactions";

    private final Firestore firestore;

    public LoyaltyTransactionRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save or update a loyalty transaction.
     */
    public LoyaltyTransaction save(
            LoyaltyTransaction transaction
    ) {

        try {

            if (transaction.getId() == null) {
                transaction.setId(generateId());
            }

            if (transaction.getCreatedAt() == null) {
                transaction.setCreatedAt(
                        java.time.Instant.now()
                );
            }

            firestore
                    .collection(COLLECTION)
                    .document(
                            String.valueOf(transaction.getId())
                    )
                    .set(transaction)
                    .get();

            return transaction;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while saving loyalty transaction",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save loyalty transaction",
                    e
            );
        }
    }

    /**
     * Find transaction by ID.
     */
    public Optional<LoyaltyTransaction> findById(
            String id
    ) {

        try {

            var document =
                    firestore
                            .collection(COLLECTION)
                            .document(String.valueOf(id))
                            .get()
                            .get();

            if (!document.exists()) {
                return Optional.empty();
            }

            LoyaltyTransaction transaction =
                    document.toObject(
                            LoyaltyTransaction.class
                    );

            if (transaction != null) {
                transaction.setId(id);
            }

            return Optional.ofNullable(transaction);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding loyalty transaction",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find loyalty transaction",
                    e
            );
        }
    }

    /**
     * Find all loyalty transactions for a user,
     * newest first.
     */
    public List<LoyaltyTransaction>
    findByUserIdOrderByCreatedAtDesc(
            String userId
    ) {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo(
                                    "userId",
                                    userId
                            )
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            List<LoyaltyTransaction> transactions =
                    new ArrayList<>();

            for (QueryDocumentSnapshot document :
                    documents) {

                LoyaltyTransaction transaction =
                        document.toObject(
                                LoyaltyTransaction.class
                        );

                if (transaction != null) {

                    transaction.setId(
                            document.getId()
                    );

                    transactions.add(transaction);
                }
            }

            // Firestore query does not need to rely on
            // a composite index for this simple operation.
            transactions.sort(
                    Comparator.comparing(
                            LoyaltyTransaction::getCreatedAt,
                            Comparator.nullsLast(
                                    Comparator.reverseOrder()
                            )
                    )
            );

            return transactions;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while loading loyalty transactions",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load loyalty transactions",
                    e
            );
        }
    }

    /**
     * Get all loyalty transactions.
     */
    public List<LoyaltyTransaction> findAll() {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .get()
                            .get()
                            .getDocuments();

            List<LoyaltyTransaction> transactions =
                    new ArrayList<>();

            for (QueryDocumentSnapshot document :
                    documents) {

                LoyaltyTransaction transaction =
                        document.toObject(
                                LoyaltyTransaction.class
                        );

                if (transaction != null) {

                    transaction.setId(
                            document.getId()
                    );

                    transactions.add(transaction);
                }
            }

            return transactions;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while loading loyalty transactions",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load loyalty transactions",
                    e
            );
        }
    }

    /**
     * Delete a loyalty transaction.
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
                    "Interrupted while deleting loyalty transaction",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete loyalty transaction",
                    e
            );
        }
    }

    /**
     * Generate a numeric ID to maintain compatibility
     * with the existing Reservo backend.
     */
    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }
}