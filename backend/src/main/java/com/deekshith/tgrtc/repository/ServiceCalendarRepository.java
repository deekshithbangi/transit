package com.deekshith.tgrtc.repository;

import com.deekshith.tgrtc.entity.ServiceCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceCalendarRepository
        extends JpaRepository<ServiceCalendar, String> {
}