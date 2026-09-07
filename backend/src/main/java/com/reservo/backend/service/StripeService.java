package com.reservo.backend.service;

import com.reservo.backend.entity.Booking;
import com.reservo.backend.entity.Resort;
import com.reservo.backend.repository.ResortRepository;
import com.stripe.Stripe;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class StripeService {
    @Value("${app.stripe.api-key}")
    private String apiKey;

    private final ResortRepository resortRepository;

    @PostConstruct
    public void init() {
        Stripe.apiKey = apiKey;
        log.info("Stripe SDK initialized successfully.");
    }

    public boolean isPlaceholderKey() {
        return apiKey == null || apiKey.trim().isEmpty()
                || apiKey.contains("SampleKey")
                || apiKey.equals("sk_test_51PxSampleKey");
    }

    public Session createCheckoutSession(
            Booking booking, String successUrl, String cancelUrl, String couponCode) throws Exception {

        long unitAmount = booking.getTotalAmount()
                .multiply(BigDecimal.valueOf(100)).longValue();

        String resortName = "Resort";
        if (booking.getResortId() != null) {
            resortName = resortRepository.findById(booking.getResortId())
                    .map(Resort::getName).orElse("Resort");
        }

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "?bookingCode=" + booking.getBookingCode())
                .setCancelUrl(cancelUrl)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("inr")
                                .setUnitAmount(unitAmount)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(resortName + " - Room Reservation")
                                        .setDescription("Booking Code: " + booking.getBookingCode())
                                        .build())
                                .build())
                        .build())
                .putMetadata("bookingCode", booking.getBookingCode());

        if (couponCode != null && !couponCode.trim().isEmpty()) {
            builder.putMetadata("couponCode", couponCode.trim());
        }

        return Session.create(builder.build());
    }

    public Refund refundPayment(String paymentIntentId, BigDecimal amount) throws Exception {
        long refundAmount = amount.multiply(BigDecimal.valueOf(100)).longValue();

        RefundCreateParams params = RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId)
                .setAmount(refundAmount)
                .build();

        return Refund.create(params);
    }
}
