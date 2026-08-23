package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.JourneyResponse;
import com.deekshith.tgrtc.service.JourneyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/journeys")
@RequiredArgsConstructor
public class JourneyController {
    private final JourneyService journeyService;

    @GetMapping("/search")
    public ApiResponse<List<JourneyResponse>> searchUpcomingJourneys(
            @RequestParam String fromStopId,
            @RequestParam String toStopId,
            @RequestParam(defaultValue = "10") int limit) {
        List<JourneyResponse> journeys = journeyService.searchUpcomingJourneys(fromStopId, toStopId, limit);
        return ApiResponse.<List<JourneyResponse>>builder()
                .success(true)
                .message(journeys.isEmpty() ? "No upcoming journeys found" : "Upcoming journeys fetched successfully")
                .data(journeys)
                .build();
    }
}
