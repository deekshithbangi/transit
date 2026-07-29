package com.deekshith.tgrtc.mapper;

import com.deekshith.tgrtc.dto.response.StopResponse;
import com.deekshith.tgrtc.entity.Stop;

public final class StopMapper {

    private StopMapper() {
    }

    public static StopResponse toResponse(Stop stop) {
        return StopResponse.builder()
                .stopId(stop.getStopId())
                .stopName(stop.getStopName())
                .zoneId(stop.getZoneId())
                .stopLat(stop.getStopLat())
                .stopLon(stop.getStopLon())
                .stopDesc(stop.getStopDesc())
                .build();
    }
}