package com.deekshith.tgrtc.service;

import com.deekshith.tgrtc.dto.response.RouteResponse;

import java.util.List;

public interface RouteService {

    List<RouteResponse> getAllRoutes();

    RouteResponse getRouteById(String routeId);

    List<RouteResponse> getRoutesByStopId(String stopId);
}