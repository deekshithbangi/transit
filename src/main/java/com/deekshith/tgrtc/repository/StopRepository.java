package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.entity.Stop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StopRepository extends JpaRepository<Stop, String> {
}