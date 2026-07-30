package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record RouteDetailsResponse(

        String routeId,

        String routeShortName,

        Integer routeType,

        AgencyResponse agency,

        Long tripsCount,

        Long stopsCount,

        List<ServiceCalendarResponse> serviceCalendars

) {
}