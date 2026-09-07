package com.reservo.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.Room;
import com.reservo.backend.service.RoomService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/resort/{resortId}")
    public ResponseEntity<ApiResponse<List<Room>>> getRoomsByResort(
            @PathVariable String resortId
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        roomService.getRoomsByResort(resortId)
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Room>> getRoomById(
            @PathVariable String id
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        roomService.getRoomById(id)
                )
        );
    }

    @PostMapping("/resort/{resortId}")
    public ResponseEntity<ApiResponse<Room>> createRoom(
            @PathVariable String resortId,
            @RequestBody Room room
    ) {

        Room created =
                roomService.createRoom(
                        resortId,
                        room
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        created,
                        "Room created successfully"
                )
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Room>> updateRoomStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {

        Room.RoomStatus status = null;

        if (body.get("status") != null) {
            status = Room.RoomStatus.valueOf(
                    body.get("status").toUpperCase()
            );
        }

        String maintenance =
                body.get("maintenanceDetails");

        Room updated =
                roomService.updateRoomStatus(
                        id,
                        status,
                        maintenance
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        updated,
                        "Room status updated successfully"
                )
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Room>> updateRoom(
            @PathVariable String id,
            @RequestBody Room room
    ) {

        Room updated =
                roomService.updateRoom(
                        id,
                        room
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        updated,
                        "Room updated successfully"
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(
            @PathVariable String id
    ) {

        roomService.deleteRoom(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "Room deleted successfully"
                )
        );
    }
}