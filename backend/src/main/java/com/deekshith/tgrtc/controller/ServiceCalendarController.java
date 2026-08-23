package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.ServiceCalendarResponse;
import com.deekshith.tgrtc.service.ServiceCalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-calendars")
@RequiredArgsConstructor
public class ServiceCalendarController {

    private final ServiceCalendarService serviceCalendarService;

    @GetMapping
    public ApiResponse<List<ServiceCalendarResponse>> getAllServiceCalendars() {
        return ApiResponse.<List<ServiceCalendarResponse>>builder()
                .success(true)
                .message("Service calendars fetched successfully")
                .data(serviceCalendarService.getAllServiceCalendars())
                .build();
    }

    @GetMapping("/{serviceId}")
    public ApiResponse<ServiceCalendarResponse> getServiceCalendarById(
            @PathVariable String serviceId) {

        return ApiResponse.<ServiceCalendarResponse>builder()
                .success(true)
                .message("Service calendar fetched successfully")
                .data(serviceCalendarService.getServiceCalendarById(serviceId))
                .build();
    }

    @GetMapping("/route")
    public ApiResponse<List<ServiceCalendarResponse>> getServicesByRouteId(
            @RequestParam String routeId) {

        return ApiResponse.<List<ServiceCalendarResponse>>builder()
                .success(true)
                .message("Services fetched successfully")
                .data(serviceCalendarService.getServicesByRouteId(routeId))
                .build();
    }
}