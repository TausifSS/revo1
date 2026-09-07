package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.Staff;
import com.reservo.backend.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffRepository staffRepository;

    @GetMapping("/resort/{resortId}")
    public ResponseEntity<ApiResponse<List<Staff>>> getStaffByResort(@PathVariable String resortId) {
        return ResponseEntity.ok(ApiResponse.success(staffRepository.findByResortId(resortId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Staff>> addStaffMember(@RequestBody Staff staffMember) {
        Staff saved = staffRepository.save(staffMember);
        return ResponseEntity.ok(ApiResponse.success(saved, "Staff member added successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteStaffMember(@PathVariable String id) {
        staffRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Staff member removed successfully"));
    }
}
