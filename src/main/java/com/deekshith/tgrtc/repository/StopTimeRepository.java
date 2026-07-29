package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.entity.StopTime;
import com.deekshith.tgrtc.entity.StopTimeId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StopTimeRepository extends JpaRepository<StopTime, StopTimeId> {

    List<StopTime> findByTripTripIdOrderByIdStopSequence(Long tripId);

}