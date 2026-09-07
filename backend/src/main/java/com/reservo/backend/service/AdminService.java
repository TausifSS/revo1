package com.reservo.backend.service;

import com.reservo.backend.entity.AdminAuditLog;
import com.reservo.backend.entity.Booking;
import com.reservo.backend.entity.Coupon;
import com.reservo.backend.entity.Resort;
import com.reservo.backend.entity.User;
import com.reservo.backend.exception.ResourceNotFoundException;
import com.reservo.backend.repository.AdminAuditLogRepository;
import com.reservo.backend.repository.BookingRepository;
import com.reservo.backend.repository.CouponRepository;
import com.reservo.backend.repository.PlatformSettingRepository;
import com.reservo.backend.repository.ResortRepository;
import com.reservo.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final ResortRepository resortRepository;
    private final BookingRepository bookingRepository;
    private final CouponRepository couponRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;

    public List<User> getAllUsers() { return userRepository.findAll(); }

    public User updateUserStatus(String userId, User.UserStatus status, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        user.setStatus(status);
        user.updateTimestamp();
        logAudit(adminUsername, "UPDATE_USER_STATUS", "User", userId,
                "Updated user status to " + status);
        return userRepository.save(user);
    }

    public List<Resort> getPendingResorts() {
        return resortRepository.findByStatus(Resort.ResortStatus.PENDING_APPROVAL);
    }

    public List<Resort> getAllResorts() { return resortRepository.findAll(); }

    public Resort updateResortStatus(String resortId, Resort.ResortStatus status, String adminUsername) {
        Resort resort = resortRepository.findById(resortId)
                .orElseThrow(() -> new ResourceNotFoundException("Resort not found with ID: " + resortId));
        resort.setStatus(status);

        if (status == Resort.ResortStatus.APPROVED && resort.getOwnerId() != null) {
            userRepository.findById(resort.getOwnerId()).ifPresent(owner -> {
                if (owner.getRole() == User.Role.ROLE_CUSTOMER) {
                    owner.setRole(User.Role.ROLE_OWNER);
                }
                owner.setKycStatus(User.KycStatus.VERIFIED);
                owner.setMembershipLevel("Host Approved");
                owner.updateTimestamp();
                userRepository.save(owner);
            });
        }

        logAudit(adminUsername, "UPDATE_RESORT_STATUS", "Resort", resortId,
                "Updated resort status to " + status);
        return resortRepository.save(resort);
    }


    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    public Coupon createPlatformCoupon(Coupon request, String adminUsername) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            throw new IllegalArgumentException("Coupon code is required.");
        }

        String code = request.getCode().trim().toUpperCase();
        if (couponRepository.findByCode(code).isPresent()) {
            throw new IllegalArgumentException("Coupon code already exists: " + code);
        }

        Coupon.DiscountType type = request.getDiscountType() != null
                ? request.getDiscountType()
                : Coupon.DiscountType.PERCENTAGE;

        BigDecimal value = request.getDiscountValue();
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Coupon discount value must be greater than zero.");
        }
        if (type == Coupon.DiscountType.PERCENTAGE && value.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Percentage discount cannot exceed 100%.");
        }

        Coupon coupon = Coupon.builder()
                .code(code)
                .userId(null)
                .resortId(request.getResortId())
                .discountType(type)
                .discountValue(value)
                .discountPercentage(type == Coupon.DiscountType.PERCENTAGE ? value.intValue() : 0)
                .minimumAmount(request.getMinimumAmount() != null ? request.getMinimumAmount() : BigDecimal.ZERO)
                .expiryDate(request.getExpiryDate())
                .usageLimit(request.getUsageLimit() != null && request.getUsageLimit() > 0 ? request.getUsageLimit() : 100)
                .usedCount(0)
                .status(Coupon.CouponStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Coupon saved = couponRepository.save(coupon);
        logAudit(adminUsername, "CREATE_COUPON", "Coupon", saved.getId(),
                "Created platform coupon " + saved.getCode());
        return saved;
    }

    public void deleteCoupon(String couponId, String adminUsername) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with ID: " + couponId));
        couponRepository.deleteById(couponId);
        logAudit(adminUsername, "DELETE_COUPON", "Coupon", couponId,
                "Deleted platform coupon " + coupon.getCode());
    }

    public List<Booking> getAllBookings() { return bookingRepository.findAll(); }

    public Booking cancelBookingByAdmin(String bookingId, String adminUsername) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        logAudit(adminUsername, "CANCEL_BOOKING", "Booking", bookingId,
                "Admin cancelled booking " + booking.getBookingCode());
        return bookingRepository.save(booking);
    }

    public List<AdminAuditLog> getRecentAuditLogs() {
        return adminAuditLogRepository.findTop20ByOrderByTimestampDesc();
    }

    public void logAudit(String adminUsername, String action, String targetEntity,
                         String targetId, String details) {
        AdminAuditLog audit = AdminAuditLog.builder()
                .adminUsername(adminUsername != null ? adminUsername : "SYSTEM_ADMIN")
                .action(action)
                .targetEntity(targetEntity)
                .targetId(targetId)
                .details(details)
                .build();
        adminAuditLogRepository.save(audit);
    }
}
