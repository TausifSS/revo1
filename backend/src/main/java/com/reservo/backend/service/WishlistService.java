package com.reservo.backend.service;

import com.reservo.backend.entity.Resort;
import com.reservo.backend.entity.User;
import com.reservo.backend.entity.Wishlist;
import com.reservo.backend.exception.ResourceNotFoundException;
import com.reservo.backend.repository.ResortRepository;
import com.reservo.backend.repository.UserRepository;
import com.reservo.backend.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WishlistService {
    private final WishlistRepository wishlistRepository;
    private final ResortRepository resortRepository;
    private final UserRepository userRepository;

    public List<Wishlist> getWishlistByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return wishlistRepository.findByUserId(user.getId());
    }

    public String toggleWishlist(String email, String resortId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Resort resort = resortRepository.findById(resortId)
                .orElseThrow(() -> new ResourceNotFoundException("Resort not found"));

        Optional<Wishlist> existing =
                wishlistRepository.findByUserIdAndResortId(user.getId(), resort.getId());

        if (existing.isPresent()) {
            wishlistRepository.deleteById(existing.get().getId());
            return "Resort removed from wishlist";
        }

        wishlistRepository.save(Wishlist.builder()
                .userId(user.getId())
                .resortId(resort.getId())
                .build());

        return "Resort added to wishlist";
    }

    public void clearWishlist(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        wishlistRepository.findByUserId(user.getId())
                .forEach(item -> wishlistRepository.deleteById(item.getId()));
    }
}
