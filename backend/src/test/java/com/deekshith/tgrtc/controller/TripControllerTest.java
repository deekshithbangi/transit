package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.StopTimeResponse;
import com.deekshith.tgrtc.dto.response.TripResponse;
import com.deekshith.tgrtc.dto.response.TripScheduleResponse;
import com.deekshith.tgrtc.exception.GlobalExceptionHandler;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.service.StopTimeService;
import com.deekshith.tgrtc.service.TripService;
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

@WebMvcTest(TripController.class)
@Import(GlobalExceptionHandler.class)
class TripControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TripService tripService;

    @MockitoBean
    private StopTimeService stopTimeService;


    // ============================================================
    // GET /api/trips
    // ============================================================

    @Test
    void shouldGetAllTrips() throws Exception {

        TripResponse trip = TripResponse.builder()
                .tripId(1001L)
                .routeId("102/254K")
                .serviceId("WEEKDAY")
                .directionId((short) 0)
                .tripShortName("102/254K")
                .build();

        when(tripService.getAllTrips())
                .thenReturn(List.of(trip));

        mockMvc.perform(
                        get("/api/trips")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Trips fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].tripId")
                        .value(1001))
                .andExpect(jsonPath("$.data[0].routeId")
                        .value("102/254K"))
                .andExpect(jsonPath("$.data[0].serviceId")
                        .value("WEEKDAY"))
                .andExpect(jsonPath("$.data[0].directionId")
                        .value(0))
                .andExpect(jsonPath("$.data[0].tripShortName")
                        .value("102/254K"));

        verify(tripService)
                .getAllTrips();

        verifyNoMoreInteractions(tripService, stopTimeService);
    }


    @Test
    void shouldReturnEmptyListWhenNoTripsExist()
            throws Exception {

        when(tripService.getAllTrips())
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/trips")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Trips fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        verify(tripService)
                .getAllTrips();

        verifyNoMoreInteractions(tripService, stopTimeService);
    }


    // ============================================================
    // GET /api/trips/{tripId}
    // ============================================================

    @Test
    void shouldGetTripById() throws Exception {

        Long tripId = 1001L;

        TripResponse trip = TripResponse.builder()
                .tripId(tripId)
                .routeId("102/254K")
                .serviceId("WEEKDAY")
                .directionId((short) 0)
                .tripShortName("102/254K")
                .build();

        when(tripService.getTripById(tripId))
                .thenReturn(trip);

        mockMvc.perform(
                        get("/api/trips/{tripId}", tripId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Trip fetched successfully"))
                .andExpect(jsonPath("$.data.tripId")
                        .value(1001))
                .andExpect(jsonPath("$.data.routeId")
                        .value("102/254K"))
                .andExpect(jsonPath("$.data.serviceId")
                        .value("WEEKDAY"))
                .andExpect(jsonPath("$.data.directionId")
                        .value(0))
                .andExpect(jsonPath("$.data.tripShortName")
                        .value("102/254K"));

        verify(tripService)
                .getTripById(tripId);

        verifyNoMoreInteractions(tripService, stopTimeService);
    }


    @Test
    void shouldReturn404WhenTripDoesNotExist()
            throws Exception {

        Long tripId = 999999L;

        when(tripService.getTripById(tripId))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Trip not found with id: 999999"
                        )
                );

        mockMvc.perform(
                        get("/api/trips/{tripId}", tripId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("Trip not found with id: 999999"))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(tripService)
                .getTripById(tripId);

        verifyNoMoreInteractions(tripService, stopTimeService);
    }


    // ============================================================
    // GET /api/trips/{tripId}/stops
    // ============================================================

    @Test
    void shouldGetTripStopTimes()
            throws Exception {

        Long tripId = 1001L;

        StopTimeResponse stopTime = StopTimeResponse.builder()
                .tripId(tripId)
                .stopSequence(1)
                .stopId("STOP001")
                .arrivalTime("08:00:00")
                .departureTime("08:01:00")
                .timePoint((short) 1)
                .build();

        when(stopTimeService.getStopTimesByTripId(tripId))
                .thenReturn(List.of(stopTime));

        mockMvc.perform(
                        get("/api/trips/{tripId}/stops", tripId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Trip stop times fetched successfully"))
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
                .getStopTimesByTripId(tripId);

        verifyNoMoreInteractions(tripService, stopTimeService);
    }


    @Test
    void shouldReturnEmptyStopTimesWhenTripHasNoStops()
            throws Exception {

        Long tripId = 1001L;

        when(stopTimeService.getStopTimesByTripId(tripId))
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/trips/{tripId}/stops", tripId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Trip stop times fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        verify(stopTimeService)
                .getStopTimesByTripId(tripId);

        verifyNoMoreInteractions(tripService, stopTimeService);
    }


    @Test
    void shouldReturn404WhenTripDoesNotExistForStopTimes()
            throws Exception {

        Long tripId = 999999L;

        when(stopTimeService.getStopTimesByTripId(tripId))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Trip not found with ID 999999"
                        )
                );

        mockMvc.perform(
                        get("/api/trips/{tripId}/stops", tripId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("Trip not found with ID 999999"))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(stopTimeService)
                .getStopTimesByTripId(tripId);

        verifyNoMoreInteractions(tripService, stopTimeService);
    }


    // ============================================================
    // GET /api/trips/{tripId}/schedule
    // ============================================================

    @Test
    void shouldGetTripSchedule()
            throws Exception {

        Long tripId = 1001L;

        TripScheduleResponse schedule =
                TripScheduleResponse.builder()
                        .stopSequence(1)
                        .stopId("STOP001")
                        .stopName("Test Stop")
                        .arrivalTime("08:00:00")
                        .departureTime("08:01:00")
                        .build();

        when(tripService.getTripSchedule(tripId))
                .thenReturn(List.of(schedule));

        mockMvc.perform(
                        get("/api/trips/{tripId}/schedule", tripId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Trip schedule fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].stopSequence")
                        .value(1))
                .andExpect(jsonPath("$.data[0].stopId")
                        .value("STOP001"))
                .andExpect(jsonPath("$.data[0].stopName")
                        .value("Test Stop"))
                .andExpect(jsonPath("$.data[0].arrivalTime")
                        .value("08:00:00"))
                .andExpect(jsonPath("$.data[0].departureTime")
                        .value("08:01:00"));

        verify(tripService)
                .getTripSchedule(tripId);

        verifyNoMoreInteractions(tripService, stopTimeService);
    }


    @Test
    void shouldReturnEmptyScheduleWhenTripHasNoSchedule()
            throws Exception {

        Long tripId = 1001L;

        when(tripService.getTripSchedule(tripId))
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/trips/{tripId}/schedule", tripId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Trip schedule fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        verify(tripService)
                .getTripSchedule(tripId);

        verifyNoMoreInteractions(tripService, stopTimeService);
    }


    @Test
    void shouldReturn404WhenTripDoesNotExistForSchedule()
            throws Exception {

        Long tripId = 999999L;

        when(tripService.getTripSchedule(tripId))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Trip not found with ID 999999"
                        )
                );

        mockMvc.perform(
                        get("/api/trips/{tripId}/schedule", tripId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("Trip not found with ID 999999"))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(tripService)
                .getTripSchedule(tripId);

        verifyNoMoreInteractions(tripService, stopTimeService);
    }
}