package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.RouteResponse;
import com.deekshith.tgrtc.entity.Route;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.mapper.RouteMapper;
import com.deekshith.tgrtc.repository.RouteRepository;
import com.deekshith.tgrtc.service.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {

    private final RouteRepository routeRepository;

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
}