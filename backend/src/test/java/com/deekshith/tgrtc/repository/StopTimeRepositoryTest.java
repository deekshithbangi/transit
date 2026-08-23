package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.dto.response.DepartureResponse;
import com.deekshith.tgrtc.entity.Agency;
import com.deekshith.tgrtc.entity.Route;
import com.deekshith.tgrtc.entity.ServiceCalendar;
import com.deekshith.tgrtc.entity.Stop;
import com.deekshith.tgrtc.entity.StopTime;
import com.deekshith.tgrtc.entity.Trip;
import com.deekshith.tgrtc.util.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class StopTimeRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private StopTimeRepository stopTimeRepository;

    @Autowired
    private AgencyRepository agencyRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private ServiceCalendarRepository serviceCalendarRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private StopRepository stopRepository;

    @Test
    void shouldFindStopTimesByTripIdOrderedByStopSequence() {

        TestData testData = createTestData();

        List<StopTime> stopTimes =
                stopTimeRepository.findByTripTripIdOrderByIdStopSequence(
                        testData.trip().getTripId());

        assertThat(stopTimes)
                .hasSize(1);

        StopTime stopTime = stopTimes.getFirst();

        assertThat(stopTime.getId().getTripId())
                .isEqualTo(testData.trip().getTripId());

        assertThat(stopTime.getId().getStopSequence())
                .isEqualTo(1);

        assertThat(stopTime.getArrivalTime())
                .isEqualTo("08:00:00");

        assertThat(stopTime.getDepartureTime())
                .isEqualTo("08:05:00");
    }

    @Test
    void shouldReturnEmptyWhenTripHasNoStopTimes() {

        TestData testData = createTripData();

        List<StopTime> stopTimes =
                stopTimeRepository.findByTripTripIdOrderByIdStopSequence(
                        testData.trip().getTripId());

        assertThat(stopTimes)
                .isEmpty();
    }

    @Test
    void shouldFindStopTimesByStopIdOrderedByArrivalTime() {

        TestData testData = createTestData();

        List<StopTime> stopTimes =
                stopTimeRepository.findByStopStopIdOrderByArrivalTime(
                        testData.stop().getStopId());

        assertThat(stopTimes)
                .hasSize(1);

        StopTime stopTime = stopTimes.getFirst();

        assertThat(stopTime.getStop().getStopId())
                .isEqualTo(testData.stop().getStopId());

        assertThat(stopTime.getArrivalTime())
                .isEqualTo("08:00:00");
    }

    @Test
    void shouldFindStopsByRouteId() {

        TestData testData = createTestData();

        List<Stop> stops =
                stopTimeRepository.findStopsByRouteId(
                        testData.route().getRouteId());

        assertThat(stops)
                .hasSize(1);

        assertThat(stops.getFirst().getStopId())
                .isEqualTo(testData.stop().getStopId());

        assertThat(stops.getFirst().getStopName())
                .isEqualTo("Test Stop");
    }

    @Test
    void shouldReturnEmptyWhenRouteHasNoStops() {

        TestData testData = createTripData();

        List<Stop> stops =
                stopTimeRepository.findStopsByRouteId(
                        testData.route().getRouteId());

        assertThat(stops)
                .isEmpty();
    }

    @Test
    void shouldCountDistinctStopsByRouteId() {

        TestData testData = createTestData();

        Long count =
                stopTimeRepository.countStopsByRouteId(
                        testData.route().getRouteId());

        assertThat(count)
                .isEqualTo(1L);
    }

    @Test
    void shouldReturnZeroWhenRouteHasNoStops() {

        TestData testData = createTripData();

        Long count =
                stopTimeRepository.countStopsByRouteId(
                        testData.route().getRouteId());

        assertThat(count)
                .isZero();
    }

    @Test
    void shouldFindDeparturesByStopIdOrderedByDepartureTime() {

        TestData testData = createTestData();

        List<DepartureResponse> departures =
                stopTimeRepository.findDeparturesByStopId(
                        testData.stop().getStopId());

        assertThat(departures)
                .hasSize(1);

        DepartureResponse departure =
                departures.getFirst();

        assertThat(departure.tripId())
                .isEqualTo(testData.trip().getTripId());

        assertThat(departure.routeId())
                .isEqualTo(testData.route().getRouteId());

        assertThat(departure.routeShortName())
                .isEqualTo(testData.route().getRouteShortName());

        assertThat(departure.departureTime())
                .isEqualTo("08:05:00");
    }

    @Test
    void shouldReturnEmptyWhenStopHasNoDepartures() {

        Stop stop = TestDataFactory.createStop();
        stopRepository.save(stop);

        List<DepartureResponse> departures =
                stopTimeRepository.findDeparturesByStopId(
                        stop.getStopId());

        assertThat(departures)
                .isEmpty();
    }

    private TestData createTestData() {

        TestData testData = createTripData();

        Stop stop = TestDataFactory.createStop();
        stopRepository.save(stop);

        StopTime stopTime =
                TestDataFactory.createStopTime(
                        testData.trip(),
                        stop);

        stopTimeRepository.save(stopTime);

        return new TestData(
                testData.agency(),
                testData.route(),
                testData.serviceCalendar(),
                testData.trip(),
                stop
        );
    }

    private TestData createTripData() {

        Agency agency = TestDataFactory.createAgency();
        agencyRepository.save(agency);

        Route route = TestDataFactory.createRoute(agency);
        routeRepository.save(route);

        ServiceCalendar serviceCalendar =
                TestDataFactory.createServiceCalendar();
        serviceCalendarRepository.save(serviceCalendar);

        Trip trip =
                TestDataFactory.createTrip(
                        route,
                        serviceCalendar);

        tripRepository.save(trip);

        return new TestData(
                agency,
                route,
                serviceCalendar,
                trip,
                null
        );
    }

    private record TestData(
            Agency agency,
            Route route,
            ServiceCalendar serviceCalendar,
            Trip trip,
            Stop stop
    ) {
    }
}