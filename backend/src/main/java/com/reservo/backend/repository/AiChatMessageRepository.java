package com.reservo.backend.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.reservo.backend.entity.AiChatMessage;

@Repository
public class AiChatMessageRepository {

    private static final String COLLECTION =
            "ai_chat_messages";

    private final Firestore firestore;

    public AiChatMessageRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save or update an AI chat message.
     */
    public AiChatMessage save(
            AiChatMessage message
    ) {

        try {

            if (message.getId() == null) {
                message.setId(generateId());
            }

            if (message.getCreatedAt() == null) {
                message.setCreatedAt(Instant.now());
            }

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(message.getId()))
                    .set(message)
                    .get();

            return message;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to save AI chat message",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save AI chat message",
                    e
            );
        }
    }

    /**
     * Find messages for a session,
     * oldest first.
     */
    public List<AiChatMessage>
    findBySessionIdOrderByCreatedAtAsc(
            String sessionId
    ) {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo(
                                    "sessionId",
                                    sessionId
                            )
                            .orderBy(
                                    "createdAt",
                                    Query.Direction.ASCENDING
                            )
                            .get()
                            .get()
                            .getDocuments();

            List<AiChatMessage> messages =
                    new ArrayList<>();

            for (QueryDocumentSnapshot document :
                    documents) {

                AiChatMessage message =
                        document.toObject(
                                AiChatMessage.class
                        );

                if (message != null) {

                    if (message.getId() == null) {

                        try {
                            message.setId(
                                    document.getId()
                            );
                        } catch (NumberFormatException ignored) {
                        }
                    }

                    messages.add(message);
                }
            }

            return messages;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to load AI chat messages",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load AI chat messages",
                    e
            );
        }
    }

    /**
     * Find message by ID.
     */
    public java.util.Optional<AiChatMessage> findById(
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
                return java.util.Optional.empty();
            }

            AiChatMessage message =
                    document.toObject(
                            AiChatMessage.class
                    );

            if (message != null) {
                message.setId(id);
            }

            return java.util.Optional.ofNullable(message);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to find AI chat message",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find AI chat message",
                    e
            );
        }
    }

    /**
     * Delete message by ID.
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
                    "Failed to delete AI chat message",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete AI chat message",
                    e
            );
        }
    }

    /**
     * Generate next numeric message ID.
     */
    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }
}