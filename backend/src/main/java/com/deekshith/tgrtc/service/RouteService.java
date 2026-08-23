package com.deekshith.tgrtc.service;

import com.deekshith.tgrtc.dto.response.RouteDetailsResponse;
import com.deekshith.tgrtc.dto.response.RouteResponse;

import java.util.List;

public interface RouteService {

    List<RouteResponse> getAllRoutes();

    RouteResponse getRouteById(String routeId);

    List<RouteResponse> getRoutesByStopId(String stopId);

    RouteDetailsResponse getRouteDetails(String routeId);
}