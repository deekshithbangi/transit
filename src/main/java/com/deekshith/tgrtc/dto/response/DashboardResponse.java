package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

@Builder
public record DashboardResponse(

        Long agencies,

        Long routes,

        Long stops,

        Long trips,

        Long serviceCalendars,

        Long stopTimes

) {
}