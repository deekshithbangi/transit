package com.deekshith.tgrtc.mapper;

import com.deekshith.tgrtc.dto.response.TripResponse;
import com.deekshith.tgrtc.entity.Trip;

public final class TripMapper {

    private TripMapper() {
    }

    public static TripResponse toResponse(Trip trip) {
        return TripResponse.builder()
                .tripId(trip.getTripId())
                .routeId(trip.getRoute().getRouteId())
                .serviceId(trip.getServiceCalendar().getServiceId())
                .directionId(trip.getDirectionId())
                .tripShortName(trip.getTripShortName())
                .build();
    }
}