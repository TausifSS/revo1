package com.reservo.backend.entity;

import com.google.cloud.firestore.annotation.Exclude;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"passwordHash"})
public class User {

    // =========================================================
    // IDENTITY
    // =========================================================

    @EqualsAndHashCode.Include
    private String id;

    private String name;

    private String email;

    // =========================================================
    // SECURITY
    // =========================================================

    /**
     * Argon2id password hash.
     *
     * NEVER store plain-text passwords.
     */
    private String passwordHash;

    private String phone;

    private Role role;

    private UserStatus status;

    private String avatarUrl;

    // =========================================================
    // REWARDS
    // =========================================================

    @Builder.Default
    private Integer rewardPoints = 0;

    @Builder.Default
    private String membershipLevel = "Member";

    // =========================================================
    // AUTHENTICATION
    // =========================================================

    @Builder.Default
    private String loginProvider = "LOCAL";

    private String providerUserId;

    @Builder.Default
    private boolean emailVerified = false;

    @Builder.Default
    private boolean phoneVerified = false;

    @Builder.Default
    private KycStatus kycStatus = KycStatus.UNVERIFIED;

    private String kycDocumentType;

    private String kycDocumentUrl;

    @Builder.Default
    private boolean accountLocked = false;

    private Instant lastLoginAt;

    // =========================================================
    // AUDIT
    // =========================================================

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    // =========================================================
    // TIMESTAMP UPDATE
    // =========================================================

    public void updateTimestamp() {
        this.updatedAt = Instant.now();
    }

    // =========================================================
    // ENUMS
    // =========================================================

    public enum Role {
        ROLE_ADMIN,
        ROLE_OWNER,
        ROLE_CUSTOMER
    }

    public enum UserStatus {
        ACTIVE,
        INACTIVE,
        BLOCKED
    }

    public enum KycStatus {
        UNVERIFIED,
        PENDING_VERIFICATION,
        VERIFIED,
        REJECTED
    }
    /**
     * The canonical entity ID is the Firestore document ID.
     * Do not read/write a separate `id` field from/to Firestore.
     */
    @Exclude
    public String getId() {
        return id;
    }

}