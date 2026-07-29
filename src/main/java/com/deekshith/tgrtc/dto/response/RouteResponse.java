package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

@Builder
public record RouteResponse(
        String routeId,
        String routeShortName,
        Short routeType,
        String agencyId
) {
}