package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

@Builder
public record TripResponse(
        Long tripId,
        String routeId,
        String serviceId,
        Short directionId,
        String tripShortName
) {
}