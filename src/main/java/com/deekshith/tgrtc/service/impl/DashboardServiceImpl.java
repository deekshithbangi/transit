package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.DashboardResponse;
import com.deekshith.tgrtc.repository.*;
import com.deekshith.tgrtc.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final AgencyRepository agencyRepository;
    private final RouteRepository routeRepository;
    private final StopRepository stopRepository;
    private final TripRepository tripRepository;
    private final ServiceCalendarRepository serviceCalendarRepository;
    private final StopTimeRepository stopTimeRepository;

    @Override
    public DashboardResponse getDashboardStatistics() {

        return DashboardResponse.builder()
                .agencies(agencyRepository.count())
                .routes(routeRepository.count())
                .stops(stopRepository.count())
                .trips(tripRepository.count())
                .serviceCalendars(serviceCalendarRepository.count())
                .stopTimes(stopTimeRepository.count())
                .build();
    }
}