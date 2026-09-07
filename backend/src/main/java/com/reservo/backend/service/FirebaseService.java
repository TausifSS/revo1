package com.reservo.backend.service;

import org.springframework.stereotype.Service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FirebaseService {

    // =========================================================
    // VERIFY FIREBASE ID TOKEN
    // =========================================================

    /**
     * Verifies a Firebase ID token received from the frontend.
     *
     * The frontend must NEVER be trusted for:
     * - email
     * - user ID
     * - phone number
     * - role
     *
     * All of these should come from the verified FirebaseToken.
     *
     * @param idToken Firebase ID token
     * @return verified FirebaseToken
     */
    public FirebaseToken verifyIdToken(String idToken) {

        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException(
                    "Firebase ID token cannot be empty"
            );
        }

        try {

            FirebaseAuth firebaseAuth =
                    FirebaseAuth.getInstance();

            FirebaseToken decodedToken =
                    firebaseAuth.verifyIdToken(idToken);

            if (decodedToken == null) {
                throw new IllegalArgumentException(
                        "Firebase returned an empty token"
                );
            }

            log.debug(
                    "Firebase ID token verified successfully for UID: {}",
                    decodedToken.getUid()
            );

            return decodedToken;

        } catch (FirebaseAuthException e) {

            log.error(
                    "Firebase ID token verification failed: {}",
                    e.getMessage()
            );

            throw new IllegalArgumentException(
                    "Invalid or expired Firebase ID token",
                    e
            );

        } catch (IllegalArgumentException e) {

            throw e;

        } catch (Exception e) {

            log.error(
                    "Unexpected Firebase verification error",
                    e
            );

            throw new IllegalArgumentException(
                    "Unable to verify Firebase authentication token",
                    e
            );
        }
    }


    // =========================================================
    // GET EMAIL FROM FIREBASE TOKEN
    // =========================================================

    /**
     * Extracts the verified email from a Firebase ID token.
     */
    public String getEmailFromToken(String idToken) {

        try {

            FirebaseToken token =
                    verifyIdToken(idToken);

            String email =
                    token.getEmail();

            return email != null && !email.isBlank()
                    ? email.trim().toLowerCase()
                    : null;

        } catch (Exception e) {

            log.error(
                    "Failed to extract email from Firebase token: {}",
                    e.getMessage()
            );

            return null;
        }
    }


    // =========================================================
    // GET PHONE NUMBER FROM FIREBASE TOKEN
    // =========================================================

    /**
     * Extracts the verified phone number from Firebase ID token.
     */
    public String getPhoneNumberFromToken(String idToken) {

        try {

            FirebaseToken decodedToken =
                    verifyIdToken(idToken);

            Object phoneNumber =
                    decodedToken
                            .getClaims()
                            .get("phone_number");

            if (phoneNumber == null) {
                return null;
            }

            return phoneNumber.toString();

        } catch (Exception e) {

            log.error(
                    "Failed to extract phone number from Firebase token: {}",
                    e.getMessage()
            );

            return null;
        }
    }


    // =========================================================
    // GET FIREBASE UID
    // =========================================================

    /**
     * Returns the Firebase UID from a verified token.
     */
    public String getUidFromToken(String idToken) {

        try {

            FirebaseToken decodedToken =
                    verifyIdToken(idToken);

            return decodedToken.getUid();

        } catch (Exception e) {

            log.error(
                    "Failed to extract Firebase UID: {}",
                    e.getMessage()
            );

            return null;
        }
    }


    // =========================================================
    // GET DISPLAY NAME
    // =========================================================

    /**
     * Gets the user's display name from Firebase claims.
     */
    public String getNameFromToken(String idToken) {

        try {

            FirebaseToken decodedToken =
                    verifyIdToken(idToken);

            Object name =
                    decodedToken
                            .getClaims()
                            .get("name");

            if (name == null) {
                return null;
            }

            String value = name.toString().trim();

            return value.isBlank()
                    ? null
                    : value;

        } catch (Exception e) {

            log.error(
                    "Failed to extract Firebase user name: {}",
                    e.getMessage()
            );

            return null;
        }
    }


    // =========================================================
    // FIREBASE AVAILABILITY
    // =========================================================

    /**
     * Checks whether Firebase Admin SDK is initialized.
     */
    public boolean isFirebaseAvailable() {

        try {

            FirebaseAuth.getInstance();

            return true;

        } catch (Exception e) {

            log.warn(
                    "Firebase is not available: {}",
                    e.getMessage()
            );

            return false;
        }
    }
}