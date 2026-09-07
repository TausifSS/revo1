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
                log.warn("No service account credentials file found. Falling back to application default credentials.");
                credentials = GoogleCredentials.getApplicationDefault();
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
            log.error("Firebase initialization failed");
            log.error("Error: {}", e.getMessage());
            log.error("========================================");

            throw new RuntimeException("Could not initialize Firebase", e);
        }
    }

    private InputStream resolveServiceAccountStream() {
        try {
            // 1. Check local file paths first
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

            // 2. Check classpath
            ClassPathResource classPathResource = new ClassPathResource("serviceAccountKey.json");
            if (classPathResource.exists()) {
                log.info("Loading Firebase credentials from classpath resource: serviceAccountKey.json");
                return classPathResource.getInputStream();
            }

            // 3. Check injected property / env variable (FIREBASE_SERVICE_ACCOUNT_JSON)
            if (serviceAccountConfig != null && !serviceAccountConfig.isBlank()) {
                String trimmed = serviceAccountConfig.trim();
                File file = new File(trimmed);
                if (file.exists() && file.isFile()) {
                    log.info("Loading Firebase credentials from configured path: {}", file.getAbsolutePath());
                    return new FileInputStream(file);
                }
                if (trimmed.startsWith("{")) {
                    log.info("Loading Firebase credentials from JSON environment variable / property string");
                    return new ByteArrayInputStream(trimmed.getBytes(StandardCharsets.UTF_8));
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