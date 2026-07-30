package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.dto.response.DepartureResponse;
import com.deekshith.tgrtc.dto.response.RouteDetailsResponse;
import com.deekshith.tgrtc.entity.Route;
import com.deekshith.tgrtc.entity.Stop;
import com.deekshith.tgrtc.entity.StopTime;
import com.deekshith.tgrtc.entity.StopTimeId;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StopTimeRepository extends JpaRepository<StopTime, StopTimeId> {

    List<StopTime> findByTripTripIdOrderByIdStopSequence(Long tripId);
    List<StopTime> findByStopStopIdOrderByArrivalTime(String stopId);

    @Query("""
        SELECT DISTINCT st.stop
        FROM StopTime st
        WHERE st.trip.route.routeId = :routeId
        """)
    List<Stop> findStopsByRouteId(@Param("routeId") String routeId);

    @Query("""
    SELECT COUNT(DISTINCT st.stop.stopId)
    FROM StopTime st
    WHERE st.trip.route.routeId = :routeId
""")
    Long countStopsByRouteId(@Param("routeId") String routeId);

    @Query("""
    SELECT new com.deekshith.tgrtc.dto.response.DepartureResponse(
        st.trip.tripId,
        st.trip.route.routeId,
        st.trip.route.routeShortName,
        st.departureTime
    )
    FROM StopTime st
    WHERE st.stop.stopId = :stopId
    ORDER BY st.departureTime
    """)
    List<DepartureResponse> findDeparturesByStopId(
            @Param("stopId") String stopId);}