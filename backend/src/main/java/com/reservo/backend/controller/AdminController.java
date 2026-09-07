package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.*;
import com.reservo.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<User>> updateUserStatus(
            @PathVariable String id,
            @RequestParam User.UserStatus status,
            @RequestParam(required = false, defaultValue = "Admin") String adminName) {
        User updated = adminService.updateUserStatus(id, status, adminName);
        return ResponseEntity.ok(ApiResponse.success(updated, "User status updated successfully"));
    }

    @GetMapping("/resorts/pending")
    public ResponseEntity<ApiResponse<List<Resort>>> getPendingResorts() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getPendingResorts()));
    }

    @GetMapping("/resorts")
    public ResponseEntity<ApiResponse<List<Resort>>> getAllResorts() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllResorts()));
    }

    @PatchMapping("/resorts/{id}/status")
    public ResponseEntity<ApiResponse<Resort>> updateResortStatus(
            @PathVariable String id,
            @RequestParam Resort.ResortStatus status,
            @RequestParam(required = false, defaultValue = "Admin") String adminName) {
        Resort updated = adminService.updateResortStatus(id, status, adminName);
        return ResponseEntity.ok(ApiResponse.success(updated, "Resort status updated successfully"));
    }


    @GetMapping("/coupons")
    public ResponseEntity<ApiResponse<List<Coupon>>> getAllCoupons() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllCoupons()));
    }

    @PostMapping("/coupons")
    public ResponseEntity<ApiResponse<Coupon>> createCoupon(@RequestBody Coupon coupon) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String adminName = auth != null ? auth.getName() : "SYSTEM_ADMIN";
        Coupon created = adminService.createPlatformCoupon(coupon, adminName);
        return ResponseEntity.ok(ApiResponse.success(created, "Coupon created successfully"));
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String adminName = auth != null ? auth.getName() : "SYSTEM_ADMIN";
        adminService.deleteCoupon(id, adminName);
        return ResponseEntity.ok(ApiResponse.success(null, "Coupon deleted successfully"));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<Booking>>> getAllBookings() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllBookings()));
    }

    @PatchMapping("/bookings/{id}/cancel")
    public ResponseEntity<ApiResponse<Booking>> cancelBooking(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "Admin") String adminName) {
        Booking cancelled = adminService.cancelBookingByAdmin(id, adminName);
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Booking cancelled by admin successfully"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AdminAuditLog>>> getAuditLogs() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getRecentAuditLogs()));
    }
}
