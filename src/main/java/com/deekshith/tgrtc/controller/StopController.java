package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.StopResponse;
import com.deekshith.tgrtc.service.StopService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stops")
@RequiredArgsConstructor
public class StopController {

    private final StopService stopService;

    @GetMapping
    public ApiResponse<List<StopResponse>> getAllStops() {
        return ApiResponse.<List<StopResponse>>builder()
                .success(true)
                .message("Stops fetched successfully")
                .data(stopService.getAllStops())
                .build();
    }

    @GetMapping("/{stopId}")
    public ApiResponse<StopResponse> getStopById(@PathVariable String stopId) {
        return ApiResponse.<StopResponse>builder()
                .success(true)
                .message("Stop fetched successfully")
                .data(stopService.getStopById(stopId))
                .build();
    }
}