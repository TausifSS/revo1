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
import com.reservo.backend.entity.Staff;

@Repository
public class StaffRepository {

    private static final String COLLECTION = "staff_members";

    private final Firestore firestore;

    public StaffRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save a new staff member or update an existing one.
     */
    public Staff save(Staff staff) {

        try {

            if (staff.getId() == null) {
                staff.setId(generateId());
            }

            if (staff.getCreatedAt() == null) {
                staff.setCreatedAt(Instant.now());
            }

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(staff.getId()))
                    .set(staff)
                    .get();

            return staff;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to save staff member",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save staff member",
                    e
            );
        }
    }

    /**
     * Find staff member by ID.
     */
    public Optional<Staff> findById(String id) {

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

            Staff staff =
                    document.toObject(Staff.class);

            return Optional.ofNullable(staff);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to find staff member",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find staff member",
                    e
            );
        }
    }

    /**
     * Find all staff members belonging to a resort.
     */
    public List<Staff> findByResortId(String resortId) {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo("resortId", resortId)
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            List<Staff> staffMembers = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                Staff staff =
                        document.toObject(Staff.class);

                if (staff != null) {
                    staffMembers.add(staff);
                }
            }

            return staffMembers;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to fetch staff members for resort",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to fetch staff members for resort",
                    e
            );
        }
    }

    /**
     * Get all staff members.
     */
    public List<Staff> findAll() {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore
                            .collection(COLLECTION)
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            List<Staff> staffMembers = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                Staff staff =
                        document.toObject(Staff.class);

                if (staff != null) {
                    staffMembers.add(staff);
                }
            }

            return staffMembers;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to load staff members",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load staff members",
                    e
            );
        }
    }

    /**
     * Delete a staff member.
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
                    "Failed to delete staff member",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete staff member",
                    e
            );
        }
    }

    /**
     * Check whether a staff member exists.
     */
    public boolean existsById(String id) {
        return findById(id).isPresent();
    }

    /**
     * Generate a numeric ID.
     *
     * We keep Long IDs so existing Reservo
     * services/controllers need minimal changes.
     */
    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }
}