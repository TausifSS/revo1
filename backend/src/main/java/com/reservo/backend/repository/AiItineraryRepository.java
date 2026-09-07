package com.reservo.backend.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.reservo.backend.entity.AiItinerary;

@Repository
public class AiItineraryRepository {

    private static final String COLLECTION =
            "ai_itineraries";

    private final Firestore firestore;

    public AiItineraryRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save or update an itinerary.
     */
    public AiItinerary save(
            AiItinerary itinerary
    ) {

        try {

            if (itinerary.getId() == null) {
                itinerary.setId(generateId());
            }

            if (itinerary.getCreatedAt() == null) {
                itinerary.setCreatedAt(Instant.now());
            }

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(itinerary.getId()))
                    .set(itinerary)
                    .get();

            return itinerary;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to save AI itinerary",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save AI itinerary",
                    e
            );
        }
    }

    /**
     * Find itinerary by ID.
     */
    public Optional<AiItinerary> findById(
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

            AiItinerary itinerary =
                    document.toObject(
                            AiItinerary.class
                    );

            if (itinerary != null) {
                itinerary.setId(id);
            }

            return Optional.ofNullable(itinerary);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to find AI itinerary",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find AI itinerary",
                    e
            );
        }
    }

    /**
     * Find an itinerary matching:
     *
     * destination
     * duration
     * budget level
     *
     * This replaces:
     *
     * findFirstByDestinationIgnoreCaseAndDurationDaysAndBudgetLevelIgnoreCase()
     */
    public Optional<AiItinerary>
    findFirstByDestinationIgnoreCaseAndDurationDaysAndBudgetLevelIgnoreCase(
            String destination,
            Integer durationDays,
            String budgetLevel
    ) {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .get()
                            .get()
                            .getDocuments();

            String destinationSearch =
                    destination == null
                            ? ""
                            : destination.trim()
                                    .toLowerCase();

            String budgetSearch =
                    budgetLevel == null
                            ? ""
                            : budgetLevel.trim()
                                    .toLowerCase();

            for (QueryDocumentSnapshot document :
                    documents) {

                AiItinerary itinerary =
                        document.toObject(
                                AiItinerary.class
                        );

                if (itinerary == null) {
                    continue;
                }

                boolean destinationMatches =
                        itinerary.getDestination() != null
                                && itinerary.getDestination()
                                        .trim()
                                        .equalsIgnoreCase(
                                                destinationSearch
                                        );

                boolean durationMatches =
                        itinerary.getDurationDays() != null
                                && itinerary.getDurationDays()
                                        .equals(durationDays);

                boolean budgetMatches =
                        itinerary.getBudgetLevel() != null
                                && itinerary.getBudgetLevel()
                                        .trim()
                                        .equalsIgnoreCase(
                                                budgetSearch
                                        );

                if (
                        destinationMatches
                                && durationMatches
                                && budgetMatches
                ) {

                    itinerary.setId(
                            document.getId()
                    );

                    return Optional.of(itinerary);
                }
            }

            return Optional.empty();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to search AI itineraries",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to search AI itineraries",
                    e
            );
        }
    }

    /**
     * Return all itineraries.
     */
    public List<AiItinerary> findAll() {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .get()
                            .get()
                            .getDocuments();

            List<AiItinerary> itineraries =
                    new ArrayList<>();

            for (QueryDocumentSnapshot document :
                    documents) {

                AiItinerary itinerary =
                        document.toObject(
                                AiItinerary.class
                        );

                if (itinerary != null) {

                    if (itinerary.getId() == null) {

                        try {
                            itinerary.setId(
                                    document.getId()
                            );
                        } catch (NumberFormatException ignored) {
                        }
                    }

                    itineraries.add(itinerary);
                }
            }

            return itineraries;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to load AI itineraries",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load AI itineraries",
                    e
            );
        }
    }

    /**
     * Delete itinerary.
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
                    "Failed to delete AI itinerary",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete AI itinerary",
                    e
            );
        }
    }

    /**
     * Generate next numeric ID.
     */
    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }
}