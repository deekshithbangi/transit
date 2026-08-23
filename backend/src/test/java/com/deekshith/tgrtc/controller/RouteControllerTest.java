package com.deekshith.tgrtc.controller;

import com.deekshith.tgrtc.dto.response.AgencyResponse;
import com.deekshith.tgrtc.dto.response.RouteDetailsResponse;
import com.deekshith.tgrtc.dto.response.RouteResponse;
import com.deekshith.tgrtc.dto.response.TripResponse;
import com.deekshith.tgrtc.exception.GlobalExceptionHandler;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.service.RouteService;
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

@WebMvcTest(RouteController.class)
@Import(GlobalExceptionHandler.class)
class RouteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RouteService routeService;

    @MockitoBean
    private TripService tripService;


    // ============================================================
    // GET /api/routes
    // ============================================================

    @Test
    void shouldGetAllRoutes() throws Exception {

        RouteResponse route = RouteResponse.builder()
                .routeId("100A")
                .routeShortName("100A")
                .routeType((short) 3)
                .agencyId("TGSRTC")
                .build();

        when(routeService.getAllRoutes())
                .thenReturn(List.of(route));

        mockMvc.perform(
                        get("/api/routes")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Routes fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].routeId")
                        .value("100A"))
                .andExpect(jsonPath("$.data[0].routeShortName")
                        .value("100A"))
                .andExpect(jsonPath("$.data[0].routeType")
                        .value(3))
                .andExpect(jsonPath("$.data[0].agencyId")
                        .value("TGSRTC"));

        verify(routeService)
                .getAllRoutes();

        verifyNoMoreInteractions(routeService, tripService);
    }


    @Test
    void shouldReturnEmptyListWhenNoRoutesExist()
            throws Exception {

        when(routeService.getAllRoutes())
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/routes")
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Routes fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        verify(routeService)
                .getAllRoutes();

        verifyNoMoreInteractions(routeService, tripService);
    }


    // ============================================================
    // GET /api/routes/{routeId}?routeId=...
    // ============================================================

    @Test
    void shouldGetRouteByIdUsingRequestParam()
            throws Exception {

        String routeId = "100A";

        RouteResponse route = RouteResponse.builder()
                .routeId(routeId)
                .routeShortName("100A")
                .routeType((short) 3)
                .agencyId("TGSRTC")
                .build();

        when(routeService.getRouteById(routeId))
                .thenReturn(route);

        /*
         * IMPORTANT:
         *
         * Current controller:
         *
         * @GetMapping("/{routeId}")
         * public ... getRouteById(
         *         @RequestParam String routeId)
         *
         * Therefore we provide:
         *
         * Path:
         *     /api/routes/100A
         *
         * Request parameter:
         *     ?routeId=100A
         */

        mockMvc.perform(
                        get("/api/routes/100A")
                                .param("routeId", routeId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Route fetched successfully"))
                .andExpect(jsonPath("$.data.routeId")
                        .value("100A"))
                .andExpect(jsonPath("$.data.routeShortName")
                        .value("100A"))
                .andExpect(jsonPath("$.data.routeType")
                        .value(3))
                .andExpect(jsonPath("$.data.agencyId")
                        .value("TGSRTC"));

        verify(routeService)
                .getRouteById(routeId);

        verifyNoMoreInteractions(routeService, tripService);
    }


    @Test
    void shouldGetRouteWithSlashInRouteId()
            throws Exception {

        /*
         * This represents an actual GTFS route ID from your data.
         */
        String routeId = "102/254K";

        RouteResponse route = RouteResponse.builder()
                .routeId(routeId)
                .routeShortName(routeId)
                .routeType((short) 3)
                .agencyId("TGSRTC")
                .build();

        when(routeService.getRouteById(routeId))
                .thenReturn(route);

        /*
         * We use RequestParam for the actual route ID.
         *
         * The path variable is only required because the current
         * controller mapping contains /{routeId}.
         */
        mockMvc.perform(
                        get("/api/routes/test-route")
                                .param("routeId", routeId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Route fetched successfully"))
                .andExpect(jsonPath("$.data.routeId")
                        .value("102/254K"))
                .andExpect(jsonPath("$.data.routeShortName")
                        .value("102/254K"));

        verify(routeService)
                .getRouteById(routeId);

        verifyNoMoreInteractions(routeService, tripService);
    }


    @Test
    void shouldReturn404WhenRouteDoesNotExist()
            throws Exception {

        String routeId = "UNKNOWN";

        when(routeService.getRouteById(routeId))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Route not found with id: UNKNOWN"
                        )
                );

        mockMvc.perform(
                        get("/api/routes/UNKNOWN")
                                .param("routeId", routeId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("Route not found with id: UNKNOWN"))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(routeService)
                .getRouteById(routeId);

        verifyNoMoreInteractions(routeService, tripService);
    }


    // ============================================================
    // GET /api/routes/trips?routeId=...
    // ============================================================

    @Test
    void shouldGetTripsByRouteId()
            throws Exception {

        String routeId = "102/254K";

        TripResponse trip = TripResponse.builder()
                .tripId(1L)
                .routeId(routeId)
                .serviceId("WEEKDAY")
                .directionId((short) 0)
                .tripShortName("102/254K")
                .build();

        when(tripService.getTripsByRouteId(routeId))
                .thenReturn(List.of(trip));

        mockMvc.perform(
                        get("/api/routes/trips")
                                .param("routeId", routeId)
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
                        .value(1))
                .andExpect(jsonPath("$.data[0].routeId")
                        .value("102/254K"))
                .andExpect(jsonPath("$.data[0].serviceId")
                        .value("WEEKDAY"))
                .andExpect(jsonPath("$.data[0].directionId")
                        .value(0))
                .andExpect(jsonPath("$.data[0].tripShortName")
                        .value("102/254K"));

        verify(tripService)
                .getTripsByRouteId(routeId);

        verifyNoMoreInteractions(routeService, tripService);
    }


    @Test
    void shouldReturnEmptyTripsWhenRouteHasNoTrips()
            throws Exception {

        String routeId = "100H/S";

        when(tripService.getTripsByRouteId(routeId))
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/routes/trips")
                                .param("routeId", routeId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Trips fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        verify(tripService)
                .getTripsByRouteId(routeId);

        verifyNoMoreInteractions(routeService, tripService);
    }


    // ============================================================
    // GET /api/routes/stop/{stopId}
    // ============================================================

    @Test
    void shouldGetRoutesByStopId()
            throws Exception {

        String stopId = "STOP001";

        RouteResponse route = RouteResponse.builder()
                .routeId("100A")
                .routeShortName("100A")
                .routeType((short) 3)
                .agencyId("TGSRTC")
                .build();

        when(routeService.getRoutesByStopId(stopId))
                .thenReturn(List.of(route));

        mockMvc.perform(
                        get("/api/routes/stop/{stopId}", stopId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Routes fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].routeId")
                        .value("100A"))
                .andExpect(jsonPath("$.data[0].routeShortName")
                        .value("100A"));

        verify(routeService)
                .getRoutesByStopId(stopId);

        verifyNoMoreInteractions(routeService, tripService);
    }


    @Test
    void shouldReturnEmptyRoutesWhenStopHasNoRoutes()
            throws Exception {

        String stopId = "STOP999";

        when(routeService.getRoutesByStopId(stopId))
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/routes/stop/{stopId}", stopId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Routes fetched successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        verify(routeService)
                .getRoutesByStopId(stopId);

        verifyNoMoreInteractions(routeService, tripService);
    }


    @Test
    void shouldReturn404WhenStopDoesNotExist()
            throws Exception {

        String stopId = "UNKNOWN";

        when(routeService.getRoutesByStopId(stopId))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Stop not found with ID UNKNOWN"
                        )
                );

        mockMvc.perform(
                        get("/api/routes/stop/{stopId}", stopId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("Stop not found with ID UNKNOWN"))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(routeService)
                .getRoutesByStopId(stopId);

        verifyNoMoreInteractions(routeService, tripService);
    }


    // ============================================================
    // GET /api/routes/details?routeId=...
    // ============================================================

    @Test
    void shouldGetRouteDetails()
            throws Exception {

        String routeId = "104R/127K";

        AgencyResponse agency = AgencyResponse.builder()
                .agencyId("TGSRTC")
                .agencyName(
                        "Telangana State Road Transport Corporation"
                )
                .agencyUrl("https://tgsrtc.telangana.gov.in/")
                .agencyTimezone("Asia/Kolkata")
                .agencyLang("en")
                .build();

        RouteDetailsResponse details =
                RouteDetailsResponse.builder()
                        .routeId(routeId)
                        .routeShortName(routeId)
                        .routeType(3)
                        .agency(agency)
                        .tripsCount(25L)
                        .stopsCount(40L)
                        .serviceCalendars(List.of())
                        .build();

        when(routeService.getRouteDetails(routeId))
                .thenReturn(details);

        mockMvc.perform(
                        get("/api/routes/details")
                                .param("routeId", routeId)
                                .accept(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Route details fetched successfully"))
                .andExpect(jsonPath("$.data.routeId")
                        .value("104R/127K"))
                .andExpect(jsonPath("$.data.routeShortName")
                        .value("104R/127K"))
                .andExpect(jsonPath("$.data.routeType")
                        .value(3))
                .andExpect(jsonPath("$.data.agency.agencyId")
                        .value("TGSRTC"))
                .andExpect(jsonPath("$.data.agency.agencyName")
                        .value(
                                "Telangana State Road Transport Corporation"
                        ))
                .andExpect(jsonPath("$.data.tripsCount")
                        .value(25))
                .andExpect(jsonPath("$.data.stopsCount")
                        .value(40))
                .andExpect(jsonPath("$.data.serviceCalendars")
                        .isArray())
                .andExpect(jsonPath("$.data.serviceCalendars.length()")
                        .value(0));

        verify(routeService)
                .getRouteDetails(routeId);

        verifyNoMoreInteractions(routeService, tripService);
    }


    @Test
    void shouldReturn404WhenRouteDetailsNotFound()
            throws Exception {

        String routeId = "UNKNOWN";

        when(routeService.getRouteDetails(routeId))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Route not found with ID UNKNOWN"
                        )
                );

        mockMvc.perform(
                        get("/api/routes/details")
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

        verify(routeService)
                .getRouteDetails(routeId);

        verifyNoMoreInteractions(routeService, tripService);
    }
}