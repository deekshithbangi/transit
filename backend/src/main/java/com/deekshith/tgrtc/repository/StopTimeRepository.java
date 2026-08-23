package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.dto.response.DepartureResponse;
import com.deekshith.tgrtc.dto.response.RouteDetailsResponse;
import com.deekshith.tgrtc.entity.Route;
import com.deekshith.tgrtc.entity.Stop;
import com.deekshith.tgrtc.entity.StopTime;
import com.deekshith.tgrtc.entity.StopTimeId;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.repository.projection.JourneyCandidateProjection;
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
            @Param("stopId") String stopId);

    @Query(value = """
            SELECT t.trip_id AS "tripId", r.route_id AS "routeId",
                   r.route_short_name AS "routeShortName", t.service_id AS "serviceId",
                   origin.stop_id AS "fromStopId", from_stop.stop_name AS "fromStopName",
                   destination.stop_id AS "toStopId", to_stop.stop_name AS "toStopName",
                   origin.departure_time AS "departureTime", destination.arrival_time AS "arrivalTime"
            FROM gtfs.stop_times origin
            JOIN gtfs.stop_times destination ON destination.trip_id = origin.trip_id
            JOIN gtfs.trips t ON t.trip_id = origin.trip_id
            JOIN gtfs.routes r ON r.route_id = t.route_id
            JOIN gtfs.stops from_stop ON from_stop.stop_id = origin.stop_id
            JOIN gtfs.stops to_stop ON to_stop.stop_id = destination.stop_id
            WHERE origin.stop_id = :fromStopId
              AND destination.stop_id = :toStopId
              AND origin.stop_sequence < destination.stop_sequence
            """, nativeQuery = true)
    List<JourneyCandidateProjection> findDirectJourneyCandidates(
            @Param("fromStopId") String fromStopId,
            @Param("toStopId") String toStopId);
}
