package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.TripResponse;
import com.deekshith.tgrtc.dto.response.TripScheduleResponse;
import com.deekshith.tgrtc.entity.Route;
import com.deekshith.tgrtc.entity.ServiceCalendar;
import com.deekshith.tgrtc.entity.Stop;
import com.deekshith.tgrtc.entity.StopTime;
import com.deekshith.tgrtc.entity.StopTimeId;
import com.deekshith.tgrtc.entity.Trip;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.repository.RouteRepository;
import com.deekshith.tgrtc.repository.StopTimeRepository;
import com.deekshith.tgrtc.repository.TripRepository;
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
class TripServiceImplTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private StopTimeRepository stopTimeRepository;

    @InjectMocks
    private TripServiceImpl tripService;

    @Test
    void shouldGetAllTrips() {

        Trip trip = createTrip();

        when(tripRepository.findAll())
                .thenReturn(List.of(trip));

        List<TripResponse> result =
                tripService.getAllTrips();

        assertThat(result)
                .hasSize(1);

        TripResponse response =
                result.getFirst();

        assertThat(response.tripId())
                .isEqualTo(1L);

        assertThat(response.routeId())
                .isEqualTo("100A");

        assertThat(response.serviceId())
                .isEqualTo("WEEKDAY");

        assertThat(response.directionId())
                .isEqualTo((short) 0);

        assertThat(response.tripShortName())
                .isEqualTo("Trip-1");

        verify(tripRepository)
                .findAll();

        verifyNoMoreInteractions(
                tripRepository,
                routeRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldReturnEmptyListWhenNoTripsExist() {

        when(tripRepository.findAll())
                .thenReturn(List.of());

        List<TripResponse> result =
                tripService.getAllTrips();

        assertThat(result)
                .isEmpty();

        verify(tripRepository)
                .findAll();

        verifyNoMoreInteractions(
                tripRepository,
                routeRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldGetTripById() {

        Long tripId = 1L;

        Trip trip = createTrip();

        when(tripRepository.findById(tripId))
                .thenReturn(Optional.of(trip));

        TripResponse result =
                tripService.getTripById(tripId);

        assertThat(result)
                .isNotNull();

        assertThat(result.tripId())
                .isEqualTo(1L);

        assertThat(result.routeId())
                .isEqualTo("100A");

        assertThat(result.serviceId())
                .isEqualTo("WEEKDAY");

        assertThat(result.directionId())
                .isEqualTo((short) 0);

        assertThat(result.tripShortName())
                .isEqualTo("Trip-1");

        verify(tripRepository)
                .findById(tripId);

        verifyNoMoreInteractions(
                tripRepository,
                routeRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenTripDoesNotExist() {

        Long tripId = 999L;

        when(tripRepository.findById(tripId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                tripService.getTripById(tripId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Trip not found with id: 999");

        verify(tripRepository)
                .findById(tripId);

        verifyNoMoreInteractions(
                tripRepository,
                routeRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldGetTripsByRouteId() {

        String routeId = "100A";

        Trip trip = createTrip();

        when(routeRepository.existsById(routeId))
                .thenReturn(true);

        when(tripRepository.findTripsByRouteId(routeId))
                .thenReturn(List.of(trip));

        List<TripResponse> result =
                tripService.getTripsByRouteId(routeId);

        assertThat(result)
                .hasSize(1);

        TripResponse response =
                result.getFirst();

        assertThat(response.tripId())
                .isEqualTo(1L);

        assertThat(response.routeId())
                .isEqualTo("100A");

        assertThat(response.tripShortName())
                .isEqualTo("Trip-1");

        verify(routeRepository)
                .existsById(routeId);

        verify(tripRepository)
                .findTripsByRouteId(routeId);

        verifyNoMoreInteractions(
                tripRepository,
                routeRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldReturnEmptyListWhenRouteHasNoTrips() {

        String routeId = "100A";

        when(routeRepository.existsById(routeId))
                .thenReturn(true);

        when(tripRepository.findTripsByRouteId(routeId))
                .thenReturn(List.of());

        List<TripResponse> result =
                tripService.getTripsByRouteId(routeId);

        assertThat(result)
                .isEmpty();

        verify(routeRepository)
                .existsById(routeId);

        verify(tripRepository)
                .findTripsByRouteId(routeId);

        verifyNoMoreInteractions(
                tripRepository,
                routeRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenRouteDoesNotExist() {

        String routeId = "UNKNOWN";

        when(routeRepository.existsById(routeId))
                .thenReturn(false);

        assertThatThrownBy(() ->
                tripService.getTripsByRouteId(routeId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Route not found with ID UNKNOWN");

        verify(routeRepository)
                .existsById(routeId);

        verifyNoInteractions(
                tripRepository,
                stopTimeRepository
        );

        verifyNoMoreInteractions(routeRepository);
    }

    @Test
    void shouldGetTripSchedule() {

        Long tripId = 1L;

        Trip trip = createTrip();

        Stop stop = createStop();

        StopTime stopTime = createStopTime(
                trip,
                stop
        );

        when(tripRepository.existsById(tripId))
                .thenReturn(true);

        when(stopTimeRepository
                .findByTripTripIdOrderByIdStopSequence(tripId))
                .thenReturn(List.of(stopTime));

        List<TripScheduleResponse> result =
                tripService.getTripSchedule(tripId);

        assertThat(result)
                .hasSize(1);

        TripScheduleResponse response =
                result.getFirst();

        assertThat(response.stopSequence())
                .isEqualTo(1);

        assertThat(response.stopId())
                .isEqualTo("STOP001");

        assertThat(response.stopName())
                .isEqualTo("Test Stop");

        assertThat(response.arrivalTime())
                .isEqualTo("08:00:00");

        assertThat(response.departureTime())
                .isEqualTo("08:05:00");

        verify(tripRepository)
                .existsById(tripId);

        verify(stopTimeRepository)
                .findByTripTripIdOrderByIdStopSequence(tripId);

        verifyNoMoreInteractions(
                tripRepository,
                routeRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldReturnEmptyScheduleWhenTripHasNoStopTimes() {

        Long tripId = 1L;

        when(tripRepository.existsById(tripId))
                .thenReturn(true);

        when(stopTimeRepository
                .findByTripTripIdOrderByIdStopSequence(tripId))
                .thenReturn(List.of());

        List<TripScheduleResponse> result =
                tripService.getTripSchedule(tripId);

        assertThat(result)
                .isEmpty();

        verify(tripRepository)
                .existsById(tripId);

        verify(stopTimeRepository)
                .findByTripTripIdOrderByIdStopSequence(tripId);

        verifyNoMoreInteractions(
                tripRepository,
                routeRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenTripDoesNotExistForSchedule() {

        Long tripId = 999L;

        when(tripRepository.existsById(tripId))
                .thenReturn(false);

        assertThatThrownBy(() ->
                tripService.getTripSchedule(tripId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Trip not found with ID 999");

        verify(tripRepository)
                .existsById(tripId);

        verifyNoInteractions(
                routeRepository,
                stopTimeRepository
        );

        verifyNoMoreInteractions(tripRepository);
    }

    private Trip createTrip() {

        Route route = Route.builder()
                .routeId("100A")
                .routeShortName("100A")
                .routeType((short) 3)
                .build();

        ServiceCalendar serviceCalendar =
                ServiceCalendar.builder()
                        .serviceId("WEEKDAY")
                        .monday((short) 1)
                        .tuesday((short) 1)
                        .wednesday((short) 1)
                        .thursday((short) 1)
                        .friday((short) 1)
                        .saturday((short) 0)
                        .sunday((short) 0)
                        .build();

        return Trip.builder()
                .tripId(1L)
                .route(route)
                .serviceCalendar(serviceCalendar)
                .directionId((short) 0)
                .tripShortName("Trip-1")
                .build();
    }

    private Stop createStop() {

        return Stop.builder()
                .stopId("STOP001")
                .stopName("Test Stop")
                .zoneId("ZONE1")
                .stopLat(17.3850)
                .stopLon(78.4867)
                .stopDesc("Test stop description")
                .build();
    }

    private StopTime createStopTime(
            Trip trip,
            Stop stop) {

        StopTimeId id = StopTimeId.builder()
                .tripId(trip.getTripId())
                .stopSequence(1)
                .build();

        return StopTime.builder()
                .id(id)
                .trip(trip)
                .stop(stop)
                .arrivalTime("08:00:00")
                .departureTime("08:05:00")
                .timePoint((short) 1)
                .build();
    }
}