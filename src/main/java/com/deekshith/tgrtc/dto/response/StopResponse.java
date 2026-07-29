package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

@Builder
public record StopResponse(
        String stopId,
        String stopName,
        String zoneId,
        Double stopLat,
        Double stopLon,
        String stopDesc
) {
}