package com.deekshith.tgrtc.entity;

import com.deekshith.tgrtc.util.converter.LocalDateIntegerConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "calendar", schema = "gtfs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceCalendar {

    @Id
    @Column(name = "service_id")
    private String serviceId;

    @Convert(converter = LocalDateIntegerConverter.class)
    @Column(name = "start_date")
    private LocalDate startDate;

    @Convert(converter = LocalDateIntegerConverter.class)
    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "monday")
    private Short monday;

    @Column(name = "tuesday")
    private Short tuesday;

    @Column(name = "wednesday")
    private Short wednesday;

    @Column(name = "thursday")
    private Short thursday;

    @Column(name = "friday")
    private Short friday;

    @Column(name = "saturday")
    private Short saturday;

    @Column(name = "sunday")
    private Short sunday;
}