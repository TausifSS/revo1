package com.reservo.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.reservo.backend.entity.Resort;
import com.reservo.backend.entity.User;
import com.reservo.backend.exception.ResourceNotFoundException;
import com.reservo.backend.repository.ResortRepository;
import com.reservo.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResortService {

    private final ResortRepository resortRepository;
    private final UserRepository userRepository;

    // ============================================================
    // GET ALL APPROVED RESORTS
    // ============================================================

    public List<Resort> getAllApprovedResorts() {
        // Public listings must be real, complete, database-backed
        // properties that have been approved by Admin.
        return resortRepository.findByStatus(
                Resort.ResortStatus.APPROVED
        ).stream()
                .filter(this::isValidPublicResort)
                .toList();
    }

    private boolean isValidPublicResort(Resort resort) {
        return resort != null
                && resort.getName() != null
                && !resort.getName().isBlank()
                && resort.getLocation() != null
                && !resort.getLocation().isBlank();
    }

    // ============================================================
    // GET ALL RESORTS - ADMIN
    // ============================================================

    public List<Resort> getAllResortsForAdmin() {
        return resortRepository.findAll();
    }

    // ============================================================
    // UPDATE RESORT STATUS
    // ============================================================

    public Resort updateResortStatus(
            String resortId,
            Resort.ResortStatus status
    ) {

        Resort resort = getResortById(resortId);

        resort.setStatus(status);

        return resortRepository.save(resort);
    }

    // ============================================================
    // REQUEST CHANGES
    // ============================================================

    public Resort requestChanges(
            String resortId,
            String comment
    ) {

        Resort resort = getResortById(resortId);

        resort.setStatus(
                Resort.ResortStatus.CHANGES_REQUESTED
        );

        if (comment != null && !comment.isBlank()) {
            resort.setFeaturedTag(
                    "Action Required: " + comment
            );
        }

        return resortRepository.save(resort);
    }

    // ============================================================
    // GET RESORT BY ID
    // ============================================================

    public Resort getResortById(String id) {

        return resortRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Resort not found with ID: " + id
                        )
                );
    }

    // ============================================================
    // SEARCH RESORTS
    // ============================================================

    public List<Resort> searchResorts(String search) {

        if (search == null || search.trim().isEmpty()) {
            return getAllApprovedResorts();
        }

        String searchText = search.trim();

        /*
         * Firestore does not support the old JPA
         * Specification API.
         *
         * ResortRepository performs the
         * name/location search in Java.
         */
        return resortRepository
                .findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(
                        searchText,
                        searchText
                )
                .stream()
                .filter(resort ->
                        resort.getStatus() ==
                                Resort.ResortStatus.APPROVED
                )
                .filter(this::isValidPublicResort)
                .toList();
    }

    // ============================================================
    // CREATE RESORT
    // ============================================================

    public Resort createResort(Resort resort) {

        Authentication auth = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            throw new SecurityException("Authentication is required to submit a property");
        }

        String email = auth.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found for authenticated account: " + email));

        // Any authenticated user may submit a property application. The
        // submitting user's id becomes the eventual owner of the property.
        // Admin approval below will promote a customer account to OWNER.
        resort.setOwnerId(user.getId());

        if (user.getRole() == User.Role.ROLE_CUSTOMER
                && user.getKycStatus() != User.KycStatus.PENDING_VERIFICATION
                && user.getKycStatus() != User.KycStatus.VERIFIED) {
            user.setKycStatus(User.KycStatus.PENDING_VERIFICATION);
            userRepository.save(user);
        }

        // NEVER publish directly from the user submission endpoint.
        // Every property must be reviewed by an Admin first.
        resort.setStatus(Resort.ResortStatus.PENDING_APPROVAL);

        if (resort.getRating() == null) {
            resort.setRating(5.0);
        }
        if (resort.getReviewCount() == null) {
            resort.setReviewCount(0);
        }
        if (resort.getCreatedAt() == null) {
            resort.setCreatedAt(Instant.now());
        }

        return resortRepository.save(resort);
    }

    // ============================================================
    // UPDATE RESORT BY OWNER
    // ============================================================

    /**
     * Updates a property owned by the currently authenticated owner.
     *
     * Every owner edit goes back through Admin approval. The submitted
     * values are stored on the same Firestore document and the public
     * listing remains hidden until an Admin changes the status to APPROVED.
     */
    public Resort updateResortByOwner(String resortId, Resort changes) {

        Authentication auth = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            throw new SecurityException("Authentication is required to edit a property");
        }

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found for authenticated account: " + auth.getName()));

        Resort existing = resortRepository.findById(resortId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resort not found with ID: " + resortId));

        // Never allow an owner to edit somebody else's property.
        if (existing.getOwnerId() == null
                || !existing.getOwnerId().equals(user.getId())) {
            throw new SecurityException("You are not allowed to edit this property");
        }

        // Never allow the client to change identity/ownership/status.
        existing.setName(changes.getName());
        existing.setLocation(changes.getLocation());
        existing.setDescription(changes.getDescription());
        existing.setImageUrl(changes.getImageUrl());
        existing.setPricePerNight(changes.getPricePerNight());
        existing.setFeaturedTag(changes.getFeaturedTag());
        existing.setDiscountPercentage(changes.getDiscountPercentage());
        existing.setCategory(changes.getCategory());
        existing.setGalleryUrls(changes.getGalleryUrls());
        existing.setVideoUrls(changes.getVideoUrls());
        existing.setHighlights(changes.getHighlights());
        existing.setAmenities(changes.getAmenities());
        existing.setGuests(changes.getGuests());
        existing.setBedrooms(changes.getBedrooms());
        existing.setBeds(changes.getBeds());
        existing.setBathrooms(changes.getBathrooms());

        // Owner edits always require a fresh admin approval.
        existing.setStatus(Resort.ResortStatus.PENDING_APPROVAL);

        return resortRepository.save(existing);
    }

    // ============================================================
    // FILTER RESORTS
    // ============================================================

    public List<Resort> filterResorts(
            String location,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double minRating
    ) {

        /*
         * Firestore version of the old JPA
         * ResortSpecification.filterResorts().
         *
         * Load resorts and filter them in Java.
         */
        List<Resort> resorts =
                resortRepository.findAll();

        return resorts.stream()

                // Only approved resorts
                .filter(resort ->
                        resort.getStatus() ==
                                Resort.ResortStatus.APPROVED
                )

                // Location filter
                .filter(resort -> {

                    if (location == null
                            || location.isBlank()) {
                        return true;
                    }

                    return resort.getLocation() != null
                            && resort.getLocation()
                            .toLowerCase()
                            .contains(
                                    location
                                            .trim()
                                            .toLowerCase()
                            );
                })

                // Minimum price
                .filter(resort -> {

                    if (minPrice == null) {
                        return true;
                    }

                    return resort.getPricePerNight() != null
                            && resort.getPricePerNight()
                            .compareTo(minPrice) >= 0;
                })

                // Maximum price
                .filter(resort -> {

                    if (maxPrice == null) {
                        return true;
                    }

                    return resort.getPricePerNight() != null
                            && resort.getPricePerNight()
                            .compareTo(maxPrice) <= 0;
                })

                // Minimum rating
                .filter(resort -> {

                    if (minRating == null) {
                        return true;
                    }

                    return resort.getRating() != null
                            && resort.getRating() >= minRating;
                })

                .toList();
    }

    // ============================================================
    // GET RESORTS BY OWNER EMAIL
    // ============================================================

    public List<Resort> getResortsByOwnerEmail(
            String email
    ) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElse(null);

        if (user == null) {
            return List.of();
        }

        return resortRepository.findByOwnerId(
                user.getId()
        );
    }

    // ============================================================
    // DELETE RESORT
    // ============================================================

    public void deleteResort(String resortId) {

        // Make sure resort exists first
        getResortById(resortId);

        resortRepository.deleteById(resortId);
    }
}