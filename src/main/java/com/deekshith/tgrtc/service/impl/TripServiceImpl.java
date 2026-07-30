package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.TripResponse;
import com.deekshith.tgrtc.dto.response.TripScheduleResponse;
import com.deekshith.tgrtc.entity.Trip;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.mapper.TripMapper;
import com.deekshith.tgrtc.mapper.TripScheduleMapper;
import com.deekshith.tgrtc.repository.RouteRepository;
import com.deekshith.tgrtc.repository.StopTimeRepository;
import com.deekshith.tgrtc.repository.TripRepository;
import com.deekshith.tgrtc.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;
    private final RouteRepository routeRepository;
    private final StopTimeRepository stopTimeRepository;
//    private final TripMapper tripMapper;

    @Override
    public List<TripResponse> getAllTrips() {
        return tripRepository.findAll()
                .stream()
                .map(TripMapper::toResponse)
                .toList();
    }

    @Override
    public TripResponse getTripById(Long tripId) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Trip not found with id: " + tripId));

        return TripMapper.toResponse(trip);
    }

    @Override
    public List<TripResponse> getTripsByRouteId(String routeId) {

        if (!routeRepository.existsById(routeId)) {
            throw new ResourceNotFoundException(
                    "Route not found with ID " + routeId);
        }

        return tripRepository.findTripsByRouteId(routeId)
                .stream()
                .map(TripMapper::toResponse)
                .toList();
    }

    @Override
    public List<TripScheduleResponse> getTripSchedule(Long tripId) {

        if (!tripRepository.existsById(tripId)) {
            throw new ResourceNotFoundException(
                    "Trip not found with ID " + tripId);
        }

        return stopTimeRepository
                .findByTripTripIdOrderByIdStopSequence(tripId)
                .stream()
                .map(TripScheduleMapper::toResponse)
                .toList();
    }
}