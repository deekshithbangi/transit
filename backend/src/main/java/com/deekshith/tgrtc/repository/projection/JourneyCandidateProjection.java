package com.deekshith.tgrtc.repository.projection;

public interface JourneyCandidateProjection {
    Long getTripId();
    String getRouteId();
    String getRouteShortName();
    String getServiceId();
    String getFromStopId();
    String getFromStopName();
    String getToStopId();
    String getToStopName();
    String getDepartureTime();
    String getArrivalTime();
}
