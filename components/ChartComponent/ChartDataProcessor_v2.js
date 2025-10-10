/**
 * Chart Data Processor v2
 *
 * Refactored data processor that works with standardized timeSeries format.
 * This version is cleaner and more maintainable than the original processor.
 */

import { processTimeSeriesData, getYearRange, filterSeriesByYearRange } from "./TimeSeriesProcessor";

/**
 * Process feature data into chart-ready format
 *
 * @param {Object} feature - GeoJSON feature with timeSeries data
 * @param {Object} options - Chart options
 * @returns {Object} Processed data with series and configuration
 */
export function processFeatureForChart(feature, options) {
    console.log("[ChartDataProcessor_v2] Processing feature for chart");

    if (!feature || !feature.properties) {
        console.warn("[ChartDataProcessor_v2] No feature data provided");
        return {
            series: [],
            config: {},
            yearRange: { startYear: null, endYear: null }
        };
    }

    // Use TimeSeriesProcessor to extract and format data
    const { series, config } = processTimeSeriesData(feature, options);

    // Flatten nested arrays (ensemble series)
    const flattenedSeries = series.flatMap(s => Array.isArray(s) ? s : [s]);

    // Get year range
    const yearRange = getYearRange(flattenedSeries);

    console.log("[ChartDataProcessor_v2] Processed:", {
        seriesCount: flattenedSeries.length,
        yearRange
    });

    return {
        series: flattenedSeries,
        config,
        yearRange
    };
}

/**
 * Filter processed chart data by year range
 *
 * @param {Array} series - Processed series data
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @returns {Array} Filtered series
 */
export function filterChartData(series, startYear, endYear) {
    if (!series || series.length === 0) {
        return [];
    }

    return filterSeriesByYearRange(series, startYear, endYear);
}

/**
 * Get available years from series data for year selector
 *
 * @param {Array} series - Processed series data
 * @returns {Array} Array of years
 */
export function getAvailableYears(series) {
    if (!series || series.length === 0) {
        return [];
    }

    const years = new Set();

    series.forEach(s => {
        if (s.timeSeriesData) {
            s.timeSeriesData.forEach(entry => {
                if (entry.year) {
                    years.add(entry.year);
                }
            });
        }
    });

    return Array.from(years).sort((a, b) => a - b);
}

/**
 * Detect chart type from series data
 *
 * @param {Array} series - Processed series data
 * @returns {string} Chart type: 'ensemble', 'timeSeries', or 'standard'
 */
export function detectChartType(series) {
    if (!series || series.length === 0) {
        return 'standard';
    }

    // Check if any series has ensemble data
    const hasEnsemble = series.some(s => s.plotType === 'ensemble' || s.plotType === 'mean');

    if (hasEnsemble) {
        return 'ensemble';
    }

    // Check if data has monthly granularity
    const hasMonthlyData = series.some(s => {
        if (!s.timeSeriesData || s.timeSeriesData.length === 0) {
            return false;
        }
        return s.timeSeriesData.some(entry => entry.month && entry.month > 1);
    });

    return hasMonthlyData ? 'timeSeries' : 'standard';
}

/**
 * Export data to CSV format
 *
 * @param {Array} series - Processed series data
 * @param {Object} config - Chart configuration
 * @returns {string} CSV string
 */
export function exportToCSV(series, config) {
    if (!series || series.length === 0) {
        return '';
    }

    const rows = [];

    // Header
    const headers = ['Date', 'Year', 'Month'];
    const seriesNames = series.map(s => getSeriesLabel(s));
    headers.push(...seriesNames);
    rows.push(headers.join(','));

    // Collect all unique dates
    const datesMap = new Map();

    series.forEach((s, seriesIndex) => {
        if (s.timeSeriesData) {
            s.timeSeriesData.forEach(entry => {
                const dateKey = entry.date.toISOString();
                if (!datesMap.has(dateKey)) {
                    datesMap.set(dateKey, {
                        date: entry.date,
                        year: entry.year,
                        month: entry.month,
                        values: new Array(series.length).fill('')
                    });
                }
                datesMap.get(dateKey).values[seriesIndex] = entry.value !== null ? entry.value : '';
            });
        }
    });

    // Sort by date and create rows
    const sortedDates = Array.from(datesMap.values()).sort((a, b) => a.date - b.date);

    sortedDates.forEach(dateEntry => {
        const row = [
            dateEntry.date.toISOString().split('T')[0],
            dateEntry.year,
            dateEntry.month,
            ...dateEntry.values
        ];
        rows.push(row.join(','));
    });

    return rows.join('\n');
}

/**
 * Get display label for a series
 */
function getSeriesLabel(series) {
    const typeLabels = {
        'singleValue': 'Value',
        'ensemble': `Ensemble ${series.ensembleIndex}`,
        'mean': 'Mean',
        'min': 'Min',
        'max': 'Max'
    };

    return typeLabels[series.plotType] || series.plotType;
}

// Legacy compatibility exports
export const processData = processFeatureForChart;
export const getYearOptions = getAvailableYears;
export const filterDataByYearRange = filterChartData;
