package com.reservo.backend.dto;

import com.reservo.backend.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingHistoryResponse {

    private String bookingId;
    private String bookingCode;

    private String resortName;
    private String resortLocation;

    private String roomNumber;
    private String roomType;

    private LocalDate checkInDate;
    private LocalDate checkOutDate;

    private Integer guestsCount;
    private Integer roomsCount;

    private BigDecimal totalAmount;

    private Booking.BookingStatus status;
    private Booking.BookingSource bookingSource;

    private Instant createdAt;
}
