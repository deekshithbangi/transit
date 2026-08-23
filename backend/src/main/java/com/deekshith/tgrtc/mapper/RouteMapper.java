package com.deekshith.tgrtc.mapper;

import com.deekshith.tgrtc.dto.response.RouteResponse;
import com.deekshith.tgrtc.entity.Route;

public final class RouteMapper {

    private RouteMapper() {
    }

    public static RouteResponse toResponse(Route route) {
        return RouteResponse.builder()
                .routeId(route.getRouteId())
                .routeShortName(route.getRouteShortName())
                .routeType(route.getRouteType())
                .agencyId(route.getAgency().getAgencyId())
                .build();
    }
}