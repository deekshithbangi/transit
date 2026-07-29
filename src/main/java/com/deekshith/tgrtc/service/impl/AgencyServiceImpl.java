package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.AgencyResponse;
import com.deekshith.tgrtc.entity.Agency;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.mapper.AgencyMapper;
import com.deekshith.tgrtc.repository.AgencyRepository;
import com.deekshith.tgrtc.service.AgencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AgencyServiceImpl implements AgencyService {

    private final AgencyRepository agencyRepository;

    @Override
    public List<AgencyResponse> getAllAgencies() {
        return agencyRepository.findAll()
                .stream()
                .map(AgencyMapper::toResponse)
                .toList();
    }

    @Override
    public AgencyResponse getAgencyById(String agencyId) {

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Agency with id '" + agencyId + "' not found."));

        return AgencyMapper.toResponse(agency);
    }
}