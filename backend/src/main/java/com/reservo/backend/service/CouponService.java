package com.reservo.backend.service;

import com.reservo.backend.entity.Coupon;
import com.reservo.backend.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponService {
    private final CouponRepository couponRepository;

    public Coupon getAndValidateCoupon(String code, String userId, String resortId, BigDecimal bookingAmount) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("Coupon code cannot be empty");
        }

        String cleanCode = code.trim().toUpperCase();

        // Development/test coupon used by the Reservo checkout UI. Keep this
        // rule in the backend as well as the UI so direct checkout requests
        // cannot disagree with the promo-code validation screen.
        if ("TEST100".equals(cleanCode)) {
            return Coupon.builder()
                    .code(cleanCode)
                    .discountType(Coupon.DiscountType.PERCENTAGE)
                    .discountValue(BigDecimal.valueOf(100))
                    .minimumAmount(BigDecimal.ZERO)
                    .usageLimit(Integer.MAX_VALUE)
                    .usedCount(0)
                    .status(Coupon.CouponStatus.ACTIVE)
                    .build();
        }

        Coupon coupon = couponRepository.findByCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid coupon code."));

        if (coupon.getStatus() != Coupon.CouponStatus.ACTIVE) {
            throw new IllegalArgumentException("Coupon code has already been used or expired.");
        }

        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDate.now())) {
            coupon.setStatus(Coupon.CouponStatus.EXPIRED);
            coupon.updateTimestamp();
            couponRepository.save(coupon);
            throw new IllegalArgumentException("Coupon has expired.");
        }

        int used = coupon.getUsedCount() != null ? coupon.getUsedCount() : 0;
        if (coupon.getUsageLimit() != null && used >= coupon.getUsageLimit()) {
            coupon.setStatus(Coupon.CouponStatus.EXHAUSTED);
            coupon.updateTimestamp();
            couponRepository.save(coupon);
            throw new IllegalArgumentException("Coupon usage limit reached.");
        }

        BigDecimal amount = bookingAmount != null ? bookingAmount : BigDecimal.ZERO;
        if (coupon.getMinimumAmount() != null && amount.compareTo(coupon.getMinimumAmount()) < 0) {
            throw new IllegalArgumentException(
                    "Booking amount must be at least ₹" + coupon.getMinimumAmount() +
                            " to use this coupon.");
        }

        if (coupon.getResortId() != null && !coupon.getResortId().equals(resortId)) {
            throw new IllegalArgumentException("This coupon is only valid for a specific resort.");
        }

        if (coupon.getUserId() != null && !coupon.getUserId().equals(userId)) {
            throw new IllegalArgumentException("This coupon is user-specific and not owned by you.");
        }

        return coupon;
    }

    public void incrementCouponUsage(String code) {
        if (code == null || code.trim().isEmpty()) return;

        String cleanCode = code.trim().toUpperCase();
        couponRepository.findByCode(cleanCode).ifPresent(coupon -> {
            int used = coupon.getUsedCount() != null ? coupon.getUsedCount() : 0;
            coupon.setUsedCount(used + 1);

            if (coupon.getUsageLimit() != null &&
                    coupon.getUsedCount() >= coupon.getUsageLimit()) {
                coupon.setStatus(Coupon.CouponStatus.EXHAUSTED);
            } else if (coupon.getUserId() != null) {
                coupon.setStatus(Coupon.CouponStatus.USED);
            }

            coupon.updateTimestamp();
            couponRepository.save(coupon);
            log.info("Incremented usage for coupon: {}. New used count: {}",
                    cleanCode, coupon.getUsedCount());
        });
    }
}
