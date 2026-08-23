package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.entity.Stop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;


@Repository
public interface StopRepository extends JpaRepository<Stop, String> {

    Page<Stop> findByStopNameContainingIgnoreCase(
            String stopName,
            Pageable pageable
    );

    @Query(value = """
        SELECT
            s.stop_id,
            s.stop_name,
            s.stop_lat,
            s.stop_lon,
            (
                6371000 * acos(
                    cos(radians(:lat))
                    * cos(radians(s.stop_lat))
                    * cos(radians(s.stop_lon) - radians(:lon))
                    + sin(radians(:lat))
                    * sin(radians(s.stop_lat))
                )
            ) AS distance
        FROM gtfs.stops s
        WHERE (
                6371000 * acos(
                    cos(radians(:lat))
                    * cos(radians(s.stop_lat))
                    * cos(radians(s.stop_lon) - radians(:lon))
                    + sin(radians(:lat))
                    * sin(radians(s.stop_lat))
                )
        ) <= :radius
        ORDER BY distance
        """,
            nativeQuery = true)
    List<Object[]> findNearbyStops(
            @Param("lat") Double latitude,
            @Param("lon") Double longitude,
            @Param("radius") Double radius);
}