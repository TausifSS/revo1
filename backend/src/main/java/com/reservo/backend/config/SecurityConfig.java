package com.reservo.backend.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.reservo.backend.security.CustomUserDetailsService;
import com.reservo.backend.security.JwtAuthenticationFilter;
import com.reservo.backend.security.OAuth2AuthenticationSuccessHandler;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;


    // ============================================================
    // PASSWORD ENCODER
    // ============================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return Argon2PasswordEncoder
                .defaultsForSpringSecurity_v5_8();
    }


    // ============================================================
    // AUTHENTICATION PROVIDER
    // ============================================================

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider authProvider =
                new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(
                customUserDetailsService
        );

        authProvider.setPasswordEncoder(
                passwordEncoder()
        );

        return authProvider;
    }


    // ============================================================
    // AUTHENTICATION MANAGER
    // ============================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration
    ) throws Exception {

        return authenticationConfiguration
                .getAuthenticationManager();
    }


    // ============================================================
    // SECURITY FILTER CHAIN
    // ============================================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            OAuth2AuthenticationSuccessHandler
                    oAuth2AuthenticationSuccessHandler
    ) throws Exception {

        http

                // ====================================================
                // CORS
                // ====================================================

                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )


                // ====================================================
                // CSRF
                // ====================================================

                .csrf(AbstractHttpConfigurer::disable)


                // ====================================================
                // AUTHORIZATION
                // ====================================================

                .authorizeHttpRequests(auth -> auth


                        // ====================================================
                        // CORS PREFLIGHT
                        // ====================================================

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()


                        // ====================================================
                        // PUBLIC AUTHENTICATION ENDPOINTS
                        // ====================================================

                        .requestMatchers(
                                "/api/v1/auth/login",
                                "/api/v1/auth/signup",
                                "/api/v1/auth/otp/**",
                                "/api/v1/auth/password-reset/**",
                                "/api/v1/auth/login/phone",
                                "/api/v1/auth/signup/phone",
                                "/api/v1/auth/social/login",
                                "/api/v1/auth/logout",
                                "/api/v1/auth/me"
                        ).permitAll()


                        // ====================================================
                        // OAUTH2
                        // ====================================================

                        .requestMatchers(
                                "/oauth2/**",
                                "/login/oauth2/code/**"
                        ).permitAll()


                        // ====================================================
                        // STRIPE WEBHOOK
                        // ====================================================

                        .requestMatchers(
                                "/api/v1/payments/webhook"
                        ).permitAll()


                        // ====================================================
                        // SWAGGER
                        // ====================================================

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()


                        // ====================================================
                        // ADMIN
                        // ====================================================

                        .requestMatchers(
                                "/api/v1/admin/**"
                        ).hasRole("ADMIN")


                        // ====================================================
                        // MEDIA FILES
                        //
                        // Anyone can VIEW an already uploaded image.
                        // Only authenticated users can UPLOAD images.
                        // ====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/media/files/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/media/upload"
                        ).authenticated()


                        // ====================================================
                        // PUBLIC GET ENDPOINTS
                        // ====================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/resorts/**",
                                "/api/v1/offers/**",
                                "/api/v1/rooms/**",
                                "/api/v1/reviews/**",
                                "/api/v1/availability/**",
                                "/api/v1/rewards/validate"
                        ).permitAll()


                        // ====================================================
                        // PUBLIC AI ENDPOINTS
                        // ====================================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/ai/chat",
                                "/api/v1/ai/itinerary"
                        ).permitAll()


                        // ====================================================
                        // CREATE RESORT
                        // ====================================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/resorts"
                        ).authenticated()


                        // ====================================================
                        // OWNER / ADMIN RESORT + ROOM OPERATIONS
                        // ====================================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/resorts/**",
                                "/api/v1/rooms/**"
                        ).hasAnyRole(
                                "OWNER",
                                "ADMIN"
                        )


                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/v1/resorts/**",
                                "/api/v1/rooms/**"
                        ).hasAnyRole(
                                "OWNER",
                                "ADMIN"
                        )


                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/v1/resorts/**",
                                "/api/v1/rooms/**"
                        ).hasAnyRole(
                                "OWNER",
                                "ADMIN"
                        )


                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/v1/rooms/**"
                        ).hasAnyRole(
                                "OWNER",
                                "ADMIN"
                        )


                        // ====================================================
                        // DOCUMENTS
                        // ====================================================

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/v1/documents/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                "/api/v1/documents/**"
                        ).authenticated()


                        // ====================================================
                        // STAFF
                        // ====================================================

                        .requestMatchers(
                                "/api/v1/staff/**"
                        ).hasAnyRole(
                                "OWNER",
                                "ADMIN"
                        )


                        // ====================================================
                        // OFFERS
                        // ====================================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/offers/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/v1/offers/**"
                        ).hasRole("ADMIN")


                        // ====================================================
                        // USER ADMIN OPERATIONS
                        // ====================================================

                        .requestMatchers(
                                "/api/v1/user/pending-hosts",
                                "/api/v1/user/all-users",
                                "/api/v1/user/approve-host",
                                "/api/v1/user/reject-host",
                                "/api/v1/user/change-status"
                        ).hasRole("ADMIN")


                        // ====================================================
                        // BOOKING ADMIN OPERATIONS
                        // ====================================================

                        .requestMatchers(
                                "/api/v1/bookings/admin-all",
                                "/api/v1/bookings/update-status"
                        ).hasRole("ADMIN")


                        // ====================================================
                        // RESORT ADMIN OPERATIONS
                        // ====================================================

                        .requestMatchers(
                                "/api/v1/resorts/admin-all",
                                "/api/v1/resorts/update-status",
                                "/api/v1/resorts/request-changes"
                        ).hasRole("ADMIN")


                        // ====================================================
                        // AUTHENTICATED USER ENDPOINTS
                        // ====================================================

                        .requestMatchers(
                                "/api/v1/bookings/**",
                                "/api/v1/wishlist/**",
                                "/api/v1/user/**",
                                "/api/v1/reviews/**",
                                "/api/v1/payments/**",
                                "/api/v1/rewards/**",
                                "/api/v1/notifications/**"
                        ).authenticated()


                        // ====================================================
                        // EVERYTHING ELSE
                        // ====================================================

                        .anyRequest()
                        .authenticated()
                )


                // ============================================================
                // OAUTH2 LOGIN
                // ============================================================

                .oauth2Login(oauth2 ->
                        oauth2.successHandler(
                                oAuth2AuthenticationSuccessHandler
                        )
                )


                // ============================================================
                // JWT FILTER
                // ============================================================

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )


                // ============================================================
                // UNAUTHORIZED RESPONSE
                // ============================================================

                .exceptionHandling(exceptions ->
                        exceptions.authenticationEntryPoint(
                                (request, response, authException) -> {

                                    response.setStatus(
                                            jakarta.servlet.http.HttpServletResponse
                                                    .SC_UNAUTHORIZED
                                    );

                                    response.setContentType(
                                            "application/json"
                                    );

                                    response.getWriter().write(
                                            "{\"success\":false," +
                                            "\"message\":\"Unauthorized: session invalid or expired\"," +
                                            "\"error\":\"Unauthorized\"}"
                                    );
                                }
                        )
                )


                // ============================================================
                // SECURITY HEADERS
                // ============================================================

                .headers(headers ->
                        headers

                                .contentSecurityPolicy(csp ->
                                        csp.policyDirectives(
                                                "default-src 'self'; " +

                                                "script-src 'self' " +
                                                "'unsafe-inline' " +
                                                "'unsafe-eval'; " +

                                                "style-src 'self' " +
                                                "'unsafe-inline' " +
                                                "https://fonts.googleapis.com " +
                                                "https://cdnjs.cloudflare.com; " +

                                                "font-src 'self' " +
                                                "data: " +
                                                "https://fonts.gstatic.com " +
                                                "https://cdnjs.cloudflare.com; " +

                                                "img-src 'self' " +
                                                "data: " +
                                                "blob: " +
                                                "http://localhost:8080 " +
                                                "http://localhost:5173 " +
                                                "https://images.unsplash.com; " +

                                                "media-src 'self' " +
                                                "blob: " +
                                                "http://localhost:8080 " +
                                                "https://player.vimeo.com " +
                                                "https://*.vimeo.com; " +

                                                "connect-src 'self' " +
                                                "http://localhost:8080 " +
                                                "http://localhost:5173; " +

                                                "frame-ancestors 'none';"
                                        )
                                )

                                .frameOptions(
                                        frame -> frame.deny()
                                )

                                .httpStrictTransportSecurity(
                                        hsts -> hsts
                                                .includeSubDomains(true)
                                                .maxAgeInSeconds(
                                                        31536000
                                                )
                                )

                                .referrerPolicy(
                                        referrer ->
                                                referrer.policy(
                                                        ReferrerPolicyHeaderWriter
                                                                .ReferrerPolicy
                                                                .NO_REFERRER_WHEN_DOWNGRADE
                                                )
                                )
                );

        return http.build();
    }


    // ============================================================
    // CORS CONFIGURATION
    // ============================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                allowedOrigins
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(
                true
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}