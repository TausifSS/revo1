package com.reservo.backend.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.reservo.backend.entity.User;

@Repository
public class UserRepository {

    private static final String COLLECTION = "users";

    private final Firestore firestore;

    public UserRepository(Firestore firestore) {
        this.firestore = firestore;
    }


    // ============================================================
    // FIND BY ID
    // ============================================================

    public Optional<User> findById(String id) {

        if (id == null || id.isBlank()) {
            return Optional.empty();
        }

        try {

            var snapshot = firestore
                    .collection(COLLECTION)
                    .document(id)
                    .get()
                    .get();

            if (!snapshot.exists()) {
                return Optional.empty();
            }

            User user = mapDocument(snapshot);

            return Optional.ofNullable(user);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding user",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find user",
                    e
            );
        }
    }


    // ============================================================
    // SAVE
    // ============================================================

    public User save(User user) {

        if (user == null) {
            throw new IllegalArgumentException(
                    "User cannot be null"
            );
        }

        try {

            // ----------------------------------------------------
            // CREATE FIRESTORE DOCUMENT ID
            // ----------------------------------------------------

            if (user.getId() == null
                    || user.getId().isBlank()) {

                user.setId(
                        firestore
                                .collection(COLLECTION)
                                .document()
                                .getId()
                );
            }

            // ----------------------------------------------------
            // CREATED AT
            // ----------------------------------------------------

            if (user.getCreatedAt() == null) {
                user.setCreatedAt(Instant.now());
            }

            // ----------------------------------------------------
            // UPDATE TIMESTAMP
            // ----------------------------------------------------

            user.updateTimestamp();

            // ----------------------------------------------------
            // SAVE TO FIRESTORE
            // ----------------------------------------------------

            firestore
                    .collection(COLLECTION)
                    .document(user.getId())
                    .set(user)
                    .get();

            return user;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while saving user",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save user",
                    e
            );
        }
    }


    // ============================================================
    // FIND BY EMAIL
    // ============================================================

    public Optional<User> findByEmail(
            String email) {

        if (email == null || email.isBlank()) {
            return Optional.empty();
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        try {

            Query query = firestore
                    .collection(COLLECTION)
                    .whereEqualTo(
                            "email",
                            normalizedEmail
                    )
                    .limit(1);

            List<QueryDocumentSnapshot> documents =
                    query
                            .get()
                            .get()
                            .getDocuments();

            if (documents.isEmpty()) {
                return Optional.empty();
            }

            User user = mapDocument(documents.get(0));

            return Optional.ofNullable(user);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding user by email",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find user by email",
                    e
            );
        }
    }


    // ============================================================
    // FIND BY PROVIDER USER ID
    // ============================================================

    public Optional<User> findByProviderUserId(
            String providerUserId) {

        if (providerUserId == null
                || providerUserId.isBlank()) {

            return Optional.empty();
        }

        try {

            Query query = firestore
                    .collection(COLLECTION)
                    .whereEqualTo(
                            "providerUserId",
                            providerUserId
                    )
                    .limit(1);

            List<QueryDocumentSnapshot> documents =
                    query
                            .get()
                            .get()
                            .getDocuments();

            if (documents.isEmpty()) {
                return Optional.empty();
            }

            User user = mapDocument(documents.get(0));

            return Optional.ofNullable(user);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding user by provider ID",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find user by provider ID",
                    e
            );
        }
    }


    // ============================================================
    // FIND BY PHONE
    // ============================================================

    public Optional<User> findByPhone(
            String phone) {

        if (phone == null || phone.isBlank()) {
            return Optional.empty();
        }

        String normalizedPhone =
                normalizePhoneNumber(phone);

        try {

            Query query = firestore
                    .collection(COLLECTION)
                    .whereEqualTo(
                            "phone",
                            normalizedPhone
                    )
                    .limit(1);

            List<QueryDocumentSnapshot> documents =
                    query
                            .get()
                            .get()
                            .getDocuments();

            if (documents.isEmpty()) {
                return Optional.empty();
            }

            User user = mapDocument(documents.get(0));

            return Optional.ofNullable(user);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding user by phone",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find user by phone",
                    e
            );
        }
    }


    // ============================================================
    // EXISTS BY EMAIL
    // ============================================================

    public boolean existsByEmail(
            String email) {

        return findByEmail(email).isPresent();
    }


    // ============================================================
    // EXISTS BY PHONE
    // ============================================================

    public boolean existsByPhone(
            String phone) {

        return findByPhone(phone).isPresent();
    }


    // ============================================================
    // FIND BY KYC STATUS
    // ============================================================

    public List<User> findByKycStatus(
            User.KycStatus kycStatus) {

        if (kycStatus == null) {
            return List.of();
        }

        try {

            Query query = firestore
                    .collection(COLLECTION)
                    .whereEqualTo(
                            "kycStatus",
                            kycStatus.name()
                    );

            List<QueryDocumentSnapshot> documents =
                    query
                            .get()
                            .get()
                            .getDocuments();

            return convertDocuments(documents);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while finding users by KYC status",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find users by KYC status",
                    e
            );
        }
    }


    // ============================================================
    // COUNT BY ROLE
    // ============================================================

    public long countByRole(
            User.Role role) {

        if (role == null) {
            return 0;
        }

        try {

            Query query = firestore
                    .collection(COLLECTION)
                    .whereEqualTo(
                            "role",
                            role.name()
                    );

            return query
                    .get()
                    .get()
                    .size();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while counting users by role",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to count users by role",
                    e
            );
        }
    }


    // ============================================================
    // COUNT BY STATUS
    // ============================================================

    public long countByStatus(
            User.UserStatus status) {

        if (status == null) {
            return 0;
        }

        try {

            Query query = firestore
                    .collection(COLLECTION)
                    .whereEqualTo(
                            "status",
                            status.name()
                    );

            return query
                    .get()
                    .get()
                    .size();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while counting users by status",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to count users by status",
                    e
            );
        }
    }


    // ============================================================
    // COUNT ALL USERS
    // ============================================================

    public long count() {

        return findAll().size();
    }


    // ============================================================
    // FIND ALL
    // ============================================================

    public List<User> findAll() {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .get()
                            .get()
                            .getDocuments();

            return convertDocuments(documents);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while loading users",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load users",
                    e
            );
        }
    }


    // ============================================================
    // DELETE
    // ============================================================

    public void deleteById(
            String id) {

        if (id == null || id.isBlank()) {
            return;
        }

        try {

            firestore
                    .collection(COLLECTION)
                    .document(id)
                    .delete()
                    .get();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Interrupted while deleting user",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete user",
                    e
            );
        }
    }


    // ============================================================
    // MAP DOCUMENT
    // ============================================================

    private User mapDocument(DocumentSnapshot document) {
        if (document == null || !document.exists()) {
            return null;
        }

        try {
            User user = document.toObject(User.class);
            if (user != null) {
                user.setId(document.getId());
                return user;
            }
        } catch (Exception ignored) {
            // Fallback to manual field extraction if schema conversion fails
        }

        User user = new User();
        user.setId(document.getId());
        user.setName(document.getString("name"));
        user.setEmail(document.getString("email"));
        user.setPasswordHash(document.getString("passwordHash"));
        user.setPhone(document.getString("phone"));

        String roleStr = document.getString("role");
        if (roleStr != null) {
            try { user.setRole(User.Role.valueOf(roleStr)); } catch (Exception ignored) {}
        }
        String statusStr = document.getString("status");
        if (statusStr != null) {
            try { user.setStatus(User.UserStatus.valueOf(statusStr)); } catch (Exception ignored) {}
        }
        String kycStatusStr = document.getString("kycStatus");
        if (kycStatusStr != null) {
            try { user.setKycStatus(User.KycStatus.valueOf(kycStatusStr)); } catch (Exception ignored) {}
        }

        user.setAvatarUrl(document.getString("avatarUrl"));
        user.setLoginProvider(document.getString("loginProvider"));
        user.setProviderUserId(document.getString("providerUserId"));
        user.setKycDocumentType(document.getString("kycDocumentType"));
        user.setKycDocumentUrl(document.getString("kycDocumentUrl"));
        user.setMembershipLevel(document.getString("membershipLevel"));

        Long points = document.getLong("rewardPoints");
        if (points != null) {
            user.setRewardPoints(points.intValue());
        }

        Boolean emailVerified = document.getBoolean("emailVerified");
        if (emailVerified != null) {
            user.setEmailVerified(emailVerified);
        }
        Boolean phoneVerified = document.getBoolean("phoneVerified");
        if (phoneVerified != null) {
            user.setPhoneVerified(phoneVerified);
        }
        Boolean accountLocked = document.getBoolean("accountLocked");
        if (accountLocked != null) {
            user.setAccountLocked(accountLocked);
        }

        user.setCreatedAt(parseInstantField(document.get("createdAt")));
        user.setUpdatedAt(parseInstantField(document.get("updatedAt")));
        user.setLastLoginAt(parseInstantField(document.get("lastLoginAt")));

        return user;
    }

    private Instant parseInstantField(Object value) {
        if (value == null) return Instant.now();
        if (value instanceof com.google.cloud.Timestamp ts) {
            return ts.toDate().toInstant();
        }
        if (value instanceof java.util.Date d) {
            return d.toInstant();
        }
        if (value instanceof String s) {
            try {
                return Instant.parse(s);
            } catch (Exception ignored) {}
        }
        if (value instanceof Number n) {
            return Instant.ofEpochMilli(n.longValue());
        }
        return Instant.now();
    }


    // ============================================================
    // CONVERT FIRESTORE DOCUMENTS
    // ============================================================

    private List<User> convertDocuments(
            List<QueryDocumentSnapshot> documents) {

        List<User> users =
                new ArrayList<>();

        for (QueryDocumentSnapshot document :
                documents) {

            User user = mapDocument(document);

            if (user != null) {
                users.add(user);
            }
        }

        return users;
    }


    // ============================================================
    // NORMALIZE PHONE
    // ============================================================

    private String normalizePhoneNumber(
            String phone) {

        if (phone == null
                || phone.isBlank()) {

            return null;
        }

        String original =
                phone.trim();

        if (original.startsWith("+")) {

            String digits =
                    original.substring(1)
                            .replaceAll(
                                    "[^0-9]",
                                    ""
                            );

            return digits.isBlank()
                    ? null
                    : "+" + digits;
        }

        String cleaned =
                original.replaceAll(
                        "[^0-9]",
                        ""
                );

        if (cleaned.length() == 10) {
            return "+91" + cleaned;
        }

        if (cleaned.length() == 11
                && cleaned.startsWith("0")) {

            return "+91"
                    + cleaned.substring(1);
        }

        if (cleaned.length() == 12
                && cleaned.startsWith("91")) {

            return "+" + cleaned;
        }

        if (cleaned.length() > 10) {
            return "+" + cleaned;
        }

        return "+" + cleaned;
    }
}