package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.RouteResponse;
import com.deekshith.tgrtc.service.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    @GetMapping
    public ApiResponse<List<RouteResponse>> getAllRoutes() {

        return ApiResponse.<List<RouteResponse>>builder()
                .success(true)
                .message("Routes fetched successfully")
                .data(routeService.getAllRoutes())
                .build();
    }

    @GetMapping("/{routeId}")
    public ApiResponse<RouteResponse> getRouteById(
            @PathVariable String routeId) {

        return ApiResponse.<RouteResponse>builder()
                .success(true)
                .message("Route fetched successfully")
                .data(routeService.getRouteById(routeId))
                .build();
    }
}