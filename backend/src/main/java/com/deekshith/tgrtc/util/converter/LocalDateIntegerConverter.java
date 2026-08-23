package com.deekshith.tgrtc.util.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Converter
public class LocalDateIntegerConverter implements AttributeConverter<LocalDate, Integer> {

    private static final DateTimeFormatter GTFS_DATE_FORMAT =
            DateTimeFormatter.BASIC_ISO_DATE;

    @Override
    public Integer convertToDatabaseColumn(LocalDate attribute) {

        if (attribute == null) {
            return null;
        }

        return Integer.parseInt(attribute.format(GTFS_DATE_FORMAT));
    }

    @Override
    public LocalDate convertToEntityAttribute(Integer dbData) {

        if (dbData == null) {
            return null;
        }

        return LocalDate.parse(dbData.toString(), GTFS_DATE_FORMAT);
    }
}