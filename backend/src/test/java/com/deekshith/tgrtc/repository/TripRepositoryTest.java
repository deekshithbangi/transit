package com.deekshith.tgrtc.repository;

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

class TripRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private AgencyRepository agencyRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private ServiceCalendarRepository serviceCalendarRepository;

    @Autowired
    private StopRepository stopRepository;

    @Autowired
    private StopTimeRepository stopTimeRepository;

    @Test
    void shouldFindTripsByRouteId() {

        Agency agency = TestDataFactory.createAgency();
        agencyRepository.save(agency);

        Route route = TestDataFactory.createRoute(agency);
        routeRepository.save(route);

        ServiceCalendar serviceCalendar =
                TestDataFactory.createServiceCalendar();
        serviceCalendarRepository.save(serviceCalendar);

        Trip trip = TestDataFactory.createTrip(route, serviceCalendar);
        tripRepository.save(trip);

        List<Trip> trips =
                tripRepository.findTripsByRouteId(route.getRouteId());

        assertThat(trips)
                .hasSize(1);

        assertThat(trips.getFirst().getTripId())
                .isEqualTo(1L);

        assertThat(trips.getFirst().getTripShortName())
                .isEqualTo("Trip-1");
    }

    @Test
    void shouldReturnEmptyWhenRouteHasNoTrips() {

        Agency agency = TestDataFactory.createAgency();
        agencyRepository.save(agency);

        Route route = TestDataFactory.createRoute(agency);
        routeRepository.save(route);

        List<Trip> trips =
                tripRepository.findTripsByRouteId(route.getRouteId());

        assertThat(trips)
                .isEmpty();
    }

    @Test
    void shouldFindRoutesByStopId() {

        Agency agency = TestDataFactory.createAgency();
        agencyRepository.save(agency);

        Route route = TestDataFactory.createRoute(agency);
        routeRepository.save(route);

        ServiceCalendar serviceCalendar =
                TestDataFactory.createServiceCalendar();
        serviceCalendarRepository.save(serviceCalendar);

        Trip trip = TestDataFactory.createTrip(route, serviceCalendar);
        tripRepository.save(trip);

        Stop stop = TestDataFactory.createStop();
        stopRepository.save(stop);

        StopTime stopTime =
                TestDataFactory.createStopTime(trip, stop);
        stopTimeRepository.save(stopTime);

        List<Route> routes =
                tripRepository.findRoutesByStopId(stop.getStopId());

        assertThat(routes)
                .hasSize(1);

        assertThat(routes.getFirst().getRouteId())
                .isEqualTo(route.getRouteId());
    }

    @Test
    void shouldReturnEmptyWhenStopHasNoRoutes() {

        Stop stop = TestDataFactory.createStop();
        stopRepository.save(stop);

        List<Route> routes =
                tripRepository.findRoutesByStopId(stop.getStopId());

        assertThat(routes)
                .isEmpty();
    }

    @Test
    void shouldFindServiceCalendarsByRouteId() {

        Agency agency = TestDataFactory.createAgency();
        agencyRepository.save(agency);

        Route route = TestDataFactory.createRoute(agency);
        routeRepository.save(route);

        ServiceCalendar serviceCalendar =
                TestDataFactory.createServiceCalendar();
        serviceCalendarRepository.save(serviceCalendar);

        Trip trip = TestDataFactory.createTrip(route, serviceCalendar);
        tripRepository.save(trip);

        List<ServiceCalendar> calendars =
                tripRepository.findServiceCalendarsByRouteId(
                        route.getRouteId());

        assertThat(calendars)
                .hasSize(1);

        assertThat(calendars.getFirst().getServiceId())
                .isEqualTo("WEEKDAY");
    }

    @Test
    void shouldReturnEmptyWhenRouteHasNoServiceCalendars() {

        Agency agency = TestDataFactory.createAgency();
        agencyRepository.save(agency);

        Route route = TestDataFactory.createRoute(agency);
        routeRepository.save(route);

        List<ServiceCalendar> calendars =
                tripRepository.findServiceCalendarsByRouteId(
                        route.getRouteId());

        assertThat(calendars)
                .isEmpty();
    }

    @Test
    void shouldCountTripsByRouteId() {

        Agency agency = TestDataFactory.createAgency();
        agencyRepository.save(agency);

        Route route = TestDataFactory.createRoute(agency);
        routeRepository.save(route);

        ServiceCalendar serviceCalendar =
                TestDataFactory.createServiceCalendar();
        serviceCalendarRepository.save(serviceCalendar);

        Trip trip = TestDataFactory.createTrip(route, serviceCalendar);
        tripRepository.save(trip);

        Long count =
                tripRepository.countTripsByRouteId(route.getRouteId());

        assertThat(count)
                .isEqualTo(1L);
    }

    @Test
    void shouldReturnZeroWhenRouteHasNoTrips() {

        Agency agency = TestDataFactory.createAgency();
        agencyRepository.save(agency);

        Route route = TestDataFactory.createRoute(agency);
        routeRepository.save(route);

        Long count =
                tripRepository.countTripsByRouteId(route.getRouteId());

        assertThat(count)
                .isZero();
    }
}