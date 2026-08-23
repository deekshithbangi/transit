package com.deekshith.tgrtc.service.impl;

import com.deekshith.tgrtc.dto.response.JourneyResponse;
import com.deekshith.tgrtc.entity.ServiceCalendar;
import com.deekshith.tgrtc.exception.ResourceNotFoundException;
import com.deekshith.tgrtc.repository.ServiceCalendarRepository;
import com.deekshith.tgrtc.repository.StopRepository;
import com.deekshith.tgrtc.repository.StopTimeRepository;
import com.deekshith.tgrtc.repository.projection.JourneyCandidateProjection;
import com.deekshith.tgrtc.service.JourneyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JourneyServiceImpl implements JourneyService {
    private static final ZoneId TRANSIT_ZONE = ZoneId.of("Asia/Kolkata");
    private static final int MAX_LIMIT = 20;
    private final StopRepository stopRepository;
    private final StopTimeRepository stopTimeRepository;
    private final ServiceCalendarRepository serviceCalendarRepository;

    @Override
    public List<JourneyResponse> searchUpcomingJourneys(String fromStopId, String toStopId, int limit) {
        validateStops(fromStopId, toStopId);
        int safeLimit = Math.clamp(limit, 1, MAX_LIMIT);
        ZonedDateTime now = ZonedDateTime.now(TRANSIT_ZONE);
        LocalDate today = now.toLocalDate();
        List<JourneyCandidateProjection> candidates = stopTimeRepository.findDirectJourneyCandidates(fromStopId, toStopId);
        Map<String, ServiceCalendar> calendars = serviceCalendarRepository.findAllById(candidates.stream()
                        .map(JourneyCandidateProjection::getServiceId).distinct().toList()).stream()
                .collect(Collectors.toMap(ServiceCalendar::getServiceId, Function.identity()));

        return candidates.stream()
                .filter(candidate -> operatesOn(calendars.get(candidate.getServiceId()), today))
                .map(candidate -> toJourneyResponse(candidate, today, now))
                .filter(journey -> journey.minutesUntilDeparture() >= 0)
                .sorted(Comparator.comparing(JourneyResponse::minutesUntilDeparture))
                .limit(safeLimit)
                .toList();
    }

    private void validateStops(String fromStopId, String toStopId) {
        if (!stopRepository.existsById(fromStopId)) throw new ResourceNotFoundException("Stop not found with ID " + fromStopId);
        if (!stopRepository.existsById(toStopId)) throw new ResourceNotFoundException("Stop not found with ID " + toStopId);
    }

    private boolean operatesOn(ServiceCalendar calendar, LocalDate date) {
        if (calendar == null || date.isBefore(calendar.getStartDate()) || date.isAfter(calendar.getEndDate())) return false;
        return switch (date.getDayOfWeek()) {
            case MONDAY -> calendar.getMonday() == 1;
            case TUESDAY -> calendar.getTuesday() == 1;
            case WEDNESDAY -> calendar.getWednesday() == 1;
            case THURSDAY -> calendar.getThursday() == 1;
            case FRIDAY -> calendar.getFriday() == 1;
            case SATURDAY -> calendar.getSaturday() == 1;
            case SUNDAY -> calendar.getSunday() == 1;
        };
    }

    private JourneyResponse toJourneyResponse(JourneyCandidateProjection candidate, LocalDate serviceDate, ZonedDateTime now) {
        long minutesUntilDeparture = Duration.between(now, toZonedDateTime(serviceDate, candidate.getDepartureTime())).toMinutes();
        return JourneyResponse.builder()
                .tripId(candidate.getTripId()).routeId(candidate.getRouteId()).routeShortName(candidate.getRouteShortName())
                .fromStopId(candidate.getFromStopId()).fromStopName(candidate.getFromStopName())
                .toStopId(candidate.getToStopId()).toStopName(candidate.getToStopName())
                .departureTime(candidate.getDepartureTime()).arrivalTime(candidate.getArrivalTime())
                .minutesUntilDeparture(minutesUntilDeparture).build();
    }

    private ZonedDateTime toZonedDateTime(LocalDate serviceDate, String gtfsTime) {
        String[] parts = gtfsTime.split(":");
        return LocalDateTime.of(serviceDate, LocalTime.MIDNIGHT)
                .plusHours(Integer.parseInt(parts[0]))
                .plusMinutes(Integer.parseInt(parts[1]))
                .plusSeconds(Integer.parseInt(parts[2]))
                .atZone(TRANSIT_ZONE);
    }
}
