package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.*;
import com.deekshith.tgrtc.service.StopService;
import com.deekshith.tgrtc.service.StopTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stops")
@RequiredArgsConstructor
public class StopController {

    private final StopService stopService;
    private final StopTimeService stopTimeService;

    @GetMapping
    public ApiResponse<PageResponse<StopResponse>> getAllStops(
            Pageable pageable) {

        return ApiResponse.<PageResponse<StopResponse>>builder()
                .success(true)
                .message("Stops fetched successfully")
                .data(stopService.getAllStops(pageable))
                .build();
    }

    @GetMapping("/{stopId}")
    public ApiResponse<StopResponse> getStopById(
            @PathVariable String stopId) {

        return ApiResponse.<StopResponse>builder()
                .success(true)
                .message("Stop fetched successfully")
                .data(stopService.getStopById(stopId))
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<PageResponse<StopResponse>> searchStops(

            @RequestParam String name,
            Pageable pageable

    ) {

        return ApiResponse.<PageResponse<StopResponse>>builder()
                .success(true)
                .message("Stops fetched successfully")
                .data(stopService.searchStops(name, pageable))
                .build();
    }

    @GetMapping("/route")
    public ApiResponse<List<StopResponse>> getStopsByRouteId(
            @RequestParam String routeId) {

        return ApiResponse.<List<StopResponse>>builder()
                .success(true)
                .message("Stops fetched successfully")
                .data(stopService.getStopsByRouteId(routeId))
                .build();
    }

    @GetMapping("/nearby")
    public ApiResponse<List<NearbyStopResponse>> getNearbyStops(

            @RequestParam Double lat,

            @RequestParam Double lon,

            @RequestParam Double radius

    ) {

        return ApiResponse.<List<NearbyStopResponse>>builder()
                .success(true)
                .message("Nearby stops fetched successfully")
                .data(stopService.getNearbyStops(lat, lon, radius))
                .build();
    }

    @GetMapping("/{stopId}/departures")
    public ApiResponse<List<DepartureResponse>> getDeparturesByStopId(
            @PathVariable String stopId) {

        return ApiResponse.<List<DepartureResponse>>builder()
                .success(true)
                .message("Next departures fetched successfully")
                .data(stopTimeService.getDeparturesByStopId(stopId))
                .build();
    }
}