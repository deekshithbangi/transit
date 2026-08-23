package com.deekshith.tgrtc.mapper;

import com.deekshith.tgrtc.dto.response.ServiceCalendarResponse;
import com.deekshith.tgrtc.entity.ServiceCalendar;

public final class ServiceCalendarMapper {

    private ServiceCalendarMapper() {
    }

    public static ServiceCalendarResponse toResponse(ServiceCalendar calendar) {

        return ServiceCalendarResponse.builder()
                .serviceId(calendar.getServiceId())
                .startDate(calendar.getStartDate())
                .endDate(calendar.getEndDate())
                .monday(calendar.getMonday())
                .tuesday(calendar.getTuesday())
                .wednesday(calendar.getWednesday())
                .thursday(calendar.getThursday())
                .friday(calendar.getFriday())
                .saturday(calendar.getSaturday())
                .sunday(calendar.getSunday())
                .build();
    }
}