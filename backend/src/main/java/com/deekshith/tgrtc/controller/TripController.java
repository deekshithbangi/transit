package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.TripResponse;
import com.deekshith.tgrtc.dto.response.TripScheduleResponse;
import com.deekshith.tgrtc.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.deekshith.tgrtc.service.StopTimeService;
import com.deekshith.tgrtc.dto.response.StopTimeResponse;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;
    private final StopTimeService stopTimeService;

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

    @GetMapping("/{tripId}/stops")
    public ApiResponse<List<StopTimeResponse>> getTripStopTimes(
            @PathVariable Long tripId) {

        return ApiResponse.<List<StopTimeResponse>>builder()
                .success(true)
                .message("Trip stop times fetched successfully")
                .data(stopTimeService.getStopTimesByTripId(tripId))
                .build();
    }

    @GetMapping("/{tripId}/schedule")
    public ApiResponse<List<TripScheduleResponse>> getTripSchedule(
            @PathVariable Long tripId) {

        return ApiResponse.<List<TripScheduleResponse>>builder()
                .success(true)
                .message("Trip schedule fetched successfully")
                .data(tripService.getTripSchedule(tripId))
                .build();
    }

}