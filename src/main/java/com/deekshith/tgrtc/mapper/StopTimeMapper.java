package com.deekshith.tgrtc.mapper;

import com.deekshith.tgrtc.dto.response.StopTimeResponse;
import com.deekshith.tgrtc.entity.StopTime;
import org.springframework.stereotype.Component;

@Component
public class StopTimeMapper {

    public StopTimeResponse toResponse(StopTime stopTime) {

        return StopTimeResponse.builder()
                .tripId(stopTime.getTrip().getTripId())
                .stopSequence(stopTime.getId().getStopSequence())
                .stopId(stopTime.getStop().getStopId())
                .arrivalTime(stopTime.getArrivalTime())
                .departureTime(stopTime.getDepartureTime())
                .timePoint(stopTime.getTimePoint())
                .build();
    }
}