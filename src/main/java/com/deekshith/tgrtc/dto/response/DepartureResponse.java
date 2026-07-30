package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

@Builder
public record DepartureResponse(

        Long tripId,

        String routeId,

        String routeShortName,

        String departureTime

) {
}