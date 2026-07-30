package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.PageResponse;
import com.deekshith.tgrtc.dto.response.StopResponse;
import com.deekshith.tgrtc.entity.Stop;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.mapper.StopMapper;
import com.deekshith.tgrtc.repository.RouteRepository;
import com.deekshith.tgrtc.repository.StopRepository;
import com.deekshith.tgrtc.repository.StopTimeRepository;
import com.deekshith.tgrtc.service.StopService;
import com.deekshith.tgrtc.util.PageResponseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StopServiceImpl implements StopService {

    private final StopRepository stopRepository;
    private final StopTimeRepository stopTimeRepository;
    private final RouteRepository routeRepository;

    @Override
    public PageResponse<StopResponse> getAllStops(Pageable pageable) {

        Page<Stop> stopPage = stopRepository.findAll(pageable);

        return PageResponseMapper.toPageResponse(
                stopPage,
                StopMapper::toResponse
        );
    }

    @Override
    public StopResponse getStopById(String stopId) {

        Stop stop = stopRepository.findById(stopId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Stop not found with id: " + stopId));

        return StopMapper.toResponse(stop);
    }

    @Override
    public PageResponse<StopResponse> searchStops(
            String stopName,
            Pageable pageable) {

        Page<Stop> stopPage =
                stopRepository.findByStopNameContainingIgnoreCase(
                        stopName,
                        pageable
                );

        return PageResponseMapper.toPageResponse(
                stopPage,
                StopMapper::toResponse
        );
    }

    @Override
    public List<StopResponse> getStopsByRouteId(String routeId) {

        List<Stop> stops = stopTimeRepository.findStopsByRouteId(routeId);

        if (stops.isEmpty()) {

            if (!routeRepository.existsById(routeId)) {
                throw new ResourceNotFoundException(
                        "Route not found with ID " + routeId);
            }
        }

        return stops.stream()
                .map(StopMapper::toResponse)
                .toList();
    }
}