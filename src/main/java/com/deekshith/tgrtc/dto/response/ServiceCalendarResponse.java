package com.deekshith.tgrtc.dto.response;

import lombok.Builder;

import java.time.LocalDate;

@Builder
public record ServiceCalendarResponse(

        String serviceId,

        LocalDate startDate,

        LocalDate endDate,

        Short monday,
        Short tuesday,
        Short wednesday,
        Short thursday,
        Short friday,
        Short saturday,
        Short sunday

) {
}