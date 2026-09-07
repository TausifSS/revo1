package com.reservo.backend.security;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.reservo.backend.entity.User;
import com.reservo.backend.repository.UserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler
        extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.url}")
    private String frontendUrl;


    // ============================================================
    // OAUTH2 LOGIN SUCCESS
    // ============================================================

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {

        try {

            // ----------------------------------------------------
            // Get OAuth2 token
            // ----------------------------------------------------

            OAuth2AuthenticationToken oauthToken =
                    (OAuth2AuthenticationToken) authentication;

            String provider =
                    oauthToken
                            .getAuthorizedClientRegistrationId()
                            .toUpperCase();

            OAuth2User oauthUser =
                    (OAuth2User) authentication.getPrincipal();


            // ----------------------------------------------------
            // Extract provider user ID
            // ----------------------------------------------------

            String providerUserId =
                    extractProviderUserId(
                            oauthUser,
                            provider
                    );


            // ----------------------------------------------------
            // Extract email
            // ----------------------------------------------------

            String email =
                    extractEmail(
                            oauthUser,
                            provider
                    );


            // ----------------------------------------------------
            // Extract name
            // ----------------------------------------------------

            String name =
                    extractName(
                            oauthUser,
                            provider
                    );


            // ----------------------------------------------------
            // Validate email
            // ----------------------------------------------------

            if (email == null || email.isBlank()) {

                log.error(
                        "OAuth2 login failed: email missing. Provider: {}",
                        provider
                );

                response.sendRedirect(
                        frontendUrl +
                        "/login?error=oauth_email_missing"
                );

                return;
            }

            email = email.trim().toLowerCase();


            // ----------------------------------------------------
            // Find existing user
            // ----------------------------------------------------

            Optional<User> existingUser =
                    userRepository.findByEmail(email);

            User user;


            // ====================================================
            // EXISTING USER
            // ====================================================

            if (existingUser.isPresent()) {

                user = existingUser.get();

                log.info(
                        "Existing user logged in using OAuth2: {}",
                        email
                );


                // ------------------------------------------------
                // Update OAuth provider information
                // ------------------------------------------------

                boolean changed = false;

                if (provider != null
                        && !provider.equalsIgnoreCase(
                                user.getLoginProvider()
                        )) {

                    user.setLoginProvider(provider);
                    changed = true;
                }


                if (providerUserId != null
                        && !providerUserId.isBlank()
                        && !providerUserId.equals(
                                user.getProviderUserId()
                        )) {

                    user.setProviderUserId(
                            providerUserId
                    );

                    changed = true;
                }


                // ------------------------------------------------
                // Update name if missing
                // ------------------------------------------------

                if ((user.getName() == null
                        || user.getName().isBlank())
                        && name != null
                        && !name.isBlank()) {

                    user.setName(name);
                    changed = true;
                }


                // ------------------------------------------------
                // OAuth provider verifies email
                // ------------------------------------------------

                if (!user.isEmailVerified()) {

                    user.setEmailVerified(true);
                    changed = true;
                }


                // ------------------------------------------------
                // Update last login
                // ------------------------------------------------

                user.setLastLoginAt(Instant.now());
                changed = true;


                if (changed) {
                    user.updateTimestamp();
                    user = userRepository.save(user);
                }

            }


            // ====================================================
            // NEW USER
            // ====================================================

            else {

                log.info(
                        "Creating new OAuth2 user: {}",
                        email
                );


                /*
                 * OAuth users don't authenticate using this password.
                 *
                 * We still store a secure random Argon2 hash because
                 * passwordHash exists in the User model.
                 */
                String randomPassword =
                        UUID.randomUUID().toString();


                user = User.builder()
                        .name(
                                name != null && !name.isBlank()
                                        ? name
                                        : "Guest User"
                        )
                        .email(email)
                        .passwordHash(
                                passwordEncoder.encode(
                                        randomPassword
                                )
                        )
                        .role(
                                User.Role.ROLE_CUSTOMER
                        )
                        .status(
                                User.UserStatus.ACTIVE
                        )
                        .loginProvider(provider)
                        .providerUserId(providerUserId)
                        .emailVerified(true)
                        .phoneVerified(false)
                        .kycStatus(
                                User.KycStatus.UNVERIFIED
                        )
                        .accountLocked(false)
                        .rewardPoints(0)
                        .membershipLevel("Member")
                        .lastLoginAt(Instant.now())
                        .build();


                user = userRepository.save(user);


                log.info(
                        "OAuth2 user created successfully: {}",
                        email
                );
            }


            // ====================================================
            // CHECK ACCOUNT STATUS
            // ====================================================

            if (user.getStatus() == User.UserStatus.BLOCKED) {

                log.warn(
                        "Blocked user attempted OAuth2 login: {}",
                        email
                );

                response.sendRedirect(
                        frontendUrl +
                        "/login?error=account_blocked"
                );

                return;
            }


            if (user.getStatus() == User.UserStatus.INACTIVE) {

                log.warn(
                        "Inactive user attempted OAuth2 login: {}",
                        email
                );

                response.sendRedirect(
                        frontendUrl +
                        "/login?error=account_inactive"
                );

                return;
            }


            // ====================================================
            // GENERATE JWT
            // ====================================================

            String token =
                    jwtUtils.generateToken(
                            user.getEmail(),
                            user.getRole().name()
                    );


            // ====================================================
            // REDIRECT TO FRONTEND
            // ====================================================

            String targetUrl =
                    frontendUrl +
                    "/oauth2/redirect?token=" +
                    token;


            log.info(
                    "OAuth2 authentication successful for: {}",
                    email
            );


            getRedirectStrategy()
                    .sendRedirect(
                            request,
                            response,
                            targetUrl
                    );

        } catch (Exception e) {

            log.error(
                    "OAuth2 authentication failed",
                    e
            );

            response.sendRedirect(
                    frontendUrl +
                    "/login?error=oauth_authentication_failed"
            );
        }
    }


    // ============================================================
    // EXTRACT EMAIL
    // ============================================================

    private String extractEmail(
            OAuth2User oauthUser,
            String provider
    ) {

        // Google / standard OAuth
        String email =
                oauthUser.getAttribute("email");

        if (email != null) {
            return email;
        }


        // Microsoft
        email =
                oauthUser.getAttribute(
                        "preferred_username"
                );

        if (email != null) {
            return email;
        }


        email =
                oauthUser.getAttribute("mail");

        if (email != null) {
            return email;
        }


        // Twitter/X
        if ("TWITTER".equals(provider)) {

            Object data =
                    oauthUser.getAttribute("data");

            if (data instanceof Map<?, ?> dataMap) {

                Object username =
                        dataMap.get("username");

                Object id =
                        dataMap.get("id");

                if (username != null) {

                    return "twitter_" +
                            username +
                            "@twitter.local";
                }

                if (id != null) {

                    return "twitter_" +
                            id +
                            "@twitter.local";
                }
            }


            /*
             * Fallback.
             *
             * This allows the OAuth login flow to continue even
             * when Twitter does not return an email address.
             */
            return "twitter_user_" +
                    UUID.randomUUID()
                            .toString()
                            .substring(0, 8) +
                    "@twitter.local";
        }


        return null;
    }


    // ============================================================
    // EXTRACT NAME
    // ============================================================

    private String extractName(
            OAuth2User oauthUser,
            String provider
    ) {

        String name =
                oauthUser.getAttribute("name");

        if (name != null && !name.isBlank()) {
            return name;
        }


        // Microsoft
        name =
                oauthUser.getAttribute("displayName");

        if (name != null && !name.isBlank()) {
            return name;
        }


        // Twitter/X
        if ("TWITTER".equals(provider)) {

            Object data =
                    oauthUser.getAttribute("data");

            if (data instanceof Map<?, ?> dataMap) {

                Object twitterName =
                        dataMap.get("name");

                if (twitterName != null) {
                    return twitterName.toString();
                }
            }
        }


        return "Guest User";
    }


    // ============================================================
    // EXTRACT PROVIDER USER ID
    // ============================================================

    private String extractProviderUserId(
            OAuth2User oauthUser,
            String provider
    ) {

        // Twitter/X
        if ("TWITTER".equals(provider)) {

            Object data =
                    oauthUser.getAttribute("data");

            if (data instanceof Map<?, ?> dataMap) {

                Object id =
                        dataMap.get("id");

                if (id != null) {
                    return id.toString();
                }
            }
        }


        // Standard OAuth2 providers
        Object id =
                oauthUser.getAttribute("sub");

        if (id != null) {
            return id.toString();
        }


        id =
                oauthUser.getAttribute("id");

        if (id != null) {
            return id.toString();
        }


        return null;
    }
}