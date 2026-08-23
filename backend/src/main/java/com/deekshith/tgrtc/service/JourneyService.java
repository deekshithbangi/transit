package com.deekshith.tgrtc.service;

import com.deekshith.tgrtc.dto.response.JourneyResponse;
import java.util.List;

public interface JourneyService {
    List<JourneyResponse> searchUpcomingJourneys(String fromStopId, String toStopId, int limit);
}
