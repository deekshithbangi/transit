package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.ServiceCalendarResponse;
import com.deekshith.tgrtc.entity.ServiceCalendar;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.mapper.ServiceCalendarMapper;
import com.deekshith.tgrtc.repository.RouteRepository;
import com.deekshith.tgrtc.repository.ServiceCalendarRepository;
import com.deekshith.tgrtc.repository.TripRepository;
import com.deekshith.tgrtc.service.ServiceCalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceCalendarServiceImpl implements ServiceCalendarService {

    private final ServiceCalendarRepository serviceCalendarRepository;
    private final TripRepository tripRepository;
    private final RouteRepository routeRepository;

    @Override
    public List<ServiceCalendarResponse> getAllServiceCalendars() {
        return serviceCalendarRepository.findAll()
                .stream()
                .map(ServiceCalendarMapper::toResponse)
                .toList();
    }

    @Override
    public ServiceCalendarResponse getServiceCalendarById(String serviceId) {

        ServiceCalendar calendar = serviceCalendarRepository.findById(serviceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Service calendar not found with id: " + serviceId));

        return ServiceCalendarMapper.toResponse(calendar);
    }

    @Override
    public List<ServiceCalendarResponse> getServicesByRouteId(String routeId) {

        if (!routeRepository.existsById(routeId)) {
            throw new ResourceNotFoundException(
                    "Route not found with ID " + routeId);
        }

        return tripRepository.findServiceCalendarsByRouteId(routeId)
                .stream()
                .map(ServiceCalendarMapper::toResponse)
                .toList();
    }


}