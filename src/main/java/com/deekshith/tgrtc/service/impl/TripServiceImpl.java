package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.TripResponse;
import com.deekshith.tgrtc.entity.Trip;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.mapper.TripMapper;
import com.deekshith.tgrtc.repository.TripRepository;
import com.deekshith.tgrtc.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;

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
}