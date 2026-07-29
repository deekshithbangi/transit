package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.StopResponse;
import com.deekshith.tgrtc.entity.Stop;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.mapper.StopMapper;
import com.deekshith.tgrtc.repository.StopRepository;
import com.deekshith.tgrtc.service.StopService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StopServiceImpl implements StopService {

    private final StopRepository stopRepository;

    @Override
    public List<StopResponse> getAllStops() {
        return stopRepository.findAll()
                .stream()
                .map(StopMapper::toResponse)
                .toList();
    }

    @Override
    public StopResponse getStopById(String stopId) {

        Stop stop = stopRepository.findById(stopId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Stop not found with id: " + stopId));

        return StopMapper.toResponse(stop);
    }
}