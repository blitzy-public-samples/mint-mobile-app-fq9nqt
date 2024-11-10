/**
 * Human Tasks:
 * 1. Verify timezone settings in Android device settings for accurate date handling
 * 2. Ensure app has proper date format localization configurations
 */

package com.mintreplica.lite.utils

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Calendar
import java.util.TimeZone
import java.util.Locale

/**
 * Utility class providing thread-safe date operations for the Mint Replica Lite Android application.
 * 
 * Addresses requirements:
 * - Transaction Tracking: Support for transaction date handling and formatting
 * - Goal Setting: Date calculations for goal deadlines and progress tracking
 * - Data Export: Date formatting for data export with ISO and localized formats
 */
object DateUtils {
    // Global date format patterns
    private const val DEFAULT_DATE_FORMAT = "yyyy-MM-dd"
    private const val DEFAULT_DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss"
    private const val DISPLAY_DATE_FORMAT = "MMM dd, yyyy"
    private const val DISPLAY_DATE_TIME_FORMAT = "MMM dd, yyyy HH:mm"

    // Thread-safe date formatter cache using ThreadLocal
    private val dateFormatters = ThreadLocal<MutableMap<String, SimpleDateFormat>>()

    /**
     * Gets a thread-safe SimpleDateFormat instance for the given pattern
     */
    private fun getFormatter(pattern: String): SimpleDateFormat {
        var formatters = dateFormatters.get()
        if (formatters == null) {
            formatters = mutableMapOf()
            dateFormatters.set(formatters)
        }
        
        return formatters.getOrPut(pattern) {
            SimpleDateFormat(pattern, Locale.getDefault()).apply {
                timeZone = TimeZone.getDefault()
            }
        }
    }

    /**
     * Formats a Date object to string using specified format pattern
     */
    @JvmStatic
    fun formatDate(date: Date?, pattern: String = DEFAULT_DATE_FORMAT): String {
        if (date == null) return ""
        return synchronized(this) {
            getFormatter(pattern).format(date)
        }
    }

    /**
     * Parses a date string into a Date object using specified format pattern
     */
    @JvmStatic
    fun parseDate(dateStr: String?, pattern: String = DEFAULT_DATE_FORMAT): Date? {
        if (dateStr.isNullOrEmpty()) return null
        return try {
            synchronized(this) {
                getFormatter(pattern).parse(dateStr)
            }
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Returns a new Date object set to start of the given date (00:00:00)
     */
    @JvmStatic
    fun getStartOfDay(date: Date): Date {
        return Calendar.getInstance().apply {
            time = date
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.time
    }

    /**
     * Returns a new Date object set to end of the given date (23:59:59.999)
     */
    @JvmStatic
    fun getEndOfDay(date: Date): Date {
        return Calendar.getInstance().apply {
            time = date
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.time
    }

    /**
     * Returns a new Date object set to first day of the given date's month
     */
    @JvmStatic
    fun getStartOfMonth(date: Date): Date {
        return Calendar.getInstance().apply {
            time = date
            set(Calendar.DAY_OF_MONTH, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.time
    }

    /**
     * Returns a new Date object set to last day of the given date's month
     */
    @JvmStatic
    fun getEndOfMonth(date: Date): Date {
        return Calendar.getInstance().apply {
            time = date
            set(Calendar.DAY_OF_MONTH, getActualMaximum(Calendar.DAY_OF_MONTH))
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.time
    }

    /**
     * Calculates number of days between two dates
     */
    @JvmStatic
    fun getDaysBetween(startDate: Date, endDate: Date): Long {
        val start = getStartOfDay(startDate)
        val end = getStartOfDay(endDate)
        val diff = end.time - start.time
        return kotlin.math.abs(diff / (24 * 60 * 60 * 1000))
    }

    /**
     * Checks if a date falls within a specified date range, inclusive of boundaries
     */
    @JvmStatic
    fun isInRange(date: Date, startDate: Date, endDate: Date): Boolean {
        val normalizedDate = getStartOfDay(date)
        val normalizedStart = getStartOfDay(startDate)
        val normalizedEnd = getStartOfDay(endDate)
        return !normalizedDate.before(normalizedStart) && !normalizedDate.after(normalizedEnd)
    }

    /**
     * Formats date using standard display format for UI presentation
     */
    @JvmStatic
    fun toDisplayFormat(date: Date?): String {
        return formatDate(date, DISPLAY_DATE_FORMAT)
    }

    /**
     * Formats date and time using standard display format for UI presentation
     */
    @JvmStatic
    fun toDisplayTimeFormat(date: Date?): String {
        return formatDate(date, DISPLAY_DATE_TIME_FORMAT)
    }
}