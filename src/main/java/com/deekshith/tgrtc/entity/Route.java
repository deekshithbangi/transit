package com.deekshith.tgrtc.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "routes", schema = "gtfs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {

    @Id
    @Column(name = "route_id")
    private String routeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id")
    private Agency agency;

    @Column(name = "route_short_name")
    private String routeShortName;

    @Column(name = "route_type")
    private Short routeType;

}