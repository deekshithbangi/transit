package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.AgencyResponse;
import com.deekshith.tgrtc.service.AgencyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;

@Tag(
        name = "Agency",
        description = "Operations related to GTFS agencies"
)
@RestController
@RequestMapping("/api/agencies")
@RequiredArgsConstructor
public class AgencyController {

    private final AgencyService agencyService;

    @Operation(
            summary = "Get all agencies",
            description = "Returns all GTFS agencies available in the system."
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<AgencyResponse>> getAllAgencies() {

        return ApiResponse.<List<AgencyResponse>>builder()
                .success(true)
                .message("Agencies fetched successfully")
                .data(agencyService.getAllAgencies())
                .build();
    }

    @Operation(
            summary = "Get agency by ID",
            description = "Returns a single GTFS agency by its unique identifier."
    )
    @GetMapping("/{agencyId}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<AgencyResponse> getAgencyById(
            @PathVariable String agencyId) {

        return ApiResponse.<AgencyResponse>builder()
                .success(true)
                .message("Agency fetched successfully")
                .data(agencyService.getAgencyById(agencyId))
                .build();
    }
}