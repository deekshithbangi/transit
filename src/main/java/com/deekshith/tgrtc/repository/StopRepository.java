package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.entity.Stop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


@Repository
public interface StopRepository extends JpaRepository<Stop, String> {

    Page<Stop> findByStopNameContainingIgnoreCase(
            String stopName,
            Pageable pageable
    );
}