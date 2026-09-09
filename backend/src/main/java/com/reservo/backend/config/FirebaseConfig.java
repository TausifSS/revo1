package com.reservo.backend.config;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.service.account.json:}")
    private String serviceAccountConfig;

    @Bean
    public FirebaseApp firebaseApp() {
        try {
            // Reuse existing Firebase instance if already initialized
            if (!FirebaseApp.getApps().isEmpty()) {
                log.info("Firebase already initialized.");
                return FirebaseApp.getInstance();
            }

            InputStream serviceAccount = resolveServiceAccountStream();

            GoogleCredentials credentials;
            if (serviceAccount != null) {
                credentials = GoogleCredentials.fromStream(serviceAccount);
            } else {
                log.error("===================================================================");
                log.error("CRITICAL ERROR: Firebase service account credentials NOT found!");
                log.error("Reservo requires Firebase credentials to connect to Firestore.");
                log.error("To fix this on Render:");
                log.error("  Option 1 (Recommended): Go to Render Dashboard -> Environment -> Secret Files,");
                log.error("           Add file 'serviceAccountKey.json' and paste your service account JSON.");
                log.error("  Option 2: Add environment variable 'FIREBASE_SERVICE_ACCOUNT_JSON' with your JSON string.");
                log.error("  Option 3: Add environment variable 'FIREBASE_SERVICE_ACCOUNT_BASE64' with base64-encoded JSON.");
                log.error("===================================================================");
                throw new IllegalStateException("Firebase service account credentials missing! Please upload serviceAccountKey.json to Render Secret Files or set FIREBASE_SERVICE_ACCOUNT_JSON.");
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            FirebaseApp app = FirebaseApp.initializeApp(options);

            log.info("========================================");
            log.info("Firebase initialized successfully");
            log.info("Firestore connection ready");
            log.info("========================================");

            return app;

        } catch (Exception e) {
            log.error("========================================");
            log.error("Firebase initialization failed: {}", e.getMessage());
            log.error("========================================");

            throw new RuntimeException("Could not initialize Firebase: " + e.getMessage(), e);
        }
    }

    private InputStream resolveServiceAccountStream() {
        try {
            // 1. Check GOOGLE_APPLICATION_CREDENTIALS env var
            String googleCredentialsEnv = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
            if (googleCredentialsEnv != null && !googleCredentialsEnv.isBlank()) {
                File credsFile = new File(googleCredentialsEnv.trim());
                if (credsFile.exists() && credsFile.isFile()) {
                    log.info("Loading Firebase credentials from GOOGLE_APPLICATION_CREDENTIALS: {}", credsFile.getAbsolutePath());
                    return new FileInputStream(credsFile);
                }
            }

            // 2. Check Render Secret Files paths (/etc/secrets/)
            File renderSecret = new File("/etc/secrets/serviceAccountKey.json");
            if (renderSecret.exists() && renderSecret.isFile()) {
                log.info("Loading Firebase credentials from Render Secret File: {}", renderSecret.getAbsolutePath());
                return new FileInputStream(renderSecret);
            }

            File renderSecretAlt = new File("/etc/secrets/firebase.json");
            if (renderSecretAlt.exists() && renderSecretAlt.isFile()) {
                log.info("Loading Firebase credentials from Render Secret File: {}", renderSecretAlt.getAbsolutePath());
                return new FileInputStream(renderSecretAlt);
            }

            // 3. Check local file paths
            File defaultFile = new File("serviceAccountKey.json");
            if (defaultFile.exists() && defaultFile.isFile()) {
                log.info("Loading Firebase credentials from: {}", defaultFile.getAbsolutePath());
                return new FileInputStream(defaultFile);
            }

            File backendFile = new File("backend/serviceAccountKey.json");
            if (backendFile.exists() && backendFile.isFile()) {
                log.info("Loading Firebase credentials from: {}", backendFile.getAbsolutePath());
                return new FileInputStream(backendFile);
            }

            // 4. Check classpath
            ClassPathResource classPathResource = new ClassPathResource("serviceAccountKey.json");
            if (classPathResource.exists()) {
                log.info("Loading Firebase credentials from classpath resource: serviceAccountKey.json");
                return classPathResource.getInputStream();
            }

            // 5. Check dedicated Base64 env variable
            String base64Env = System.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64");
            if (base64Env != null && !base64Env.isBlank()) {
                try {
                    byte[] decoded = java.util.Base64.getDecoder().decode(base64Env.trim());
                    log.info("Loading Firebase credentials from FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable");
                    return new ByteArrayInputStream(decoded);
                } catch (Exception b64Err) {
                    log.warn("Failed to decode FIREBASE_SERVICE_ACCOUNT_BASE64: {}", b64Err.getMessage());
                }
            }

            // 6. Check injected property / env variable (FIREBASE_SERVICE_ACCOUNT_JSON)
            if (serviceAccountConfig != null && !serviceAccountConfig.isBlank()) {
                String trimmed = serviceAccountConfig.trim();

                // Strip surrounding quotes if wrapped
                if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() > 2) {
                    trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
                }

                File file = new File(trimmed);
                if (file.exists() && file.isFile()) {
                    log.info("Loading Firebase credentials from configured path: {}", file.getAbsolutePath());
                    return new FileInputStream(file);
                }

                // Check unescaped JSON
                if (trimmed.contains("\\\"") && !trimmed.contains("\"type\"")) {
                    trimmed = trimmed.replace("\\\"", "\"").replace("\\n", "\n");
                }

                if (trimmed.startsWith("{")) {
                    log.info("Loading Firebase credentials from JSON environment variable / property string");
                    return new ByteArrayInputStream(trimmed.getBytes(StandardCharsets.UTF_8));
                }

                // Try Base64 decoding if not starting with {
                try {
                    byte[] decoded = java.util.Base64.getDecoder().decode(trimmed);
                    String decodedStr = new String(decoded, StandardCharsets.UTF_8).trim();
                    if (decodedStr.startsWith("{")) {
                        log.info("Loading Firebase credentials from decoded Base64 property string");
                        return new ByteArrayInputStream(decoded);
                    }
                } catch (Exception ignored) {
                }
            }
        } catch (Exception e) {
            log.warn("Failed to resolve Firebase service account stream: {}", e.getMessage());
        }

        return null;
    }

    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        return FirestoreClient.getFirestore(firebaseApp);
    }
}