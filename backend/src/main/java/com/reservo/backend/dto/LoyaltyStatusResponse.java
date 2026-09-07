package com.reservo.backend.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyStatusResponse {
    private String membershipLevel;
    private Integer points;
    private Long couponsCount;
    private Integer nextTierPoints;
    private List<LoyaltyTxDto> history;

    @Data
    @Builder
    @AllArgsConstructor
    public static class LoyaltyTxDto {
        private String id;
        private String description;
        private String points;
        private String date;
    }
}
