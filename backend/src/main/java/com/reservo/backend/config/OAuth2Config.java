package com.reservo.backend.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

import com.reservo.backend.security.OAuth2AuthenticationSuccessHandler;

import lombok.RequiredArgsConstructor;

//@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@ConditionalOnProperty(name = "spring.security.oauth2.client.enabled", havingValue = "true", matchIfMissing = false)
public class OAuth2Config {

    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url}")
    private String frontendUrl;

    @Bean
    @org.springframework.core.annotation.Order(1)
    public SecurityFilterChain oauth2SecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/login/oauth2/**", "/oauth2/**")
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2AuthenticationSuccessHandler)
                .failureHandler((request, response, exception) -> {
                    // Redirect to frontend with error
                    response.sendRedirect(frontendUrl + "/login?error=oauth2_failed");
                })
            )
            .oauth2Client(org.springframework.security.config.Customizer.withDefaults());
        return http.build();
    }
}