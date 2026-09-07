package com.reservo.backend.controller;

import com.reservo.backend.dto.ApiResponse;
import com.reservo.backend.entity.Offer;
import com.reservo.backend.repository.OfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferRepository offerRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Offer>>> getAllOffers() {
        return ResponseEntity.ok(ApiResponse.success(offerRepository.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Offer>> createOffer(@RequestBody Offer offer) {
        Offer saved = offerRepository.save(offer);
        return ResponseEntity.ok(ApiResponse.success(saved, "Promo offer created successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteOffer(@PathVariable String id) {
        offerRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Offer deleted successfully"));
    }
}
