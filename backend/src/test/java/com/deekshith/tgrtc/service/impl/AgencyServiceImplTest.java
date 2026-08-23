package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.AgencyResponse;
import com.deekshith.tgrtc.entity.Agency;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.repository.AgencyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AgencyServiceImplTest {

    @Mock
    private AgencyRepository agencyRepository;

    @InjectMocks
    private AgencyServiceImpl agencyService;

    @Test
    void shouldGetAllAgencies() {

        Agency agency = Agency.builder()
                .agencyId("TGSRTC")
                .agencyName("Telangana State Road Transport Corporation")
                .agencyUrl("https://tgsrtc.telangana.gov.in/")
                .agencyTimezone("Asia/Kolkata")
                .agencyLang("en")
                .build();

        when(agencyRepository.findAll())
                .thenReturn(List.of(agency));

        List<AgencyResponse> result =
                agencyService.getAllAgencies();

        assertThat(result)
                .hasSize(1);

        AgencyResponse response = result.getFirst();

        assertThat(response.agencyId())
                .isEqualTo("TGSRTC");

        assertThat(response.agencyName())
                .isEqualTo("Telangana State Road Transport Corporation");

        assertThat(response.agencyUrl())
                .isEqualTo("https://tgsrtc.telangana.gov.in/");

        assertThat(response.agencyTimezone())
                .isEqualTo("Asia/Kolkata");

        assertThat(response.agencyLang())
                .isEqualTo("en");

        verify(agencyRepository)
                .findAll();

        verifyNoMoreInteractions(agencyRepository);
    }

    @Test
    void shouldReturnEmptyListWhenNoAgenciesExist() {

        when(agencyRepository.findAll())
                .thenReturn(List.of());

        List<AgencyResponse> result =
                agencyService.getAllAgencies();

        assertThat(result)
                .isEmpty();

        verify(agencyRepository)
                .findAll();

        verifyNoMoreInteractions(agencyRepository);
    }

    @Test
    void shouldGetAgencyById() {

        String agencyId = "TGSRTC";

        Agency agency = Agency.builder()
                .agencyId(agencyId)
                .agencyName("Telangana State Road Transport Corporation")
                .agencyUrl("https://tgsrtc.telangana.gov.in/")
                .agencyTimezone("Asia/Kolkata")
                .agencyLang("en")
                .build();

        when(agencyRepository.findById(agencyId))
                .thenReturn(Optional.of(agency));

        AgencyResponse result =
                agencyService.getAgencyById(agencyId);

        assertThat(result)
                .isNotNull();

        assertThat(result.agencyId())
                .isEqualTo(agencyId);

        assertThat(result.agencyName())
                .isEqualTo("Telangana State Road Transport Corporation");

        assertThat(result.agencyUrl())
                .isEqualTo("https://tgsrtc.telangana.gov.in/");

        assertThat(result.agencyTimezone())
                .isEqualTo("Asia/Kolkata");

        assertThat(result.agencyLang())
                .isEqualTo("en");

        verify(agencyRepository)
                .findById(agencyId);

        verifyNoMoreInteractions(agencyRepository);
    }

    @Test
    void shouldThrowExceptionWhenAgencyDoesNotExist() {

        String agencyId = "UNKNOWN";

        when(agencyRepository.findById(agencyId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                agencyService.getAgencyById(agencyId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(
                        "Agency with id 'UNKNOWN' not found.");

        verify(agencyRepository)
                .findById(agencyId);

        verifyNoMoreInteractions(agencyRepository);
    }
}