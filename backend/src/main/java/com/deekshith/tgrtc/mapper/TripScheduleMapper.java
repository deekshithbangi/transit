package com.deekshith.tgrtc.mapper;

import com.deekshith.tgrtc.dto.response.TripScheduleResponse;
import com.deekshith.tgrtc.entity.StopTime;

import java.time.LocalTime;

public final class TripScheduleMapper {

    private TripScheduleMapper() {}

    public static TripScheduleResponse toResponse(StopTime stopTime) {
        return TripScheduleResponse.builder()
                .stopSequence(stopTime.getId().getStopSequence())
                .stopId(stopTime.getStop().getStopId())
                .stopName(stopTime.getStop().getStopName())
                .arrivalTime(stopTime.getArrivalTime())
                .departureTime(stopTime.getDepartureTime())
                .build();
    }
}