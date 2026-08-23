package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.NearbyStopResponse;
import com.deekshith.tgrtc.dto.response.PageResponse;
import com.deekshith.tgrtc.dto.response.StopResponse;
import com.deekshith.tgrtc.entity.Stop;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.repository.RouteRepository;
import com.deekshith.tgrtc.repository.StopRepository;
import com.deekshith.tgrtc.repository.StopTimeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class StopServiceImplTest {

    @Mock
    private StopRepository stopRepository;

    @Mock
    private StopTimeRepository stopTimeRepository;

    @Mock
    private RouteRepository routeRepository;

    @InjectMocks
    private StopServiceImpl stopService;

    @Test
    void shouldGetAllStops() {

        Stop stop = createStop();

        Pageable pageable = PageRequest.of(0, 10);

        Page<Stop> stopPage =
                new PageImpl<>(
                        List.of(stop),
                        pageable,
                        1
                );

        when(stopRepository.findAll(pageable))
                .thenReturn(stopPage);

        PageResponse<StopResponse> result =
                stopService.getAllStops(pageable);

        assertThat(result)
                .isNotNull();

        assertThat(result.content())
                .hasSize(1);

        StopResponse response =
                result.content().getFirst();

        assertThat(response.stopId())
                .isEqualTo("STOP001");

        assertThat(response.stopName())
                .isEqualTo("Test Stop");

        assertThat(response.zoneId())
                .isEqualTo("ZONE1");

        assertThat(response.stopLat())
                .isEqualTo(17.3850);

        assertThat(response.stopLon())
                .isEqualTo(78.4867);

        assertThat(response.stopDesc())
                .isEqualTo("Test stop description");

        assertThat(result.page())
                .isZero();

        assertThat(result.size())
                .isEqualTo(10);

        assertThat(result.totalElements())
                .isEqualTo(1);

        assertThat(result.totalPages())
                .isEqualTo(1);

        assertThat(result.first())
                .isTrue();

        assertThat(result.last())
                .isTrue();

        verify(stopRepository)
                .findAll(pageable);

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository,
                routeRepository
        );
    }

    @Test
    void shouldReturnEmptyPageWhenNoStopsExist() {

        Pageable pageable = PageRequest.of(0, 10);

        Page<Stop> stopPage =
                new PageImpl<>(
                        List.of(),
                        pageable,
                        0
                );

        when(stopRepository.findAll(pageable))
                .thenReturn(stopPage);

        PageResponse<StopResponse> result =
                stopService.getAllStops(pageable);

        assertThat(result)
                .isNotNull();

        assertThat(result.content())
                .isEmpty();

        assertThat(result.totalElements())
                .isZero();

        assertThat(result.totalPages())
                .isZero();

        assertThat(result.first())
                .isTrue();

        assertThat(result.last())
                .isTrue();

        verify(stopRepository)
                .findAll(pageable);

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository,
                routeRepository
        );
    }

    @Test
    void shouldGetStopById() {

        String stopId = "STOP001";

        Stop stop = createStop();

        when(stopRepository.findById(stopId))
                .thenReturn(Optional.of(stop));

        StopResponse result =
                stopService.getStopById(stopId);

        assertThat(result)
                .isNotNull();

        assertThat(result.stopId())
                .isEqualTo("STOP001");

        assertThat(result.stopName())
                .isEqualTo("Test Stop");

        assertThat(result.zoneId())
                .isEqualTo("ZONE1");

        assertThat(result.stopLat())
                .isEqualTo(17.3850);

        assertThat(result.stopLon())
                .isEqualTo(78.4867);

        assertThat(result.stopDesc())
                .isEqualTo("Test stop description");

        verify(stopRepository)
                .findById(stopId);

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository,
                routeRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenStopDoesNotExist() {

        String stopId = "UNKNOWN";

        when(stopRepository.findById(stopId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                stopService.getStopById(stopId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Stop not found with id: UNKNOWN");

        verify(stopRepository)
                .findById(stopId);

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository,
                routeRepository
        );
    }

    @Test
    void shouldSearchStops() {

        String searchTerm = "test";

        Pageable pageable = PageRequest.of(0, 10);

        Stop stop = createStop();

        Page<Stop> stopPage =
                new PageImpl<>(
                        List.of(stop),
                        pageable,
                        1
                );

        when(stopRepository
                .findByStopNameContainingIgnoreCase(
                        searchTerm,
                        pageable))
                .thenReturn(stopPage);

        PageResponse<StopResponse> result =
                stopService.searchStops(
                        searchTerm,
                        pageable
                );

        assertThat(result)
                .isNotNull();

        assertThat(result.content())
                .hasSize(1);

        assertThat(result.content().getFirst().stopName())
                .isEqualTo("Test Stop");

        assertThat(result.totalElements())
                .isEqualTo(1);

        verify(stopRepository)
                .findByStopNameContainingIgnoreCase(
                        searchTerm,
                        pageable
                );

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository,
                routeRepository
        );
    }

    @Test
    void shouldReturnEmptyPageWhenSearchFindsNoStops() {

        String searchTerm = "unknown";

        Pageable pageable = PageRequest.of(0, 10);

        Page<Stop> stopPage =
                new PageImpl<>(
                        List.of(),
                        pageable,
                        0
                );

        when(stopRepository
                .findByStopNameContainingIgnoreCase(
                        searchTerm,
                        pageable))
                .thenReturn(stopPage);

        PageResponse<StopResponse> result =
                stopService.searchStops(
                        searchTerm,
                        pageable
                );

        assertThat(result)
                .isNotNull();

        assertThat(result.content())
                .isEmpty();

        assertThat(result.totalElements())
                .isZero();

        verify(stopRepository)
                .findByStopNameContainingIgnoreCase(
                        searchTerm,
                        pageable
                );

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository,
                routeRepository
        );
    }

    @Test
    void shouldGetStopsByRouteId() {

        String routeId = "100A";

        Stop stop = createStop();

        when(stopTimeRepository.findStopsByRouteId(routeId))
                .thenReturn(List.of(stop));

        List<StopResponse> result =
                stopService.getStopsByRouteId(routeId);

        assertThat(result)
                .hasSize(1);

        StopResponse response =
                result.getFirst();

        assertThat(response.stopId())
                .isEqualTo("STOP001");

        assertThat(response.stopName())
                .isEqualTo("Test Stop");

        verify(stopTimeRepository)
                .findStopsByRouteId(routeId);

        verifyNoInteractions(routeRepository);

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldReturnEmptyListWhenRouteExistsButHasNoStops() {

        String routeId = "100A";

        when(stopTimeRepository.findStopsByRouteId(routeId))
                .thenReturn(List.of());

        when(routeRepository.existsById(routeId))
                .thenReturn(true);

        List<StopResponse> result =
                stopService.getStopsByRouteId(routeId);

        assertThat(result)
                .isEmpty();

        verify(stopTimeRepository)
                .findStopsByRouteId(routeId);

        verify(routeRepository)
                .existsById(routeId);

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository,
                routeRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenRouteDoesNotExist() {

        String routeId = "UNKNOWN";

        when(stopTimeRepository.findStopsByRouteId(routeId))
                .thenReturn(List.of());

        when(routeRepository.existsById(routeId))
                .thenReturn(false);

        assertThatThrownBy(() ->
                stopService.getStopsByRouteId(routeId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(
                        "Route not found with ID UNKNOWN");

        verify(stopTimeRepository)
                .findStopsByRouteId(routeId);

        verify(routeRepository)
                .existsById(routeId);

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository,
                routeRepository
        );
    }

    @Test
    void shouldGetNearbyStops() {

        Double latitude = 17.3850;
        Double longitude = 78.4867;
        Double radius = 1000.0;

        Object[] row = new Object[]{
                "STOP001",
                "Test Stop",
                17.3850,
                78.4867,
                125.50
        };

        List<Object[]> rows = new java.util.ArrayList<>();
        rows.add(row);

        when(stopRepository.findNearbyStops(
                anyDouble(),
                anyDouble(),
                anyDouble()
        )).thenReturn(rows);

        List<NearbyStopResponse> result =
                stopService.getNearbyStops(
                        latitude,
                        longitude,
                        radius
                );

        assertThat(result)
                .hasSize(1);

        NearbyStopResponse response =
                result.getFirst();

        assertThat(response.stopId())
                .isEqualTo("STOP001");

        assertThat(response.stopName())
                .isEqualTo("Test Stop");

        assertThat(response.stopLat())
                .isEqualTo(17.3850);

        assertThat(response.stopLon())
                .isEqualTo(78.4867);

        assertThat(response.distance())
                .isEqualTo(125.50);

        verify(stopRepository)
                .findNearbyStops(
                        latitude,
                        longitude,
                        radius
                );

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository,
                routeRepository
        );
    }

    @Test
    void shouldReturnEmptyListWhenNoNearbyStopsExist() {

        Double latitude = 17.3850;
        Double longitude = 78.4867;
        Double radius = 1000.0;

        when(stopRepository.findNearbyStops(
                latitude,
                longitude,
                radius
        )).thenReturn(List.<Object[]>of());

        List<NearbyStopResponse> result =
                stopService.getNearbyStops(
                        latitude,
                        longitude,
                        radius
                );

        assertThat(result)
                .isEmpty();

        verify(stopRepository)
                .findNearbyStops(
                        latitude,
                        longitude,
                        radius
                );

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository,
                routeRepository
        );
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
}