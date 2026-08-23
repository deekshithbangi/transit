package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.RouteDetailsResponse;
import com.deekshith.tgrtc.dto.response.RouteResponse;
import com.deekshith.tgrtc.dto.response.TripResponse;
import com.deekshith.tgrtc.service.RouteService;
import com.deekshith.tgrtc.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;
    private final TripService tripService;

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
            @RequestParam String routeId) {

        return ApiResponse.<RouteResponse>builder()
                .success(true)
                .message("Route fetched successfully")
                .data(routeService.getRouteById(routeId))
                .build();
    }


    @GetMapping("/trips")
    public ApiResponse<List<TripResponse>> getTripsByRouteId(
            @RequestParam String routeId) {

        return ApiResponse.<List<TripResponse>>builder()
                .success(true)
                .message("Trips fetched successfully")
                .data(tripService.getTripsByRouteId(routeId))
                .build();
    }

    @GetMapping("/stop/{stopId}")
    public ApiResponse<List<RouteResponse>> getRoutesByStopId(
            @PathVariable String stopId) {

        return ApiResponse.<List<RouteResponse>>builder()
                .success(true)
                .message("Routes fetched successfully")
                .data(routeService.getRoutesByStopId(stopId))
                .build();
    }

    @GetMapping("/details")
    public ApiResponse<RouteDetailsResponse> getRouteDetails(
            @RequestParam String routeId) {

        return ApiResponse.<RouteDetailsResponse>builder()
                .success(true)
                .message("Route details fetched successfully")
                .data(routeService.getRouteDetails(routeId))
                .build();
    }
}