package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

@Builder
public record AgencyResponse(
        String agencyId,
        String agencyName,
        String agencyUrl,
        String agencyTimezone,
        String agencyLang
) {
}