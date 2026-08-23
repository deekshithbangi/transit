package com.deekshith.tgrtc.service;

import com.deekshith.tgrtc.dto.response.TripResponse;
import com.deekshith.tgrtc.dto.response.TripScheduleResponse;

import java.util.List;

public interface TripService {

    List<TripResponse> getTripsByRouteId(String routeId);

    List<TripResponse> getAllTrips();

    TripResponse getTripById(Long tripId);

    List<TripScheduleResponse> getTripSchedule(Long tripId);
}