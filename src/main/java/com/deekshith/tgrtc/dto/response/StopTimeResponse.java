package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

@Builder
public record StopTimeResponse(

        Long tripId,
        Integer stopSequence,
        String stopId,
        String arrivalTime,
        String departureTime,
        Short timePoint

) {
}