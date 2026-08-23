package com.deekshith.tgrtc.util;

import com.deekshith.tgrtc.entity.*;

import java.time.LocalDate;

public final class TestDataFactory {

    private TestDataFactory() {
    }

    public static Agency createAgency() {

        return Agency.builder()
                .agencyId("TEST")
                .agencyName("Test Agency")
                .agencyUrl("https://example.com")
                .agencyTimezone("Asia/Kolkata")
                .agencyLang("en")
                .build();
    }

    public static Route createRoute(Agency agency) {

        return Route.builder()
                .routeId("100A")
                .agency(agency)
                .routeShortName("100A")
                .routeType((short) 3)
                .build();
    }

    public static ServiceCalendar createServiceCalendar() {

        return ServiceCalendar.builder()
                .serviceId("WEEKDAY")
                .startDate(LocalDate.of(2025, 1, 1))
                .endDate(LocalDate.of(2030, 12, 31))
                .monday((short) 1)
                .tuesday((short) 1)
                .wednesday((short) 1)
                .thursday((short) 1)
                .friday((short) 1)
                .saturday((short) 0)
                .sunday((short) 0)
                .build();
    }

    public static Trip createTrip(
            Route route,
            ServiceCalendar serviceCalendar) {

        return Trip.builder()
                .tripId(1L)
                .route(route)
                .serviceCalendar(serviceCalendar)
                .directionId((short) 0)
                .tripShortName("Trip-1")
                .build();
    }

    public static Stop createStop() {

        return Stop.builder()
                .stopId("STOP001")
                .stopName("Test Stop")
                .zoneId("ZONE1")
                .stopLat(17.3850)
                .stopLon(78.4867)
                .stopDesc("Testing Stop")
                .build();
    }

    public static StopTime createStopTime(
            Trip trip,
            Stop stop) {

        return StopTime.builder()
                .id(
                        StopTimeId.builder()
                                .tripId(trip.getTripId())
                                .stopSequence(1)
                                .build()
                )
                .trip(trip)
                .stop(stop)
                .arrivalTime("08:00:00")
                .departureTime("08:05:00")
                .timePoint((short) 1)
                .build();
    }

}