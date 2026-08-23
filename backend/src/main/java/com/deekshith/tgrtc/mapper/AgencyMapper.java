package com.deekshith.tgrtc.mapper;

import com.deekshith.tgrtc.dto.response.AgencyResponse;
import com.deekshith.tgrtc.entity.Agency;

public class AgencyMapper {

    private AgencyMapper() {
    }

    public static AgencyResponse toResponse(Agency agency) {
        return AgencyResponse.builder()
                .agencyId(agency.getAgencyId())
                .agencyName(agency.getAgencyName())
                .agencyUrl(agency.getAgencyUrl())
                .agencyTimezone(agency.getAgencyTimezone())
                .agencyLang(agency.getAgencyLang())
                .build();
    }
}