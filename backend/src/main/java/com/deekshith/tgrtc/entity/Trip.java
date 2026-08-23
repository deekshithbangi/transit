package com.deekshith.tgrtc.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trips", schema = "gtfs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trip {

    @Id
    @Column(name = "trip_id")
    private Long tripId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private ServiceCalendar serviceCalendar;

    @Column(name = "direction_id")
    private Short directionId;

    @Column(name = "trip_short_name")
    private String tripShortName;
}