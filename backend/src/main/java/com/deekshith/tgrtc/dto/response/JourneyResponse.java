package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

@Builder
public record JourneyResponse(
        Long tripId, String routeId, String routeShortName,
        String fromStopId, String fromStopName,
        String toStopId, String toStopName,
        String departureTime, String arrivalTime,
        Long minutesUntilDeparture) {
}
