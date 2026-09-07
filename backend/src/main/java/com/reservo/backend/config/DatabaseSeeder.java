package com.reservo.backend.config;

import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.reservo.backend.entity.Coupon;
import com.reservo.backend.entity.User;
import com.reservo.backend.repository.BookingRepository;
import com.reservo.backend.repository.CouponRepository;
import com.reservo.backend.repository.ResortRepository;
import com.reservo.backend.repository.RoomRepository;
import com.reservo.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ResortRepository resortRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final CouponRepository couponRepository;

    @Value("${app.database.seed.enabled:false}")
    private boolean seedEnabled;

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("Database seeding is disabled. Set app.database.seed.enabled=true to enable startup seeding.");
            return;
        }

        log.info("Checking initial user credentials in Firestore...");

        try {
            seedUser("resort@mail.in", "Resort Partner", "password", User.Role.ROLE_OWNER);
            seedUser("reservo@mail.in", "Reservo Team Admin", "password", User.Role.ROLE_ADMIN);
            seedUser("reservo1@mail.in", "Resort Partner Elite 1", "123456", User.Role.ROLE_OWNER);
            seedUser("reservo2@mail.in", "Resort Partner Elite 2", "123456", User.Role.ROLE_OWNER);

            log.info("Database startup: retaining all existing resorts, rooms, bookings, and coupons.");

            if (couponRepository.count() == 0) {
                log.info("Seeding initial demo coupons...");
                User admin = userRepository.findByEmail("reservo@mail.in").orElse(null);

                couponRepository.save(Coupon.builder()
                        .code("WELCOME10")
                        .userId(admin != null ? admin.getId() : null)
                        .discountType(Coupon.DiscountType.PERCENTAGE)
                        .discountValue(BigDecimal.valueOf(10))
                        .discountPercentage(10)
                        .minimumAmount(BigDecimal.valueOf(1000))
                        .status(Coupon.CouponStatus.ACTIVE)
                        .usageLimit(1000)
                        .build());

                couponRepository.save(Coupon.builder()
                        .code("AZURE20")
                        .userId(admin != null ? admin.getId() : null)
                        .discountType(Coupon.DiscountType.PERCENTAGE)
                        .discountValue(BigDecimal.valueOf(20))
                        .discountPercentage(20)
                        .resortId("1")
                        .minimumAmount(BigDecimal.valueOf(2000))
                        .status(Coupon.CouponStatus.ACTIVE)
                        .usageLimit(1000)
                        .build());
                log.info("Successfully seeded coupons!");
            }
        } catch (RuntimeException e) {
            // Startup seeding must not prevent the web server from starting when
            // Firestore is temporarily unreachable (for example DNS/network outage).
            log.warn("Startup database seeding skipped because Firestore is unavailable: {}", e.getMessage());
        }
    }

    private void seedUser(String email, String name, String rawPassword, User.Role role) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isEmpty()) {
            userRepository.save(User.builder()
                    .name(name)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .role(role)
                    .status(User.UserStatus.ACTIVE)
                    .kycStatus(User.KycStatus.VERIFIED)
                    .emailVerified(true)
                    .build());
            log.info("Seeded user: {}", email);
        } else {
            User user = existing.get();
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setStatus(User.UserStatus.ACTIVE);
            user.setRole(role);
            userRepository.save(user);
            log.info("Ensured active credentials for user: {}", email);
        }
    }
}
