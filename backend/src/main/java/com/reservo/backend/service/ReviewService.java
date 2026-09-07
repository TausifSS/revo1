package com.reservo.backend.service;

import com.reservo.backend.entity.Review;
import com.reservo.backend.entity.Resort;
import com.reservo.backend.entity.User;
import com.reservo.backend.exception.ResourceNotFoundException;
import com.reservo.backend.repository.ReviewRepository;
import com.reservo.backend.repository.ResortRepository;
import com.reservo.backend.repository.UserRepository;
import com.reservo.backend.util.HtmlSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ResortRepository resortRepository;
    private final UserRepository userRepository;

    public List<Review> getReviewsByResort(String resortId) {
        return reviewRepository.findByResortId(resortId);
    }

    public Review createReview(String email, String resortId, Double rating, String comment) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Resort resort = resortRepository.findById(resortId)
                .orElseThrow(() -> new ResourceNotFoundException("Resort not found"));

        Review review = Review.builder()
                .userId(user.getId())
                .resortId(resort.getId())
                .rating(rating)
                .comment(HtmlSanitizer.sanitize(comment))
                .build();

        Review saved = reviewRepository.save(review);
        List<Review> reviews = reviewRepository.findByResortId(resortId);
        double avgRating = reviews.stream().mapToDouble(Review::getRating).average().orElse(rating);
        resort.setRating(avgRating);
        resort.setReviewCount(reviews.size());
        resortRepository.save(resort);
        return saved;
    }
}
