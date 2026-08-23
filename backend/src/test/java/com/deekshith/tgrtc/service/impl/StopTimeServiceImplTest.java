package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.DepartureResponse;
import com.deekshith.tgrtc.dto.response.StopTimeResponse;
import com.deekshith.tgrtc.entity.StopTime;
import com.deekshith.tgrtc.entity.StopTimeId;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.mapper.StopTimeMapper;
import com.deekshith.tgrtc.repository.StopRepository;
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
class StopTimeServiceImplTest {

    @Mock
    private StopTimeRepository stopTimeRepository;

    @Mock
    private StopTimeMapper stopTimeMapper;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private StopRepository stopRepository;

    @InjectMocks
    private StopTimeServiceImpl stopTimeService;

    @Test
    void shouldGetAllStopTimes() {

        StopTime stopTime = createStopTime();

        StopTimeResponse response = createStopTimeResponse();

        when(stopTimeRepository.findAll())
                .thenReturn(List.of(stopTime));

        when(stopTimeMapper.toResponse(stopTime))
                .thenReturn(response);

        List<StopTimeResponse> result =
                stopTimeService.getAllStopTimes();

        assertThat(result)
                .hasSize(1);

        StopTimeResponse actual =
                result.getFirst();

        assertThat(actual.tripId())
                .isEqualTo(1L);

        assertThat(actual.stopSequence())
                .isEqualTo(1);

        assertThat(actual.stopId())
                .isEqualTo("STOP001");

        assertThat(actual.arrivalTime())
                .isEqualTo("08:00:00");

        assertThat(actual.departureTime())
                .isEqualTo("08:05:00");

        assertThat(actual.timePoint())
                .isEqualTo((short) 1);

        verify(stopTimeRepository)
                .findAll();

        verify(stopTimeMapper)
                .toResponse(stopTime);

        verifyNoMoreInteractions(
                stopTimeRepository,
                stopTimeMapper,
                tripRepository,
                stopRepository
        );
    }

    @Test
    void shouldReturnEmptyListWhenNoStopTimesExist() {

        when(stopTimeRepository.findAll())
                .thenReturn(List.of());

        List<StopTimeResponse> result =
                stopTimeService.getAllStopTimes();

        assertThat(result)
                .isEmpty();

        verify(stopTimeRepository)
                .findAll();

        verifyNoInteractions(
                stopTimeMapper,
                tripRepository,
                stopRepository
        );

        verifyNoMoreInteractions(stopTimeRepository);
    }

    @Test
    void shouldGetStopTimeById() {

        Long tripId = 1L;
        Integer stopSequence = 1;

        StopTimeId id =
                new StopTimeId(tripId, stopSequence);

        StopTime stopTime = createStopTime();

        StopTimeResponse response =
                createStopTimeResponse();

        when(stopTimeRepository.findById(id))
                .thenReturn(Optional.of(stopTime));

        when(stopTimeMapper.toResponse(stopTime))
                .thenReturn(response);

        StopTimeResponse result =
                stopTimeService.getStopTime(
                        tripId,
                        stopSequence
                );

        assertThat(result)
                .isNotNull();

        assertThat(result.tripId())
                .isEqualTo(1L);

        assertThat(result.stopSequence())
                .isEqualTo(1);

        assertThat(result.stopId())
                .isEqualTo("STOP001");

        assertThat(result.arrivalTime())
                .isEqualTo("08:00:00");

        assertThat(result.departureTime())
                .isEqualTo("08:05:00");

        verify(stopTimeRepository)
                .findById(id);

        verify(stopTimeMapper)
                .toResponse(stopTime);

        verifyNoMoreInteractions(
                stopTimeRepository,
                stopTimeMapper,
                tripRepository,
                stopRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenStopTimeDoesNotExist() {

        Long tripId = 999L;
        Integer stopSequence = 5;

        StopTimeId id =
                new StopTimeId(tripId, stopSequence);

        when(stopTimeRepository.findById(id))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                stopTimeService.getStopTime(
                        tripId,
                        stopSequence
                ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(
                        "StopTime not found with Trip ID 999 and Stop Sequence 5"
                );

        verify(stopTimeRepository)
                .findById(id);

        verifyNoInteractions(
                stopTimeMapper,
                tripRepository,
                stopRepository
        );

        verifyNoMoreInteractions(stopTimeRepository);
    }

    @Test
    void shouldGetStopTimesByTripId() {

        Long tripId = 1L;

        StopTime stopTime = createStopTime();

        StopTimeResponse response =
                createStopTimeResponse();

        when(tripRepository.existsById(tripId))
                .thenReturn(true);

        when(stopTimeRepository
                .findByTripTripIdOrderByIdStopSequence(tripId))
                .thenReturn(List.of(stopTime));

        when(stopTimeMapper.toResponse(stopTime))
                .thenReturn(response);

        List<StopTimeResponse> result =
                stopTimeService.getStopTimesByTripId(tripId);

        assertThat(result)
                .hasSize(1);

        StopTimeResponse actual =
                result.getFirst();

        assertThat(actual.tripId())
                .isEqualTo(1L);

        assertThat(actual.stopSequence())
                .isEqualTo(1);

        assertThat(actual.stopId())
                .isEqualTo("STOP001");

        verify(tripRepository)
                .existsById(tripId);

        verify(stopTimeRepository)
                .findByTripTripIdOrderByIdStopSequence(tripId);

        verify(stopTimeMapper)
                .toResponse(stopTime);

        verifyNoMoreInteractions(
                stopTimeRepository,
                stopTimeMapper,
                tripRepository,
                stopRepository
        );
    }

    @Test
    void shouldReturnEmptyListWhenTripHasNoStopTimes() {

        Long tripId = 1L;

        when(tripRepository.existsById(tripId))
                .thenReturn(true);

        when(stopTimeRepository
                .findByTripTripIdOrderByIdStopSequence(tripId))
                .thenReturn(List.of());

        List<StopTimeResponse> result =
                stopTimeService.getStopTimesByTripId(tripId);

        assertThat(result)
                .isEmpty();

        verify(tripRepository)
                .existsById(tripId);

        verify(stopTimeRepository)
                .findByTripTripIdOrderByIdStopSequence(tripId);

        verifyNoInteractions(
                stopTimeMapper,
                stopRepository
        );

        verifyNoMoreInteractions(
                tripRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenTripDoesNotExistForStopTimes() {

        Long tripId = 999L;

        when(tripRepository.existsById(tripId))
                .thenReturn(false);

        assertThatThrownBy(() ->
                stopTimeService.getStopTimesByTripId(tripId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(
                        "Trip not found with ID 999"
                );

        verify(tripRepository)
                .existsById(tripId);

        verifyNoInteractions(
                stopTimeRepository,
                stopTimeMapper,
                stopRepository
        );

        verifyNoMoreInteractions(tripRepository);
    }

    @Test
    void shouldGetTripTimesByStopId() {

        String stopId = "STOP001";

        StopTime stopTime = createStopTime();

        StopTimeResponse response =
                createStopTimeResponse();

        when(stopRepository.existsById(stopId))
                .thenReturn(true);

        when(stopTimeRepository
                .findByStopStopIdOrderByArrivalTime(stopId))
                .thenReturn(List.of(stopTime));

        when(stopTimeMapper.toResponse(stopTime))
                .thenReturn(response);

        List<StopTimeResponse> result =
                stopTimeService.getTripTimesByStopId(stopId);

        assertThat(result)
                .hasSize(1);

        StopTimeResponse actual =
                result.getFirst();

        assertThat(actual.tripId())
                .isEqualTo(1L);

        assertThat(actual.stopSequence())
                .isEqualTo(1);

        assertThat(actual.stopId())
                .isEqualTo("STOP001");

        assertThat(actual.arrivalTime())
                .isEqualTo("08:00:00");

        verify(stopRepository)
                .existsById(stopId);

        verify(stopTimeRepository)
                .findByStopStopIdOrderByArrivalTime(stopId);

        verify(stopTimeMapper)
                .toResponse(stopTime);

        verifyNoMoreInteractions(
                stopTimeRepository,
                stopTimeMapper,
                tripRepository,
                stopRepository
        );
    }

    @Test
    void shouldReturnEmptyListWhenStopHasNoStopTimes() {

        String stopId = "STOP001";

        when(stopRepository.existsById(stopId))
                .thenReturn(true);

        when(stopTimeRepository
                .findByStopStopIdOrderByArrivalTime(stopId))
                .thenReturn(List.of());

        List<StopTimeResponse> result =
                stopTimeService.getTripTimesByStopId(stopId);

        assertThat(result)
                .isEmpty();

        verify(stopRepository)
                .existsById(stopId);

        verify(stopTimeRepository)
                .findByStopStopIdOrderByArrivalTime(stopId);

        verifyNoInteractions(
                stopTimeMapper,
                tripRepository
        );

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenStopDoesNotExistForTripTimes() {

        String stopId = "UNKNOWN";

        when(stopRepository.existsById(stopId))
                .thenReturn(false);

        assertThatThrownBy(() ->
                stopTimeService.getTripTimesByStopId(stopId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(
                        "Stop not found with ID UNKNOWN"
                );

        verify(stopRepository)
                .existsById(stopId);

        verifyNoInteractions(
                stopTimeRepository,
                stopTimeMapper,
                tripRepository
        );

        verifyNoMoreInteractions(stopRepository);
    }

    @Test
    void shouldGetDeparturesByStopId() {

        String stopId = "STOP001";

        DepartureResponse departure =
                DepartureResponse.builder()
                        .tripId(1L)
                        .routeId("100A")
                        .routeShortName("100A")
                        .departureTime("08:05:00")
                        .build();

        when(stopRepository.existsById(stopId))
                .thenReturn(true);

        when(stopTimeRepository.findDeparturesByStopId(stopId))
                .thenReturn(List.of(departure));

        List<DepartureResponse> result =
                stopTimeService.getDeparturesByStopId(stopId);

        assertThat(result)
                .hasSize(1);

        DepartureResponse actual =
                result.getFirst();

        assertThat(actual.tripId())
                .isEqualTo(1L);

        assertThat(actual.routeId())
                .isEqualTo("100A");

        assertThat(actual.routeShortName())
                .isEqualTo("100A");

        assertThat(actual.departureTime())
                .isEqualTo("08:05:00");

        verify(stopRepository)
                .existsById(stopId);

        verify(stopTimeRepository)
                .findDeparturesByStopId(stopId);

        verifyNoMoreInteractions(
                stopTimeRepository,
                stopTimeMapper,
                tripRepository,
                stopRepository
        );
    }

    @Test
    void shouldReturnEmptyDeparturesWhenStopHasNoDepartures() {

        String stopId = "STOP001";

        when(stopRepository.existsById(stopId))
                .thenReturn(true);

        when(stopTimeRepository.findDeparturesByStopId(stopId))
                .thenReturn(List.of());

        List<DepartureResponse> result =
                stopTimeService.getDeparturesByStopId(stopId);

        assertThat(result)
                .isEmpty();

        verify(stopRepository)
                .existsById(stopId);

        verify(stopTimeRepository)
                .findDeparturesByStopId(stopId);

        verifyNoInteractions(
                stopTimeMapper,
                tripRepository
        );

        verifyNoMoreInteractions(
                stopRepository,
                stopTimeRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenStopDoesNotExistForDepartures() {

        String stopId = "UNKNOWN";

        when(stopRepository.existsById(stopId))
                .thenReturn(false);

        assertThatThrownBy(() ->
                stopTimeService.getDeparturesByStopId(stopId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage(
                        "Stop not found with ID UNKNOWN"
                );

        verify(stopRepository)
                .existsById(stopId);

        verifyNoInteractions(
                stopTimeRepository,
                stopTimeMapper,
                tripRepository
        );

        verifyNoMoreInteractions(stopRepository);
    }

    private StopTime createStopTime() {

        StopTimeId id =
                new StopTimeId(1L, 1);

        return StopTime.builder()
                .id(id)
                .arrivalTime("08:00:00")
                .departureTime("08:05:00")
                .timePoint((short) 1)
                .build();
    }

    private StopTimeResponse createStopTimeResponse() {

        return StopTimeResponse.builder()
                .tripId(1L)
                .stopSequence(1)
                .stopId("STOP001")
                .arrivalTime("08:00:00")
                .departureTime("08:05:00")
                .timePoint((short) 1)
                .build();
    }
}