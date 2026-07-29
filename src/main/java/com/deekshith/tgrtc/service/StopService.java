package com.deekshith.tgrtc.service;

import com.deekshith.tgrtc.dto.response.StopResponse;

import java.util.List;

public interface StopService {

    List<StopResponse> getAllStops();

    StopResponse getStopById(String stopId);
}