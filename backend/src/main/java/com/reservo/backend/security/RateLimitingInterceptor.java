package com.reservo.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.reservo.backend.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final Map<String, TokenBucket> ipBuckets = new ConcurrentHashMap<>();
    
    // Limits: 5 requests max, refilling at 1 request every 12 seconds (5 per minute)
    private static final long BUCKET_CAPACITY = 5;
    private static final double REFILL_RATE_PER_SECOND = 1.0 / 12.0;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        if (path.contains("/api/v1/auth/otp/") || path.contains("/api/v1/auth/login") || path.contains("/api/v1/auth/password-reset/")) {
            TokenBucket bucket = ipBuckets.computeIfAbsent(clientIp, ip -> new TokenBucket(BUCKET_CAPACITY, REFILL_RATE_PER_SECOND));

            if (!bucket.tryConsume()) {
                log.warn("Rate limit exceeded for IP: {} requesting path: {}", clientIp, path);
                
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                
                ApiResponse<String> apiResponse = ApiResponse.error("Too many requests. Please try again later.", 429);
                ObjectMapper mapper = new ObjectMapper();
                response.getWriter().write(mapper.writeValueAsString(apiResponse));
                return false;
            }
        }
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
