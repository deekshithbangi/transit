package com.deekshith.tgrtc.service;

import com.deekshith.tgrtc.dto.response.PageResponse;
import com.deekshith.tgrtc.dto.response.StopResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StopService {

    PageResponse<StopResponse> getAllStops(Pageable pageable);

    StopResponse getStopById(String stopId);

    PageResponse<StopResponse> searchStops(
            String stopName,
            Pageable pageable
    );

    List<StopResponse> getStopsByRouteId(String routeId);
}