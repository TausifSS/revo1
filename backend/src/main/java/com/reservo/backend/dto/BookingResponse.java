package com.reservo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {

    private String bookingId;
    private String bookingCode;

    private String resortId;
    private String userId;
    private String roomId;

    private LocalDate checkIn;
    private LocalDate checkOut;

    private int guests;
    private BigDecimal totalPrice;
    private String status;
}
