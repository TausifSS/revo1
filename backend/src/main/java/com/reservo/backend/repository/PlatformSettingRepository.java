package com.reservo.backend.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.reservo.backend.entity.PlatformSetting;

@Repository
public class PlatformSettingRepository {

    private static final String COLLECTION =
            "platform_settings";

    private final Firestore firestore;

    public PlatformSettingRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save or update a platform setting.
     */
    public PlatformSetting save(
            PlatformSetting setting
    ) {

        try {

            if (setting.getId() == null) {
                setting.setId(generateId());
            }

            setting.setUpdatedAt(Instant.now());

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(setting.getId()))
                    .set(setting)
                    .get();

            return setting;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to save platform setting",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save platform setting",
                    e
            );
        }
    }

    /**
     * Find setting by setting key.
     */
    public Optional<PlatformSetting> findBySettingKey(
            String settingKey
    ) {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo(
                                    "settingKey",
                                    settingKey
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

            PlatformSetting setting =
                    document.toObject(
                            PlatformSetting.class
                    );

            if (setting != null) {

                try {
                    setting.setId(
                            document.getId()
                    );
                } catch (NumberFormatException ignored) {
                    // Keep existing ID if document ID isn't numeric.
                }
            }

            return Optional.ofNullable(setting);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to find platform setting",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find platform setting",
                    e
            );
        }
    }

    /**
     * Find setting by ID.
     */
    public Optional<PlatformSetting> findById(
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

            PlatformSetting setting =
                    document.toObject(
                            PlatformSetting.class
                    );

            if (setting != null) {
                setting.setId(id);
            }

            return Optional.ofNullable(setting);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to find platform setting",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find platform setting",
                    e
            );
        }
    }

    /**
     * Return all platform settings.
     */
    public List<PlatformSetting> findAll() {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .get()
                            .get()
                            .getDocuments();

            List<PlatformSetting> settings =
                    new ArrayList<>();

            for (QueryDocumentSnapshot document :
                    documents) {

                PlatformSetting setting =
                        document.toObject(
                                PlatformSetting.class
                        );

                if (setting != null) {

                    try {
                        setting.setId(
                                document.getId()
                        );
                    } catch (NumberFormatException ignored) {
                        // Ignore non-numeric document IDs.
                    }

                    settings.add(setting);
                }
            }

            return settings;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to load platform settings",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load platform settings",
                    e
            );
        }
    }

    /**
     * Delete a platform setting.
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
                    "Failed to delete platform setting",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete platform setting",
                    e
            );
        }
    }

    /**
     * Generate the next numeric ID.
     */
    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }
}