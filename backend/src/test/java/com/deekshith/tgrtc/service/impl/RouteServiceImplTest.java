package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.RouteDetailsResponse;
import com.deekshith.tgrtc.dto.response.RouteResponse;
import com.deekshith.tgrtc.entity.Agency;
import com.deekshith.tgrtc.entity.Route;
import com.deekshith.tgrtc.entity.ServiceCalendar;
import com.deekshith.tgrtc.repository.RouteRepository;
import com.deekshith.tgrtc.repository.StopRepository;
import com.deekshith.tgrtc.repository.StopTimeRepository;
import com.deekshith.tgrtc.repository.TripRepository;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RouteServiceImplTest {

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private StopRepository stopRepository;

    @Mock
    private StopTimeRepository stopTimeRepository;

    @InjectMocks
    private RouteServiceImpl routeService;

    @Test
    void shouldGetAllRoutes() {

        Agency agency = createAgency();

        Route route = createRoute(agency);

        when(routeRepository.findAll())
                .thenReturn(List.of(route));

        List<RouteResponse> result =
                routeService.getAllRoutes();

        assertThat(result)
                .hasSize(1);

        RouteResponse response = result.getFirst();

        assertThat(response.routeId())
                .isEqualTo("100A");

        assertThat(response.routeShortName())
                .isEqualTo("100A");

        verify(routeRepository)
                .findAll();

        verifyNoMoreInteractions(
                routeRepository,
                tripRepository,
                stopRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldReturnEmptyListWhenNoRoutesExist() {

        when(routeRepository.findAll())
                .thenReturn(List.of());

        List<RouteResponse> result =
                routeService.getAllRoutes();

        assertThat(result)
                .isEmpty();

        verify(routeRepository)
                .findAll();

        verifyNoMoreInteractions(
                routeRepository,
                tripRepository,
                stopRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldGetRouteById() {

        String routeId = "100A";

        Agency agency = createAgency();

        Route route = createRoute(agency);

        when(routeRepository.findById(routeId))
                .thenReturn(Optional.of(route));

        RouteResponse result =
                routeService.getRouteById(routeId);

        assertThat(result)
                .isNotNull();

        assertThat(result.routeId())
                .isEqualTo(routeId);

        assertThat(result.routeShortName())
                .isEqualTo("100A");

        verify(routeRepository)
                .findById(routeId);

        verifyNoMoreInteractions(
                routeRepository,
                tripRepository,
                stopRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenRouteDoesNotExist() {

        String routeId = "UNKNOWN";

        when(routeRepository.findById(routeId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                routeService.getRouteById(routeId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Route not found with id: UNKNOWN");

        verify(routeRepository)
                .findById(routeId);

        verifyNoMoreInteractions(
                routeRepository,
                tripRepository,
                stopRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldGetRoutesByStopId() {

        String stopId = "STOP001";

        Agency agency = createAgency();

        Route route = createRoute(agency);

        when(stopRepository.existsById(stopId))
                .thenReturn(true);

        when(tripRepository.findRoutesByStopId(stopId))
                .thenReturn(List.of(route));

        List<RouteResponse> result =
                routeService.getRoutesByStopId(stopId);

        assertThat(result)
                .hasSize(1);

        RouteResponse response = result.getFirst();

        assertThat(response.routeId())
                .isEqualTo("100A");

        assertThat(response.routeShortName())
                .isEqualTo("100A");

        verify(stopRepository)
                .existsById(stopId);

        verify(tripRepository)
                .findRoutesByStopId(stopId);

        verifyNoMoreInteractions(
                routeRepository,
                tripRepository,
                stopRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldReturnEmptyListWhenStopHasNoRoutes() {

        String stopId = "STOP001";

        when(stopRepository.existsById(stopId))
                .thenReturn(true);

        when(tripRepository.findRoutesByStopId(stopId))
                .thenReturn(List.of());

        List<RouteResponse> result =
                routeService.getRoutesByStopId(stopId);

        assertThat(result)
                .isEmpty();

        verify(stopRepository)
                .existsById(stopId);

        verify(tripRepository)
                .findRoutesByStopId(stopId);

        verifyNoMoreInteractions(
                routeRepository,
                tripRepository,
                stopRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenStopDoesNotExist() {

        String stopId = "UNKNOWN";

        when(stopRepository.existsById(stopId))
                .thenReturn(false);

        assertThatThrownBy(() ->
                routeService.getRoutesByStopId(stopId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Stop not found with ID UNKNOWN");

        verify(stopRepository)
                .existsById(stopId);

        verifyNoInteractions(
                routeRepository,
                tripRepository,
                stopTimeRepository
        );

        verifyNoMoreInteractions(stopRepository);
    }

    @Test
    void shouldGetRouteDetails() {

        String routeId = "100A";

        Agency agency = createAgency();

        Route route = createRoute(agency);

        ServiceCalendar serviceCalendar =
                createServiceCalendar();

        when(routeRepository.findById(routeId))
                .thenReturn(Optional.of(route));

        when(tripRepository.countTripsByRouteId(routeId))
                .thenReturn(4L);

        when(stopTimeRepository.countStopsByRouteId(routeId))
                .thenReturn(19L);

        when(tripRepository.findServiceCalendarsByRouteId(routeId))
                .thenReturn(List.of(serviceCalendar));

        RouteDetailsResponse result =
                routeService.getRouteDetails(routeId);

        assertThat(result)
                .isNotNull();

        assertThat(result.routeId())
                .isEqualTo("100A");

        assertThat(result.routeShortName())
                .isEqualTo("100A");

        assertThat(result.tripsCount())
                .isEqualTo(4L);

        assertThat(result.stopsCount())
                .isEqualTo(19L);

        assertThat(result.agency())
                .isNotNull();

        assertThat(result.agency().agencyId())
                .isEqualTo("TGSRTC");

        assertThat(result.serviceCalendars())
                .hasSize(1);

        assertThat(result.serviceCalendars().getFirst().serviceId())
                .isEqualTo("WEEKDAY");

        verify(routeRepository)
                .findById(routeId);

        verify(tripRepository)
                .countTripsByRouteId(routeId);

        verify(stopTimeRepository)
                .countStopsByRouteId(routeId);

        verify(tripRepository)
                .findServiceCalendarsByRouteId(routeId);

        verifyNoMoreInteractions(
                routeRepository,
                tripRepository,
                stopRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenGettingDetailsForUnknownRoute() {

        String routeId = "UNKNOWN";

        when(routeRepository.findById(routeId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                routeService.getRouteDetails(routeId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Route not found with ID UNKNOWN");

        verify(routeRepository)
                .findById(routeId);

        verifyNoInteractions(
                tripRepository,
                stopRepository,
                stopTimeRepository
        );

        verifyNoMoreInteractions(routeRepository);
    }

    private Agency createAgency() {

        return Agency.builder()
                .agencyId("TGSRTC")
                .agencyName(
                        "Telangana State Road Transport Corporation")
                .agencyUrl(
                        "https://tgsrtc.telangana.gov.in/")
                .agencyTimezone("Asia/Kolkata")
                .agencyLang("en")
                .build();
    }

    private Route createRoute(Agency agency) {

        return Route.builder()
                .routeId("100A")
                .agency(agency)
                .routeShortName("100A")
                .routeType((short) 3)
                .build();
    }

    private ServiceCalendar createServiceCalendar() {

        return ServiceCalendar.builder()
                .serviceId("WEEKDAY")
                .startDate(
                        LocalDate.of(2025, 1, 1))
                .endDate(
                        LocalDate.of(2030, 12, 31))
                .monday((short) 1)
                .tuesday((short) 1)
                .wednesday((short) 1)
                .thursday((short) 1)
                .friday((short) 1)
                .saturday((short) 0)
                .sunday((short) 0)
                .build();
    }
}