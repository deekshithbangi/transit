package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.DashboardResponse;
import com.deekshith.tgrtc.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ApiResponse<DashboardResponse> getDashboardStatistics() {

        return ApiResponse.<DashboardResponse>builder()
                .success(true)
                .message("Dashboard statistics fetched successfully")
                .data(dashboardService.getDashboardStatistics())
                .build();
    }
}