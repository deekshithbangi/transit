package com.deekshith.tgrtc.service;

import com.deekshith.tgrtc.dto.response.ServiceCalendarResponse;

import java.util.List;

public interface ServiceCalendarService {

    List<ServiceCalendarResponse> getAllServiceCalendars();

    ServiceCalendarResponse getServiceCalendarById(String serviceId);

    List<ServiceCalendarResponse> getServicesByRouteId(String routeId);
}