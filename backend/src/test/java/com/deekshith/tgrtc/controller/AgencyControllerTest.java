package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.AgencyResponse;
import com.deekshith.tgrtc.exception.GlobalExceptionHandler;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.service.AgencyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AgencyController.class)
@Import(GlobalExceptionHandler.class)
class AgencyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AgencyService agencyService;

    @Test
    void shouldGetAllAgencies() throws Exception {

        AgencyResponse agency = AgencyResponse.builder()
                .agencyId("TGSRTC")
                .agencyName("Telangana State Road Transport Corporation")
                .agencyUrl("https://tgsrtc.telangana.gov.in/")
                .agencyTimezone("Asia/Kolkata")
                .agencyLang("en")
                .build();

        when(agencyService.getAllAgencies())
                .thenReturn(List.of(agency));

        mockMvc.perform(
                        get("/api/agencies")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Agencies fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].agencyId")
                        .value("TGSRTC"))
                .andExpect(jsonPath("$.data[0].agencyName")
                        .value("Telangana State Road Transport Corporation"))
                .andExpect(jsonPath("$.data[0].agencyTimezone")
                        .value("Asia/Kolkata"));

        verify(agencyService)
                .getAllAgencies();

        verifyNoMoreInteractions(agencyService);
    }

    @Test
    void shouldReturnEmptyListWhenNoAgenciesExist()
            throws Exception {

        when(agencyService.getAllAgencies())
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/agencies")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Agencies fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        verify(agencyService)
                .getAllAgencies();

        verifyNoMoreInteractions(agencyService);
    }

    @Test
    void shouldGetAgencyById() throws Exception {

        String agencyId = "TGSRTC";

        AgencyResponse agency = AgencyResponse.builder()
                .agencyId(agencyId)
                .agencyName("Telangana State Road Transport Corporation")
                .agencyUrl("https://tgsrtc.telangana.gov.in/")
                .agencyTimezone("Asia/Kolkata")
                .agencyLang("en")
                .build();

        when(agencyService.getAgencyById(agencyId))
                .thenReturn(agency);

        mockMvc.perform(
                        get("/api/agencies/{agencyId}", agencyId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Agency fetched successfully"))
                .andExpect(jsonPath("$.data.agencyId")
                        .value("TGSRTC"))
                .andExpect(jsonPath("$.data.agencyName")
                        .value("Telangana State Road Transport Corporation"))
                .andExpect(jsonPath("$.data.agencyTimezone")
                        .value("Asia/Kolkata"))
                .andExpect(jsonPath("$.data.agencyLang")
                        .value("en"));

        verify(agencyService)
                .getAgencyById(agencyId);

        verifyNoMoreInteractions(agencyService);
    }

    @Test
    void shouldReturn404WhenAgencyDoesNotExist()
            throws Exception {

        String agencyId = "UNKNOWN";

        when(agencyService.getAgencyById(agencyId))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Agency with id 'UNKNOWN' not found."
                        )
                );

        mockMvc.perform(
                        get("/api/agencies/{agencyId}", agencyId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("Agency with id 'UNKNOWN' not found."))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(agencyService)
                .getAgencyById(agencyId);

        verifyNoMoreInteractions(agencyService);
    }
}