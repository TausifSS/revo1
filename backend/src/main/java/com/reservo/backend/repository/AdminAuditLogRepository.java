package com.reservo.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.reservo.backend.entity.AdminAuditLog;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class AdminAuditLogRepository {

    private static final String COLLECTION = "admin_audit_logs";

    private final Firestore firestore;

    public AdminAuditLogRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save a new audit log or update an existing one.
     */
    public AdminAuditLog save(AdminAuditLog auditLog) {

        try {

            if (auditLog.getId() == null) {
                auditLog.setId(generateId());
            }

            if (auditLog.getTimestamp() == null) {
                auditLog.setTimestamp(java.time.Instant.now());
            }

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(auditLog.getId()))
                    .set(auditLog)
                    .get();

            return auditLog;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to save admin audit log",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save admin audit log",
                    e
            );
        }
    }

    /**
     * Return the latest 20 audit logs.
     */
    public List<AdminAuditLog> findTop20ByOrderByTimestampDesc() {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .orderBy(
                                    "timestamp",
                                    com.google.cloud.firestore.Query.Direction.DESCENDING
                            )
                            .limit(20)
                            .get()
                            .get()
                            .getDocuments();

            List<AdminAuditLog> logs = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                AdminAuditLog auditLog =
                        document.toObject(AdminAuditLog.class);

                if (auditLog != null) {

                    /*
                     * Make sure the Firestore document ID
                     * is represented in the Java object.
                     */
                    if (auditLog.getId() == null) {
                        try {
                            auditLog.setId(
                                    document.getId()
                            );
                        } catch (NumberFormatException ignored) {
                            // Keep existing ID if it cannot be parsed.
                        }
                    }

                    logs.add(auditLog);
                }
            }

            return logs;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to load admin audit logs",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load admin audit logs",
                    e
            );
        }
    }

    /**
     * Return all audit logs.
     */
    public List<AdminAuditLog> findAll() {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .get()
                            .get()
                            .getDocuments();

            List<AdminAuditLog> logs = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                AdminAuditLog auditLog =
                        document.toObject(AdminAuditLog.class);

                if (auditLog != null) {
                    logs.add(auditLog);
                }
            }

            return logs;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to load admin audit logs",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load admin audit logs",
                    e
            );
        }
    }

    /**
     * Delete an audit log.
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
                    "Failed to delete admin audit log",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete admin audit log",
                    e
            );
        }
    }

    /**
     * Generate the next numeric ID.
     *
     * This keeps compatibility with the existing
     * Long-based IDs used throughout Reservo.
     */
    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }
}