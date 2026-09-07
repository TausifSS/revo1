package com.reservo.backend.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.reservo.backend.entity.Payment;

@Repository
public class PaymentRepository {

    private static final String COLLECTION = "payments";

    private final Firestore firestore;

    public PaymentRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save or update a payment.
     */
    public Payment save(Payment payment) {

        try {

            if (payment.getId() == null) {
                payment.setId(generateId());
            }

            if (payment.getCreatedAt() == null) {
                payment.setCreatedAt(
                        java.time.Instant.now()
                );
            }

            firestore
                    .collection(COLLECTION)
                    .document(String.valueOf(payment.getId()))
                    .set(toFirestoreMap(payment))
                    .get();

            return payment;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to save payment",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to save payment",
                    e
            );
        }
    }

    /**
     * Find payment by ID.
     */
    public Optional<Payment> findById(String id) {

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

            Payment payment =
                    fromDocument(document);

            return Optional.ofNullable(payment);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to find payment",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find payment",
                    e
            );
        }
    }

    /**
     * Find payment by transaction ID.
     */
    public Optional<Payment> findByTransactionId(
            String transactionId
    ) {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo(
                                    "transactionId",
                                    transactionId
                            )
                            .limit(1)
                            .get()
                            .get()
                            .getDocuments();

            if (documents.isEmpty()) {
                return Optional.empty();
            }

            Payment payment =
                    fromDocument(documents.get(0));

            return Optional.ofNullable(payment);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to find payment by transaction ID",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find payment by transaction ID",
                    e
            );
        }
    }

    /**
     * Find payment belonging to a booking.
     */
    public Optional<Payment> findByBookingId(
            String bookingId
    ) {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .whereEqualTo(
                                    "bookingId",
                                    bookingId
                            )
                            .limit(1)
                            .get()
                            .get()
                            .getDocuments();

            if (documents.isEmpty()) {
                return Optional.empty();
            }

            Payment payment =
                    fromDocument(documents.get(0));

            return Optional.ofNullable(payment);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to find payment by booking ID",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to find payment by booking ID",
                    e
            );
        }
    }

    /**
     * Get all payments.
     */
    public List<Payment> findAll() {

        try {

            List<QueryDocumentSnapshot> documents =
                    firestore
                            .collection(COLLECTION)
                            .get()
                            .get()
                            .getDocuments();

            List<Payment> payments =
                    new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                Payment payment =
                        fromDocument(document);

                if (payment != null) {
                    payments.add(payment);
                }
            }

            return payments;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Failed to load payments",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to load payments",
                    e
            );
        }
    }

    private java.util.Map<String, Object> toFirestoreMap(Payment payment) {
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("transactionId", payment.getTransactionId());
        data.put("bookingId", payment.getBookingId());
        data.put("amount", payment.getAmount() != null ? payment.getAmount().doubleValue() : 0d);
        data.put("paymentMethod", payment.getPaymentMethod());
        data.put("status", payment.getStatus() != null ? payment.getStatus().name() : Payment.PaymentStatus.PENDING.name());
        if (payment.getCreatedAt() != null) {
            java.time.Instant i = payment.getCreatedAt();
            data.put("createdAt", com.google.cloud.Timestamp.ofTimeSecondsAndNanos(i.getEpochSecond(), i.getNano()));
        }
        return data;
    }

    private Payment fromDocument(DocumentSnapshot document) {
        java.util.Map<String, Object> d = document.getData();
        if (d == null) return null;
        Payment payment = new Payment();
        payment.setId(document.getId());
        payment.setTransactionId(asString(d.get("transactionId")));
        payment.setBookingId(asString(d.get("bookingId")));
        payment.setAmount(asBigDecimal(d.get("amount")));
        payment.setPaymentMethod(asString(d.get("paymentMethod")));
        String status = asString(d.get("status"));
        if (status != null) { try { payment.setStatus(Payment.PaymentStatus.valueOf(status)); } catch (Exception ignored) {} }
        payment.setCreatedAt(asInstant(d.get("createdAt")));
        if (payment.getCreatedAt() == null) payment.setCreatedAt(java.time.Instant.now());
        return payment;
    }
    private String asString(Object value) { return value == null ? null : String.valueOf(value); }
    private java.math.BigDecimal asBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof java.math.BigDecimal bd) return bd;
        if (value instanceof Number n) return new java.math.BigDecimal(n.toString());
        try { return new java.math.BigDecimal(String.valueOf(value)); } catch (Exception e) { return null; }
    }
    private java.time.Instant asInstant(Object value) {
        if (value == null) return null;
        if (value instanceof com.google.cloud.Timestamp ts) return ts.toDate().toInstant();
        if (value instanceof java.util.Date date) return date.toInstant();
        String text = String.valueOf(value).trim();
        try { return java.time.Instant.parse(text); } catch (Exception ignored) {}
        try { return java.time.LocalDateTime.parse(text, java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")).toInstant(java.time.ZoneOffset.UTC); } catch (Exception ignored) {}
        return null;
    }

    /**
     * Delete payment by ID.
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
                    "Failed to delete payment",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Failed to delete payment",
                    e
            );
        }
    }

    /**
     * Generate the next numeric ID.
     *
     * We keep numeric IDs to minimize changes
     * to the existing Reservo application.
     */
    private String generateId() {
        return firestore.collection(COLLECTION).document().getId();
    }
}