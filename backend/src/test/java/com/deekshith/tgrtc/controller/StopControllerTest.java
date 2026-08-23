package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.ApiResponse;
import com.deekshith.tgrtc.dto.response.DepartureResponse;
import com.deekshith.tgrtc.dto.response.NearbyStopResponse;
import com.deekshith.tgrtc.dto.response.PageResponse;
import com.deekshith.tgrtc.dto.response.StopResponse;
import com.deekshith.tgrtc.exception.GlobalExceptionHandler;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.service.StopService;
import com.deekshith.tgrtc.service.StopTimeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StopController.class)
@Import(GlobalExceptionHandler.class)
class StopControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StopService stopService;

    @MockitoBean
    private StopTimeService stopTimeService;


    // ============================================================
    // GET /api/stops
    // ============================================================

    @Test
    void shouldGetAllStops() throws Exception {

        StopResponse stop = StopResponse.builder()
                .stopId("STOP001")
                .stopName("Test Stop")
                .zoneId("ZONE1")
                .stopLat(17.3850)
                .stopLon(78.4867)
                .stopDesc("Test stop description")
                .build();

        PageResponse<StopResponse> pageResponse =
                PageResponse.<StopResponse>builder()
                        .content(List.of(stop))
                        .page(0)
                        .size(10)
                        .totalElements(1)
                        .totalPages(1)
                        .first(true)
                        .last(true)
                        .build();

        when(stopService.getAllStops(
                PageRequest.of(0, 10)))
                .thenReturn(pageResponse);

        mockMvc.perform(
                        get("/api/stops")
                                .param("page", "0")
                                .param("size", "10")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Stops fetched successfully"))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].stopId")
                        .value("STOP001"))
                .andExpect(jsonPath("$.data.content[0].stopName")
                        .value("Test Stop"))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(10))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.totalPages").value(1))
                .andExpect(jsonPath("$.data.first").value(true))
                .andExpect(jsonPath("$.data.last").value(true));

        verify(stopService)
                .getAllStops(PageRequest.of(0, 10));

        verifyNoMoreInteractions(stopService, stopTimeService);
    }


    @Test
    void shouldReturnEmptyPageWhenNoStopsExist()
            throws Exception {

        PageResponse<StopResponse> pageResponse =
                PageResponse.<StopResponse>builder()
                        .content(List.of())
                        .page(0)
                        .size(10)
                        .totalElements(0)
                        .totalPages(0)
                        .first(true)
                        .last(true)
                        .build();

        when(stopService.getAllStops(
                PageRequest.of(0, 10)))
                .thenReturn(pageResponse);

        mockMvc.perform(
                        get("/api/stops")
                                .param("page", "0")
                                .param("size", "10")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content.length()").value(0))
                .andExpect(jsonPath("$.data.totalElements").value(0));

        verify(stopService)
                .getAllStops(PageRequest.of(0, 10));

        verifyNoMoreInteractions(stopService, stopTimeService);
    }


    // ============================================================
    // GET /api/stops/{stopId}
    // ============================================================

    @Test
    void shouldGetStopById() throws Exception {

        String stopId = "STOP001";

        StopResponse stop = StopResponse.builder()
                .stopId(stopId)
                .stopName("Test Stop")
                .zoneId("ZONE1")
                .stopLat(17.3850)
                .stopLon(78.4867)
                .stopDesc("Test stop description")
                .build();

        when(stopService.getStopById(stopId))
                .thenReturn(stop);

        mockMvc.perform(
                        get("/api/stops/{stopId}", stopId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Stop fetched successfully"))
                .andExpect(jsonPath("$.data.stopId")
                        .value("STOP001"))
                .andExpect(jsonPath("$.data.stopName")
                        .value("Test Stop"))
                .andExpect(jsonPath("$.data.zoneId")
                        .value("ZONE1"))
                .andExpect(jsonPath("$.data.stopLat")
                        .value(17.3850))
                .andExpect(jsonPath("$.data.stopLon")
                        .value(78.4867))
                .andExpect(jsonPath("$.data.stopDesc")
                        .value("Test stop description"));

        verify(stopService)
                .getStopById(stopId);

        verifyNoMoreInteractions(stopService, stopTimeService);
    }


    @Test
    void shouldReturn404WhenStopDoesNotExist()
            throws Exception {

        String stopId = "UNKNOWN";

        when(stopService.getStopById(stopId))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Stop not found with id: UNKNOWN"
                        )
                );

        mockMvc.perform(
                        get("/api/stops/{stopId}", stopId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("Stop not found with id: UNKNOWN"))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(stopService)
                .getStopById(stopId);

        verifyNoMoreInteractions(stopService, stopTimeService);
    }


    // ============================================================
    // GET /api/stops/search?name=...
    // ============================================================

    @Test
    void shouldSearchStopsByName() throws Exception {

        String name = "Hyderabad";

        StopResponse stop = StopResponse.builder()
                .stopId("STOP001")
                .stopName("Hyderabad Bus Station")
                .zoneId("ZONE1")
                .stopLat(17.3850)
                .stopLon(78.4867)
                .stopDesc("Hyderabad bus station")
                .build();

        PageResponse<StopResponse> pageResponse =
                PageResponse.<StopResponse>builder()
                        .content(List.of(stop))
                        .page(0)
                        .size(10)
                        .totalElements(1)
                        .totalPages(1)
                        .first(true)
                        .last(true)
                        .build();

        when(stopService.searchStops(
                name,
                PageRequest.of(0, 10)))
                .thenReturn(pageResponse);

        mockMvc.perform(
                        get("/api/stops/search")
                                .param("name", name)
                                .param("page", "0")
                                .param("size", "10")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Stops fetched successfully"))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].stopId")
                        .value("STOP001"))
                .andExpect(jsonPath("$.data.content[0].stopName")
                        .value("Hyderabad Bus Station"))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(10));

        verify(stopService)
                .searchStops(
                        name,
                        PageRequest.of(0, 10)
                );

        verifyNoMoreInteractions(stopService, stopTimeService);
    }


    @Test
    void shouldReturnEmptyPageWhenStopSearchHasNoResults()
            throws Exception {

        String name = "DoesNotExist";

        PageResponse<StopResponse> pageResponse =
                PageResponse.<StopResponse>builder()
                        .content(List.of())
                        .page(0)
                        .size(10)
                        .totalElements(0)
                        .totalPages(0)
                        .first(true)
                        .last(true)
                        .build();

        when(stopService.searchStops(
                name,
                PageRequest.of(0, 10)))
                .thenReturn(pageResponse);

        mockMvc.perform(
                        get("/api/stops/search")
                                .param("name", name)
                                .param("page", "0")
                                .param("size", "10")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content.length()").value(0))
                .andExpect(jsonPath("$.data.totalElements").value(0));

        verify(stopService)
                .searchStops(
                        name,
                        PageRequest.of(0, 10)
                );

        verifyNoMoreInteractions(stopService, stopTimeService);
    }


    // ============================================================
    // GET /api/stops/route?routeId=...
    // ============================================================

    @Test
    void shouldGetStopsByRouteId() throws Exception {

        String routeId = "102/254K";

        StopResponse stop = StopResponse.builder()
                .stopId("STOP001")
                .stopName("Test Stop")
                .zoneId("ZONE1")
                .stopLat(17.3850)
                .stopLon(78.4867)
                .stopDesc("Test stop")
                .build();

        when(stopService.getStopsByRouteId(routeId))
                .thenReturn(List.of(stop));

        mockMvc.perform(
                        get("/api/stops/route")
                                .param("routeId", routeId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Stops fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].stopId")
                        .value("STOP001"))
                .andExpect(jsonPath("$.data[0].stopName")
                        .value("Test Stop"));

        verify(stopService)
                .getStopsByRouteId(routeId);

        verifyNoMoreInteractions(stopService, stopTimeService);
    }


    @Test
    void shouldReturn404WhenRouteDoesNotExistForStops()
            throws Exception {

        String routeId = "UNKNOWN";

        when(stopService.getStopsByRouteId(routeId))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Route not found with ID UNKNOWN"
                        )
                );

        mockMvc.perform(
                        get("/api/stops/route")
                                .param("routeId", routeId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("Route not found with ID UNKNOWN"))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(stopService)
                .getStopsByRouteId(routeId);

        verifyNoMoreInteractions(stopService, stopTimeService);
    }


    // ============================================================
    // GET /api/stops/nearby?lat=...&lon=...&radius=...
    // ============================================================

    @Test
    void shouldGetNearbyStops() throws Exception {

        NearbyStopResponse nearbyStop =
                NearbyStopResponse.builder()
                        .stopId("STOP001")
                        .stopName("Test Stop")
                        .stopLat(17.3850)
                        .stopLon(78.4867)
                        .distance(125.5)
                        .build();

        when(stopService.getNearbyStops(
                17.3850,
                78.4867,
                1000.0
        ))
                .thenReturn(List.of(nearbyStop));

        mockMvc.perform(
                        get("/api/stops/nearby")
                                .param("lat", "17.3850")
                                .param("lon", "78.4867")
                                .param("radius", "1000.0")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Nearby stops fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].stopId")
                        .value("STOP001"))
                .andExpect(jsonPath("$.data[0].stopName")
                        .value("Test Stop"))
                .andExpect(jsonPath("$.data[0].stopLat")
                        .value(17.3850))
                .andExpect(jsonPath("$.data[0].stopLon")
                        .value(78.4867))
                .andExpect(jsonPath("$.data[0].distance")
                        .value(125.5));

        verify(stopService)
                .getNearbyStops(
                        17.3850,
                        78.4867,
                        1000.0
                );

        verifyNoMoreInteractions(stopService, stopTimeService);
    }


    @Test
    void shouldReturnEmptyListWhenNoNearbyStopsExist()
            throws Exception {

        when(stopService.getNearbyStops(
                17.3850,
                78.4867,
                100.0
        ))
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/stops/nearby")
                                .param("lat", "17.3850")
                                .param("lon", "78.4867")
                                .param("radius", "100.0")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Nearby stops fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        verify(stopService)
                .getNearbyStops(
                        17.3850,
                        78.4867,
                        100.0
                );

        verifyNoMoreInteractions(stopService, stopTimeService);
    }


    // ============================================================
    // GET /api/stops/{stopId}/departures
    // ============================================================

    @Test
    void shouldGetDeparturesByStopId()
            throws Exception {

        String stopId = "STOP001";

        DepartureResponse departure =
                DepartureResponse.builder()
                        .tripId(1001L)
                        .routeId("102/254K")
                        .routeShortName("102/254K")
                        .departureTime("08:30:00")
                        .build();

        when(stopTimeService.getDeparturesByStopId(stopId))
                .thenReturn(List.of(departure));

        mockMvc.perform(
                        get("/api/stops/{stopId}/departures", stopId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Next departures fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].tripId")
                        .value(1001))
                .andExpect(jsonPath("$.data[0].routeId")
                        .value("102/254K"))
                .andExpect(jsonPath("$.data[0].routeShortName")
                        .value("102/254K"))
                .andExpect(jsonPath("$.data[0].departureTime")
                        .value("08:30:00"));

        verify(stopTimeService)
                .getDeparturesByStopId(stopId);

        verifyNoMoreInteractions(stopService, stopTimeService);
    }


    @Test
    void shouldReturn404WhenStopDoesNotExistForDepartures()
            throws Exception {

        String stopId = "UNKNOWN";

        when(stopTimeService.getDeparturesByStopId(stopId))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Stop not found with ID UNKNOWN"
                        )
                );

        mockMvc.perform(
                        get("/api/stops/{stopId}/departures", stopId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("Stop not found with ID UNKNOWN"))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(stopTimeService)
                .getDeparturesByStopId(stopId);

        verifyNoMoreInteractions(stopService, stopTimeService);
    }
}