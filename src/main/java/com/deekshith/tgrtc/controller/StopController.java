package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.PageResponse;
import com.deekshith.tgrtc.dto.response.StopResponse;
import com.deekshith.tgrtc.service.StopService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stops")
@RequiredArgsConstructor
public class StopController {

    private final StopService stopService;

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
}