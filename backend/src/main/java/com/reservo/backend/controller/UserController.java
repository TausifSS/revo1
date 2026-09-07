package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.User;
import com.reservo.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<User>> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<User>> updateProfile(@RequestBody Map<String, String> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String name = body.get("name");
        String phone = body.get("phone");
        User updated = userService.updateProfile(auth.getName(), name, phone);
        return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated successfully"));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<String>> changePassword(@RequestBody Map<String, String> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        userService.changePassword(auth.getName(), oldPassword, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    @PostMapping("/verify-kyc")
    public ResponseEntity<ApiResponse<User>> verifyKyc(@RequestBody Map<String, String> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String documentType = body.get("documentType");
        String documentUrl = body.get("documentUrl");

        User user = userService.getUserByEmail(auth.getName());
        user.setKycStatus(User.KycStatus.VERIFIED);
        user.setKycDocumentType(documentType != null ? documentType : "Govt ID");
        user.setKycDocumentUrl(documentUrl != null ? documentUrl : "mock://kyc-document-verification");

        User updated = userService.saveUser(user);
        return ResponseEntity.ok(ApiResponse.success(updated, "KYC verified successfully"));
    }

    @PostMapping("/apply-host")
    public ResponseEntity<ApiResponse<User>> applyHost(@RequestBody Map<String, String> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        user.setKycStatus(User.KycStatus.PENDING_VERIFICATION);
        user.setKycDocumentType(body.getOrDefault("documentType", "Aadhaar Card"));
        user.setKycDocumentUrl(body.getOrDefault("documentUrl", "mock://kyc-document-scan-uploaded"));
        User updated = userService.saveUser(user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Host application submitted successfully. Pending Admin Approval."));
    }

    @GetMapping("/pending-hosts")
    public ResponseEntity<ApiResponse<List<User>>> getPendingHosts() {
        List<User> pending = userService.getPendingHosts();
        return ResponseEntity.ok(ApiResponse.success(pending, "Pending host applications retrieved"));
    }

    @PostMapping("/approve-host")
    public ResponseEntity<ApiResponse<User>> approveHost(@RequestParam String userId) {
        User user = userService.getUserById(userId);
        user.setRole(User.Role.ROLE_OWNER);
        user.setKycStatus(User.KycStatus.VERIFIED);
        
        // Also save a custom string in user settings or trigger user flag so frontend displays approval alert
        user.setMembershipLevel("Host Approved"); 

        User updated = userService.saveUser(user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Host approved successfully"));
    }

    @PostMapping("/reject-host")
    public ResponseEntity<ApiResponse<User>> rejectHost(@RequestParam String userId) {
        User user = userService.getUserById(userId);
        user.setKycStatus(User.KycStatus.REJECTED);
        User updated = userService.saveUser(user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Host application rejected"));
    }

    @GetMapping("/all-users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    @PostMapping("/change-status")
    public ResponseEntity<ApiResponse<User>> changeUserStatus(
            @RequestParam String userId,
            @RequestParam User.UserStatus status) {
        User user = userService.getUserById(userId);
        user.setStatus(status);
        User updated = userService.saveUser(user);
        return ResponseEntity.ok(ApiResponse.success(updated, "User status updated to " + status));
    }
}
