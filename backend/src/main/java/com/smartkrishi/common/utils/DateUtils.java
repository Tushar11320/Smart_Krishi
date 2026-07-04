package com.smartkrishi.common.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Date;

public final class DateUtils {
    
    private DateUtils() {
        throw new IllegalStateException("Utility class");
    }
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    public static String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMATTER) : null;
    }
    
    public static String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATETIME_FORMATTER) : null;
    }
    
    public static LocalDate parseDate(String dateStr) {
        return dateStr != null ? LocalDate.parse(dateStr, DATE_FORMATTER) : null;
    }
    
    public static LocalDateTime parseDateTime(String dateTimeStr) {
        return dateTimeStr != null ? LocalDateTime.parse(dateTimeStr, DATETIME_FORMATTER) : null;
    }
    
    public static Date toDate(LocalDateTime localDateTime) {
        return localDateTime != null ? Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant()) : null;
    }
    
    public static LocalDateTime toLocalDateTime(Date date) {
        return date != null ? LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault()) : null;
    }
    
    public static long daysBetween(LocalDate startDate, LocalDate endDate) {
        return ChronoUnit.DAYS.between(startDate, endDate);
    }
    
    public static boolean isExpired(LocalDateTime expiryDateTime) {
        return expiryDateTime != null && LocalDateTime.now().isAfter(expiryDateTime);
    }
    
    public static LocalDateTime addDays(LocalDateTime dateTime, long days) {
        return dateTime != null ? dateTime.plusDays(days) : null;
    }
    
    public static LocalDateTime addHours(LocalDateTime dateTime, long hours) {
        return dateTime != null ? dateTime.plusHours(hours) : null;
    }
}
