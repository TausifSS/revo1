package com.reservo.backend.service;

import com.reservo.backend.entity.Booking;
import com.reservo.backend.entity.Resort;
import com.reservo.backend.repository.BookingRepository;
import com.reservo.backend.repository.ResortRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BookingRepository bookingRepository;
    private final ResortRepository resortRepository;

    /**
     * Generate booking report as CSV.
     */
    public ByteArrayInputStream generateBookingReportCsv() {

        List<Booking> bookings = bookingRepository.findAll();

        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try (PrintWriter writer = new PrintWriter(out)) {

            // CSV header
            writer.println(
                    "Booking ID,Booking Code,Guest Name,Resort Name," +
                    "Check In,Check Out,Total Amount,Status"
            );

            for (Booking booking : bookings) {

                String resortName = "Resort";

                // Resort ID is now String because we migrated to Firestore
                if (booking.getResortId() != null) {

                    resortName = resortRepository
                            .findById(booking.getResortId())
                            .map(Resort::getName)
                            .orElse("Resort");
                }

                writer.println(
                        csv(
                                String.valueOf(booking.getId()),
                                booking.getBookingCode(),
                                booking.getGuestName() != null
                                        ? booking.getGuestName()
                                        : "Guest",
                                resortName,
                                booking.getCheckInDate() != null
                                        ? booking.getCheckInDate().toString()
                                        : "",
                                booking.getCheckOutDate() != null
                                        ? booking.getCheckOutDate().toString()
                                        : "",
                                booking.getTotalAmount() != null
                                        ? booking.getTotalAmount().toString()
                                        : "0",
                                booking.getStatus() != null
                                        ? booking.getStatus().name()
                                        : ""
                        )
                );
            }
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    /**
     * Properly escape values for CSV.
     *
     * Example:
     *
     * Guest, John
     *
     * becomes:
     *
     * "Guest, John"
     *
     * Quotes inside values are doubled according to CSV rules.
     */
    private String csv(String... values) {

        return java.util.Arrays.stream(values)
                .map(value -> {
                    String safeValue =
                            value == null
                                    ? ""
                                    : value.replace("\"", "\"\"");

                    return "\"" + safeValue + "\"";
                })
                .collect(Collectors.joining(","));
    }
}