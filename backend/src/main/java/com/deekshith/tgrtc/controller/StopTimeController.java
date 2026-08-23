package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.StopTimeResponse;
import com.deekshith.tgrtc.service.StopTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stop-times")
@RequiredArgsConstructor
public class StopTimeController {

    private final StopTimeService stopTimeService;

    @GetMapping
    public ApiResponse<List<StopTimeResponse>> getAllStopTimes() {

        return ApiResponse.<List<StopTimeResponse>>builder()
                .success(true)
                .message("Stop times fetched successfully")
                .data(stopTimeService.getAllStopTimes())
                .build();
    }

    @GetMapping("/{tripId}/{stopSequence}")
    public ApiResponse<StopTimeResponse> getStopTime(
            @PathVariable Long tripId,
            @PathVariable Integer stopSequence) {

        return ApiResponse.<StopTimeResponse>builder()
                .success(true)
                .message("Stop time fetched successfully")
                .data(stopTimeService.getStopTime(tripId, stopSequence))
                .build();
    }
}