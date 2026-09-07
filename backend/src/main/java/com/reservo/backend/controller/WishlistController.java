package com.reservo.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.Wishlist;
import com.reservo.backend.service.WishlistService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    /**
     * Get current user's wishlist.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Wishlist>>> getWishlist() {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        return ResponseEntity.ok(
                ApiResponse.success(
                        wishlistService.getWishlistByUser(
                                auth.getName()
                        )
                )
        );
    }

    /**
     * Add/remove resort from wishlist.
     */
    @PostMapping("/toggle/{resortId}")
    public ResponseEntity<ApiResponse<String>> toggleWishlist(
            @PathVariable String resortId
    ) {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String result =
                wishlistService.toggleWishlist(
                        auth.getName(),
                        resortId
                );

        return ResponseEntity.ok(
                ApiResponse.success(result)
        );
    }

    /**
     * Clear current user's wishlist.
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> clearWishlist() {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        wishlistService.clearWishlist(
                auth.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Wishlist cleared successfully"
                )
        );
    }
}