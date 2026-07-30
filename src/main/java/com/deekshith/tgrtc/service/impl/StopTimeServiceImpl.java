package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.DepartureResponse;
import com.deekshith.tgrtc.dto.response.StopTimeResponse;
import com.deekshith.tgrtc.entity.StopTime;
import com.deekshith.tgrtc.entity.StopTimeId;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.mapper.StopTimeMapper;
import com.deekshith.tgrtc.repository.StopTimeRepository;
import com.deekshith.tgrtc.repository.TripRepository;
import com.deekshith.tgrtc.service.StopTimeService;
import com.deekshith.tgrtc.repository.StopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StopTimeServiceImpl implements StopTimeService {

    private final StopTimeRepository stopTimeRepository;
    private final StopTimeMapper stopTimeMapper;
    private final TripRepository tripRepository;
    private final StopRepository stopRepository;

    @Override
    public List<StopTimeResponse> getAllStopTimes() {
        return stopTimeRepository.findAll()
                .stream()
                .map(stopTimeMapper::toResponse)
                .toList();
    }

    @Override
    public StopTimeResponse getStopTime(Long tripId, Integer stopSequence) {

        StopTimeId id = new StopTimeId(tripId, stopSequence);

        StopTime stopTime = stopTimeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "StopTime not found with Trip ID "
                                        + tripId
                                        + " and Stop Sequence "
                                        + stopSequence));

        return stopTimeMapper.toResponse(stopTime);
    }

    @Override
    public List<StopTimeResponse> getStopTimesByTripId(Long tripId) {

        if (!tripRepository.existsById(tripId)) {
            throw new ResourceNotFoundException(
                    "Trip not found with ID " + tripId);
        }

        return stopTimeRepository
                .findByTripTripIdOrderByIdStopSequence(tripId)
                .stream()
                .map(stopTimeMapper::toResponse)
                .toList();
    }

    @Override
    public List<StopTimeResponse> getTripTimesByStopId(String stopId) {

        if (!stopRepository.existsById(stopId)) {
            throw new ResourceNotFoundException(
                    "Stop not found with ID " + stopId);
        }

        return stopTimeRepository
                .findByStopStopIdOrderByArrivalTime(stopId)
                .stream()
                .map(stopTimeMapper::toResponse)
                .toList();
    }

    @Override
    public List<DepartureResponse> getDeparturesByStopId(String stopId) {

        if (!stopRepository.existsById(stopId)) {
            throw new ResourceNotFoundException(
                    "Stop not found with ID " + stopId);
        }

        return stopTimeRepository.findDeparturesByStopId(stopId);
    }
}