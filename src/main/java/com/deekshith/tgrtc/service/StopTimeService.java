package com.deekshith.tgrtc.service;

import com.deekshith.tgrtc.dto.response.StopTimeResponse;

import java.util.List;

public interface StopTimeService {

    List<StopTimeResponse> getAllStopTimes();

    StopTimeResponse getStopTime(Long tripId, Integer stopSequence);

    List<StopTimeResponse> getStopTimesByTripId(Long tripId);

    List<StopTimeResponse> getTripTimesByStopId(String stopId);
}