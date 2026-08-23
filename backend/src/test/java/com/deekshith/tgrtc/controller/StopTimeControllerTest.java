package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.StopTimeResponse;
import com.deekshith.tgrtc.exception.GlobalExceptionHandler;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.service.StopTimeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StopTimeController.class)
@Import(GlobalExceptionHandler.class)
class StopTimeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StopTimeService stopTimeService;


    // ============================================================
    // GET /api/stop-times
    // ============================================================

    @Test
    void shouldGetAllStopTimes() throws Exception {

        StopTimeResponse stopTime = StopTimeResponse.builder()
                .tripId(1001L)
                .stopSequence(1)
                .stopId("STOP001")
                .arrivalTime("08:00:00")
                .departureTime("08:01:00")
                .timePoint((short) 1)
                .build();

        when(stopTimeService.getAllStopTimes())
                .thenReturn(List.of(stopTime));

        mockMvc.perform(
                        get("/api/stop-times")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Stop times fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].tripId")
                        .value(1001))
                .andExpect(jsonPath("$.data[0].stopSequence")
                        .value(1))
                .andExpect(jsonPath("$.data[0].stopId")
                        .value("STOP001"))
                .andExpect(jsonPath("$.data[0].arrivalTime")
                        .value("08:00:00"))
                .andExpect(jsonPath("$.data[0].departureTime")
                        .value("08:01:00"))
                .andExpect(jsonPath("$.data[0].timePoint")
                        .value(1));

        verify(stopTimeService)
                .getAllStopTimes();

        verifyNoMoreInteractions(stopTimeService);
    }


    @Test
    void shouldReturnEmptyListWhenNoStopTimesExist()
            throws Exception {

        when(stopTimeService.getAllStopTimes())
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/stop-times")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Stop times fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        verify(stopTimeService)
                .getAllStopTimes();

        verifyNoMoreInteractions(stopTimeService);
    }


    // ============================================================
    // GET /api/stop-times/{tripId}/{stopSequence}
    // ============================================================

    @Test
    void shouldGetStopTimeByTripIdAndStopSequence()
            throws Exception {

        Long tripId = 1001L;
        Integer stopSequence = 1;

        StopTimeResponse stopTime = StopTimeResponse.builder()
                .tripId(tripId)
                .stopSequence(stopSequence)
                .stopId("STOP001")
                .arrivalTime("08:00:00")
                .departureTime("08:01:00")
                .timePoint((short) 1)
                .build();

        when(stopTimeService.getStopTime(
                tripId,
                stopSequence
        ))
                .thenReturn(stopTime);

        mockMvc.perform(
                        get(
                                "/api/stop-times/{tripId}/{stopSequence}",
                                tripId,
                                stopSequence
                        )
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Stop time fetched successfully"))
                .andExpect(jsonPath("$.data.tripId")
                        .value(1001))
                .andExpect(jsonPath("$.data.stopSequence")
                        .value(1))
                .andExpect(jsonPath("$.data.stopId")
                        .value("STOP001"))
                .andExpect(jsonPath("$.data.arrivalTime")
                        .value("08:00:00"))
                .andExpect(jsonPath("$.data.departureTime")
                        .value("08:01:00"))
                .andExpect(jsonPath("$.data.timePoint")
                        .value(1));

        verify(stopTimeService)
                .getStopTime(tripId, stopSequence);

        verifyNoMoreInteractions(stopTimeService);
    }


    @Test
    void shouldReturn404WhenStopTimeDoesNotExist()
            throws Exception {

        Long tripId = 999999L;
        Integer stopSequence = 99;

        when(stopTimeService.getStopTime(
                tripId,
                stopSequence
        ))
                .thenThrow(
                        new ResourceNotFoundException(
                                "StopTime not found with Trip ID "
                                        + tripId
                                        + " and Stop Sequence "
                                        + stopSequence
                        )
                );

        mockMvc.perform(
                        get(
                                "/api/stop-times/{tripId}/{stopSequence}",
                                tripId,
                                stopSequence
                        )
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value(
                                "StopTime not found with Trip ID "
                                        + tripId
                                        + " and Stop Sequence "
                                        + stopSequence
                        ))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(stopTimeService)
                .getStopTime(tripId, stopSequence);

        verifyNoMoreInteractions(stopTimeService);
    }
}