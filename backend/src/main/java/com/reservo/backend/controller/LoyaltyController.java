package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.dto.LoyaltyStatusResponse;
import com.reservo.backend.entity.Coupon;
import com.reservo.backend.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.reservo.backend.dto.CouponValidationResponse;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/rewards")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<LoyaltyStatusResponse>> getRewardStatus() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        LoyaltyStatusResponse response = loyaltyService.getRewardStatus(email);
        return ResponseEntity.ok(ApiResponse.success(response, "Rewards status retrieved successfully"));
    }

    @PostMapping("/redeem")
    public ResponseEntity<ApiResponse<Coupon>> redeemPoints(@RequestParam Integer points) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Coupon coupon = loyaltyService.redeemPoints(email, points);
        return ResponseEntity.ok(ApiResponse.success(coupon, "Points redeemed successfully for coupon"));
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validateCoupon(
            @RequestParam String code,
            @RequestParam(required = false) String resortId,
            @RequestParam(required = false) BigDecimal amount) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) ? auth.getName() : null;
        CouponValidationResponse response = loyaltyService.validateCoupon(email, code, resortId, amount);
        return ResponseEntity.ok(ApiResponse.success(response, "Coupon code is valid"));
    }
}
