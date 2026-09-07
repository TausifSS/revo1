package com.reservo.backend.security;

import java.time.Instant;

public class TokenBucket {
    private final long capacity;
    private final double refillRatePerSecond;
    private double tokens;
    private Instant lastRefillTimestamp;

    public TokenBucket(long capacity, double refillRatePerSecond) {
        this.capacity = capacity;
        this.refillRatePerSecond = refillRatePerSecond;
        this.tokens = capacity;
        this.lastRefillTimestamp = Instant.now();
    }

    public synchronized boolean tryConsume() {
        refill();
        if (tokens >= 1.0) {
            tokens -= 1.0;
            return true;
        }
        return false;
    }

    private void refill() {
        Instant now = Instant.now();
        double elapsedSeconds = (now.toEpochMilli() - lastRefillTimestamp.toEpochMilli()) / 1000.0;
        double refillAmount = elapsedSeconds * refillRatePerSecond;
        tokens = Math.min(capacity, tokens + refillAmount);
        lastRefillTimestamp = now;
    }
}
