package com.reservo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDTO {
    private long totalBookings;
    private String totalBookingsGrowth; // e.g. "+12% vs last week"
    private BigDecimal totalRevenue;
    private String totalRevenueGrowth; // e.g. "+18% vs last week"
    private double occupancyRate; // e.g. 78.0
    private String occupancyRateGrowth; // e.g. "+8% vs last week"
    private double avgRating; // e.g. 4.7
    private String avgRatingGrowth; // e.g. "+0.2 vs last week"

    private List<RevenuePoint> revenueOverview;
    private List<SourceShare> bookingSources;
    private List<RecentBookingItem> recentBookings;
    private Map<String, List<Boolean>> roomOccupancyMatrix;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class RevenuePoint {
        private String date; // e.g. "10 Jul"
        private double amount;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class SourceShare {
        private String source; // "Direct", "Search", "Referral", "Others"
        private int percentage;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class RecentBookingItem {
        private String bookingCode;
        private String guestName;
        private String roomType;
        private String dates;
        private BigDecimal totalAmount;
        private String status;
    }
}
