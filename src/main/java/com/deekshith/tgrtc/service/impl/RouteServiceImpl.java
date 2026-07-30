package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.RouteDetailsResponse;
import com.deekshith.tgrtc.dto.response.RouteResponse;
import com.deekshith.tgrtc.entity.Route;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.mapper.AgencyMapper;
import com.deekshith.tgrtc.mapper.RouteMapper;
import com.deekshith.tgrtc.mapper.ServiceCalendarMapper;
import com.deekshith.tgrtc.repository.RouteRepository;
import com.deekshith.tgrtc.repository.StopRepository;
import com.deekshith.tgrtc.repository.StopTimeRepository;
import com.deekshith.tgrtc.repository.TripRepository;
import com.deekshith.tgrtc.service.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {

    private final RouteRepository routeRepository;
    private final TripRepository tripRepository;
    private final StopRepository stopRepository;

    @Override
    public List<RouteResponse> getAllRoutes() {
        return routeRepository.findAll()
                .stream()
                .map(RouteMapper::toResponse)
                .toList();
    }

    @Override
    public RouteResponse getRouteById(String routeId) {

        Route route = routeRepository.findById(routeId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Route not found with id: " + routeId));

        return RouteMapper.toResponse(route);
    }

    @Override
    public List<RouteResponse> getRoutesByStopId(String stopId) {

        if (!stopRepository.existsById(stopId)) {
            throw new ResourceNotFoundException(
                    "Stop not found with ID " + stopId);
        }

        return tripRepository.findRoutesByStopId(stopId)
                .stream()
                .map(RouteMapper::toResponse)
                .toList();
    }

    private final StopTimeRepository stopTimeRepository;

    @Override
    public RouteDetailsResponse getRouteDetails(String routeId) {

        Route route = routeRepository.findById(routeId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Route not found with ID " + routeId));

        return RouteDetailsResponse.builder()
                .routeId(route.getRouteId())
                .routeShortName(route.getRouteShortName())
                .agency(AgencyMapper.toResponse(route.getAgency()))
                .tripsCount(tripRepository.countTripsByRouteId(routeId))
                .stopsCount(stopTimeRepository.countStopsByRouteId(routeId))
                .serviceCalendars(
                        tripRepository.findServiceCalendarsByRouteId(routeId)
                                .stream()
                                .map(ServiceCalendarMapper::toResponse)
                                .toList()
                )
                .build();
    }
}