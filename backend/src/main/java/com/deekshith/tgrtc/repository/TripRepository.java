package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.entity.Route;
import com.deekshith.tgrtc.entity.ServiceCalendar;
import com.deekshith.tgrtc.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    @Query("""
    SELECT t
    FROM Trip t
    WHERE t.route.routeId = :routeId
    ORDER BY t.tripShortName
    """)
    List<Trip> findTripsByRouteId(
            @Param("routeId") String routeId);

    @Query("""
        SELECT DISTINCT st.trip.route
        FROM StopTime st
        WHERE st.stop.stopId = :stopId
        """)
    List<Route> findRoutesByStopId(@Param("stopId") String stopId);

    @Query("""
        SELECT DISTINCT t.serviceCalendar
        FROM Trip t
        WHERE t.route.routeId = :routeId
        """)
    List<ServiceCalendar> findServiceCalendarsByRouteId(
            @Param("routeId") String routeId);

    @Query("""
    SELECT COUNT(t)
    FROM Trip t
    WHERE t.route.routeId = :routeId
""")
    Long countTripsByRouteId(@Param("routeId") String routeId);
}