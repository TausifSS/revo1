package com.reservo.backend.repository;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.reservo.backend.entity.Coupon;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class CouponRepository {

    private static final String COLLECTION = "coupons";
    private final Firestore firestore;

    public CouponRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public Coupon save(Coupon coupon) {
        try {
            if (coupon.getId() == null || coupon.getId().isBlank()) {
                coupon.setId(firestore.collection(COLLECTION).document().getId());
            }
            if (coupon.getCreatedAt() == null) {
                coupon.setCreatedAt(Instant.now());
            }
            coupon.updateTimestamp();

            Map<String, Object> data = toFirestoreMap(coupon);
            firestore.collection(COLLECTION)
                    .document(coupon.getId())
                    .set(data)
                    .get();
            return coupon;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while saving coupon", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to save coupon: " + rootMessage(e), e);
        }
    }

    public Optional<Coupon> findById(String id) {
        if (id == null || id.isBlank()) return Optional.empty();
        try {
            DocumentSnapshot document = firestore.collection(COLLECTION)
                    .document(id).get().get();
            return document.exists() ? Optional.of(fromDocument(document)) : Optional.empty();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while finding coupon", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to find coupon: " + rootMessage(e), e);
        }
    }

    public Optional<Coupon> findByCode(String code) {
        if (code == null || code.isBlank()) return Optional.empty();
        try {
            List<QueryDocumentSnapshot> documents = firestore.collection(COLLECTION)
                    .whereEqualTo("code", code.trim().toUpperCase())
                    .limit(1).get().get().getDocuments();
            if (documents.isEmpty()) return Optional.empty();
            return Optional.of(fromDocument(documents.get(0)));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while finding coupon by code", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to find coupon by code: " + rootMessage(e), e);
        }
    }

    public Optional<Coupon> findByCodeAndUserId(String code, String userId) {
        if (code == null || code.isBlank() || userId == null || userId.isBlank()) {
            return Optional.empty();
        }
        try {
            List<QueryDocumentSnapshot> documents = firestore.collection(COLLECTION)
                    .whereEqualTo("code", code.trim().toUpperCase())
                    .whereEqualTo("userId", userId)
                    .limit(1).get().get().getDocuments();
            if (documents.isEmpty()) return Optional.empty();
            return Optional.of(fromDocument(documents.get(0)));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while finding user coupon", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to find user coupon: " + rootMessage(e), e);
        }
    }

    public List<Coupon> findByUserId(String userId) {
        try {
            List<QueryDocumentSnapshot> documents = firestore.collection(COLLECTION)
                    .whereEqualTo("userId", userId).get().get().getDocuments();
            return convertDocuments(documents);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while finding user coupons", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to find user coupons: " + rootMessage(e), e);
        }
    }

    public List<Coupon> findByStatus(Coupon.CouponStatus status) {
        try {
            List<QueryDocumentSnapshot> documents = firestore.collection(COLLECTION)
                    .whereEqualTo("status", status.name()).get().get().getDocuments();
            return convertDocuments(documents);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while finding coupons by status", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to find coupons by status: " + rootMessage(e), e);
        }
    }

    public long countByUserIdAndStatus(String userId, Coupon.CouponStatus status) {
        try {
            return firestore.collection(COLLECTION)
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("status", status.name())
                    .get().get().size();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while counting coupons", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to count coupons: " + rootMessage(e), e);
        }
    }

    public long count() {
        try {
            return firestore.collection(COLLECTION).get().get().size();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while counting coupons", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to count coupons: " + rootMessage(e), e);
        }
    }

    public List<Coupon> findAll() {
        try {
            return convertDocuments(firestore.collection(COLLECTION).get().get().getDocuments());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while loading coupons", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to load coupons: " + rootMessage(e), e);
        }
    }

    public void deleteById(String id) {
        try {
            firestore.collection(COLLECTION).document(id).delete().get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while deleting coupon", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to delete coupon: " + rootMessage(e), e);
        }
    }

    private Map<String, Object> toFirestoreMap(Coupon coupon) {
        Map<String, Object> data = new HashMap<>();
        data.put("code", coupon.getCode());
        data.put("userId", coupon.getUserId());
        data.put("resortId", coupon.getResortId());
        data.put("discountPercentage", coupon.getDiscountPercentage());
        data.put("discountType", coupon.getDiscountType() != null ? coupon.getDiscountType().name() : null);
        data.put("discountValue", coupon.getDiscountValue() != null ? coupon.getDiscountValue().doubleValue() : 0d);
        data.put("minimumAmount", coupon.getMinimumAmount() != null ? coupon.getMinimumAmount().doubleValue() : 0d);
        data.put("expiryDate", coupon.getExpiryDate() != null ? coupon.getExpiryDate().toString() : null);
        data.put("usageLimit", coupon.getUsageLimit());
        data.put("usedCount", coupon.getUsedCount());
        data.put("status", coupon.getStatus() != null ? coupon.getStatus().name() : Coupon.CouponStatus.ACTIVE.name());
        data.put("createdAt", coupon.getCreatedAt() != null ? Timestamp.ofTimeSecondsAndNanos(coupon.getCreatedAt().getEpochSecond(), coupon.getCreatedAt().getNano()) : null);
        data.put("updatedAt", coupon.getUpdatedAt() != null ? Timestamp.ofTimeSecondsAndNanos(coupon.getUpdatedAt().getEpochSecond(), coupon.getUpdatedAt().getNano()) : null);
        return data;
    }

    private Coupon fromDocument(DocumentSnapshot document) {
        Coupon coupon = new Coupon();
        coupon.setId(document.getId());
        coupon.setCode(asString(document.get("code")));
        coupon.setUserId(asString(document.get("userId")));
        coupon.setResortId(asString(document.get("resortId")));
        coupon.setDiscountPercentage(asInteger(document.get("discountPercentage")));

        String discountType = asString(document.get("discountType"));
        if (discountType != null) {
            try { coupon.setDiscountType(Coupon.DiscountType.valueOf(discountType)); }
            catch (IllegalArgumentException ignored) { coupon.setDiscountType(Coupon.DiscountType.PERCENTAGE); }
        }

        coupon.setDiscountValue(asBigDecimal(document.get("discountValue")));
        coupon.setMinimumAmount(asBigDecimal(document.get("minimumAmount")));

        String expiry = asString(document.get("expiryDate"));
        if (expiry != null && !expiry.isBlank()) {
            try { coupon.setExpiryDate(LocalDate.parse(expiry)); }
            catch (Exception ignored) { coupon.setExpiryDate(null); }
        }

        coupon.setUsageLimit(asInteger(document.get("usageLimit")));
        coupon.setUsedCount(asInteger(document.get("usedCount")));

        String status = asString(document.get("status"));
        if (status != null) {
            try { coupon.setStatus(Coupon.CouponStatus.valueOf(status)); }
            catch (IllegalArgumentException ignored) { coupon.setStatus(Coupon.CouponStatus.ACTIVE); }
        } else {
            coupon.setStatus(Coupon.CouponStatus.ACTIVE);
        }

        coupon.setCreatedAt(asInstant(document.get("createdAt")));
        coupon.setUpdatedAt(asInstant(document.get("updatedAt")));
        if (coupon.getCreatedAt() == null) coupon.setCreatedAt(Instant.now());
        if (coupon.getUpdatedAt() == null) coupon.setUpdatedAt(coupon.getCreatedAt());
        if (coupon.getUsageLimit() == null) coupon.setUsageLimit(1000);
        if (coupon.getUsedCount() == null) coupon.setUsedCount(0);
        if (coupon.getMinimumAmount() == null) coupon.setMinimumAmount(BigDecimal.ZERO);
        if (coupon.getDiscountValue() == null) coupon.setDiscountValue(BigDecimal.ZERO);
        return coupon;
    }

    private List<Coupon> convertDocuments(List<QueryDocumentSnapshot> documents) {
        List<Coupon> coupons = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) coupons.add(fromDocument(document));
        return coupons;
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Integer asInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        try { return Integer.valueOf(String.valueOf(value)); }
        catch (Exception e) { return null; }
    }

    private BigDecimal asBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try { return new BigDecimal(String.valueOf(value)); }
        catch (Exception e) { return null; }
    }

    private Instant asInstant(Object value) {
        if (value == null) return null;
        if (value instanceof Timestamp ts) return Instant.ofEpochSecond(ts.getSeconds(), ts.getNanos());
        if (value instanceof java.util.Date date) return date.toInstant();
        if (value instanceof Instant instant) return instant;
        try { return Instant.parse(String.valueOf(value)); }
        catch (Exception e) { return null; }
    }

    private String rootMessage(Exception e) {
        Throwable t = e;
        while (t.getCause() != null) t = t.getCause();
        return t.getMessage() != null ? t.getMessage() : e.getMessage();
    }
}
