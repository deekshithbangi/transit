package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.entity.Stop;
import com.deekshith.tgrtc.entity.StopTime;
import com.deekshith.tgrtc.entity.StopTimeId;
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
}