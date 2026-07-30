package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

import java.time.LocalTime;

@Builder
public record TripScheduleResponse(

        Integer stopSequence,

        String stopId,

        String stopName,

        String arrivalTime,

        String departureTime

) {
}