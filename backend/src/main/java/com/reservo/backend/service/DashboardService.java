package com.reservo.backend.service;

import com.reservo.backend.dto.DashboardSummaryDTO;
import com.reservo.backend.entity.Booking;
import com.reservo.backend.entity.Room;
import com.reservo.backend.repository.BookingRepository;
import com.reservo.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;

    public DashboardSummaryDTO getDashboardSummary() {
        List<Booking> allBookings = bookingRepository.findAll();
        long totalBookings = allBookings.size();

        BigDecimal revenue = allBookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CONFIRMED ||
                             b.getStatus() == Booking.BookingStatus.COMPLETED)
                .map(Booking::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<DashboardSummaryDTO.RevenuePoint> revenueOverview = buildRevenueOverview(allBookings);
        List<DashboardSummaryDTO.SourceShare> sources = buildSourceShares(allBookings);
        List<DashboardSummaryDTO.RecentBookingItem> recent = buildRecentBookings(allBookings);
        Map<String, List<Boolean>> matrix = buildRoomMatrix(allBookings);

        return DashboardSummaryDTO.builder()
                .totalBookings(totalBookings)
                .totalBookingsGrowth("+12% vs last week")
                .totalRevenue(revenue)
                .totalRevenueGrowth("+18% vs last week")
                .occupancyRate(calculateOccupancy(allBookings))
                .occupancyRateGrowth("+8% vs last week")
                .avgRating(4.7)
                .avgRatingGrowth("+0.2 vs last week")
                .revenueOverview(revenueOverview)
                .bookingSources(sources)
                .recentBookings(recent)
                .roomOccupancyMatrix(matrix)
                .build();
    }

    private List<DashboardSummaryDTO.RevenuePoint> buildRevenueOverview(List<Booking> bookings) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM");
        LocalDate today = LocalDate.now();
        Map<String, BigDecimal> daily = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) daily.put(today.minusDays(i).format(fmt), BigDecimal.ZERO);

        for (Booking b : bookings) {
            if ((b.getStatus() == Booking.BookingStatus.CONFIRMED ||
                 b.getStatus() == Booking.BookingStatus.COMPLETED) &&
                b.getCheckInDate() != null && b.getTotalAmount() != null) {
                String key = b.getCheckInDate().format(fmt);
                if (daily.containsKey(key)) daily.put(key, daily.get(key).add(b.getTotalAmount()));
            }
        }

        List<DashboardSummaryDTO.RevenuePoint> result = new ArrayList<>();
        daily.forEach((date, amount) -> result.add(
                new DashboardSummaryDTO.RevenuePoint(
                        date, amount.divide(BigDecimal.valueOf(1000), 0, RoundingMode.HALF_UP).intValue())));
        return result;
    }

    private List<DashboardSummaryDTO.SourceShare> buildSourceShares(List<Booking> bookings) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Booking b : bookings) {
            String source = b.getBookingSource() == null ? "Direct" :
                    b.getBookingSource().name();
            source = source.substring(0, 1).toUpperCase() +
                    source.substring(1).toLowerCase();
            counts.merge(source, 1L, Long::sum);
        }

        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        List<DashboardSummaryDTO.SourceShare> result = new ArrayList<>();
        counts.forEach((source, count) -> result.add(
                new DashboardSummaryDTO.SourceShare(
                        source, total == 0 ? 0 : (int) (count * 100 / total))));
        return result;
    }

    private List<DashboardSummaryDTO.RecentBookingItem> buildRecentBookings(List<Booking> bookings) {
        return bookings.stream()
                .sorted(Comparator.comparing(
                        Booking::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(b -> new DashboardSummaryDTO.RecentBookingItem(
                        b.getBookingCode(),
                        b.getGuestName() != null ? b.getGuestName() : "Guest User",
                        b.getRoomId() != null ? "Room " + b.getRoomId() : "Room",
                        formatDates(b),
                        b.getTotalAmount(),
                        b.getStatus() != null ? b.getStatus().name() : "PENDING"))
                .toList();
    }

    private String formatDates(Booking b) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM");
        if (b.getCheckInDate() == null || b.getCheckOutDate() == null) return "";
        return b.getCheckInDate().format(fmt) + " - " + b.getCheckOutDate().format(fmt);
    }

    private Map<String, List<Boolean>> buildRoomMatrix(List<Booking> bookings) {
        Map<String, List<Boolean>> matrix = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();

        for (Room room : roomRepository.findAll()) {
            String label = room.getRoomType() != null ? room.getRoomType() : "Room";
            List<Boolean> days = matrix.computeIfAbsent(label, k -> new ArrayList<>());

            if (days.isEmpty()) {
                for (int i = 0; i < 7; i++) {
                    LocalDate date = today.plusDays(i);
                    boolean occupied = bookings.stream().anyMatch(b ->
                            room.getId() != null && room.getId().equals(b.getRoomId()) &&
                            b.getStatus() != Booking.BookingStatus.CANCELLED &&
                            b.getCheckInDate() != null && b.getCheckOutDate() != null &&
                            !date.isBefore(b.getCheckInDate()) &&
                            date.isBefore(b.getCheckOutDate()));
                    days.add(!occupied);
                }
            }
        }
        return matrix;
    }

    private double calculateOccupancy(List<Booking> bookings) {
        long active = bookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CONFIRMED ||
                             b.getStatus() == Booking.BookingStatus.COMPLETED)
                .count();
        long rooms = roomRepository.findAll().size();
        return rooms == 0 ? 0.0 : Math.min(100.0, active * 100.0 / rooms);
    }
}
