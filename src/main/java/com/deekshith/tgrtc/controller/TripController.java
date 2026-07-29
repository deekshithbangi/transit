package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.TripResponse;
import com.deekshith.tgrtc.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping
    public ApiResponse<List<TripResponse>> getAllTrips() {
        return ApiResponse.<List<TripResponse>>builder()
                .success(true)
                .message("Trips fetched successfully")
                .data(tripService.getAllTrips())
                .build();
    }

    @GetMapping("/{tripId}")
    public ApiResponse<TripResponse> getTripById(@PathVariable Long tripId) {
        return ApiResponse.<TripResponse>builder()
                .success(true)
                .message("Trip fetched successfully")
                .data(tripService.getTripById(tripId))
                .build();
    }
}