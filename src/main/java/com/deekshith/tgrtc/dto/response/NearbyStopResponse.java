package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

@Builder
public record NearbyStopResponse(

        String stopId,

        String stopName,

        Double stopLat,

        Double stopLon,

        Double distance


) {
}