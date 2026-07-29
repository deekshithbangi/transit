package com.deekshith.tgrtc.service;

import com.deekshith.tgrtc.dto.response.AgencyResponse;

import java.util.List;

public interface AgencyService {

    List<AgencyResponse> getAllAgencies();

    AgencyResponse getAgencyById(String agencyId);

}