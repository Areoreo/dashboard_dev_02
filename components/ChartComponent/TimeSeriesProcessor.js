/**
 * Time Series Data Processor for Chart Component
 *
 * This module processes feature data with standardized timeSeries format
 * into chart-ready data structures with proper plot type configurations.
 */

import { getColorConfig } from "@utils/colorMapConfig";
import { convertNullValue } from "@utils/missingValueConfig";

/**
 * Process time series data from a GeoJSON feature into chart-ready format
 *
 * @param {Object} feature - GeoJSON feature with timeSeries in properties
 * @param {Object} options - Chart options (varType, adminLevel, etc.)
 * @returns {Object} Processed data with series and config
 */
export function processTimeSeriesData(feature, options) {
    if (!feature || !feature.properties) {
        console.warn("[TimeSeriesProcessor] No feature properties found");
        return {
            series: [],
            config: getDefaultChartConfig(options)
        };
    }

    let timeSeries = feature.properties.timeSeries;

    // If no timeSeries, try to extract from legacy flat format
    if (!timeSeries) {
        console.log("[TimeSeriesProcessor] No timeSeries found, attempting legacy format conversion");
        timeSeries = extractLegacyTimeSeries(feature.properties);

        if (!timeSeries || timeSeries.length === 0) {
            console.warn("[TimeSeriesProcessor] No time series data found in feature");
            return {
                series: [],
                config: getDefaultChartConfig(options)
            };
        }
    }
    const series = [];

    // Group consecutive entries by type
    let currentGroup = null;

    for (let i = 0; i < timeSeries.length; i++) {
        const entry = timeSeries[i];

        // Determine if we need to start a new group
        const shouldStartNewGroup =
            currentGroup === null ||
            currentGroup.type !== entry.type ||
            (entry.type === 'single' && currentGroup.type === 'single' && i > 0 && isDateGap(timeSeries[i - 1], entry));

        if (shouldStartNewGroup) {
            // Save previous group if exists
            if (currentGroup) {
                series.push(createSeriesFromGroup(currentGroup, options));
            }

            // Start new group
            currentGroup = {
                type: entry.type,
                entries: [entry]
            };
        } else {
            // Add to current group
            currentGroup.entries.push(entry);
        }
    }

    // Don't forget the last group
    if (currentGroup) {
        series.push(createSeriesFromGroup(currentGroup, options));
    }

    // Generate chart configuration
    const config = generateChartConfig(series, options);

    console.log("[TimeSeriesProcessor] Processed series:", series.length);
    return { series, config };
}

/**
 * Check if there's a significant time gap between two entries
 */
function isDateGap(entry1, entry2) {
    const date1 = new Date(entry1.date);
    const date2 = new Date(entry2.date);
    const monthDiff = (date2.getFullYear() - date1.getFullYear()) * 12 +
                      (date2.getMonth() - date1.getMonth());
    return monthDiff > 12; // Gap of more than 1 year
}

/**
 * Create a series object from a group of entries
 */
function createSeriesFromGroup(group, options = {}) {
    const varType = options?.varType;

    if (group.type === 'single') {
        // Check if any entries have statistics (l95, h95, etc.)
        const hasStatistics = group.entries.some(e => e.statistics && Object.keys(e.statistics).length > 0);

        if (hasStatistics) {
            // If we have statistics, create multiple series like ensemble data
            const series = [];

            // Main value series
            series.push({
                plotType: 'singleValue',
                timeSeriesData: group.entries.map(entry => ({
                    date: new Date(entry.date),
                    value: entry.value,
                    year: entry.year,
                    month: entry.month,
                    formattedDate: formatDate(entry.date)
                }))
            });

            // L95 series (if exists)
            // Convert null to appropriate value based on varType (e.g., 0 for Yield)
            const hasL95 = group.entries.some(e => e.statistics?.l95 !== null && e.statistics?.l95 !== undefined);
            if (hasL95) {
                series.push({
                    plotType: 'l95',
                    timeSeriesData: group.entries.map(entry => ({
                        date: new Date(entry.date),
                        value: convertNullValue(entry.statistics?.l95, varType),
                        year: entry.year,
                        month: entry.month,
                        formattedDate: formatDate(entry.date)
                    }))
                });
            }

            // H95 series (if exists)
            // Convert null to appropriate value based on varType (e.g., 0 for Yield)
            const hasH95 = group.entries.some(e => e.statistics?.h95 !== null && e.statistics?.h95 !== undefined);
            if (hasH95) {
                series.push({
                    plotType: 'h95',
                    timeSeriesData: group.entries.map(entry => ({
                        date: new Date(entry.date),
                        value: convertNullValue(entry.statistics?.h95, varType),
                        year: entry.year,
                        month: entry.month,
                        formattedDate: formatDate(entry.date)
                    }))
                });
            }

            // Min series (if exists)
            const hasMin = group.entries.some(e => e.statistics?.min !== null && e.statistics?.min !== undefined);
            if (hasMin) {
                series.push({
                    plotType: 'min',
                    timeSeriesData: group.entries.map(entry => ({
                        date: new Date(entry.date),
                        value: entry.statistics?.min || null,
                        year: entry.year,
                        month: entry.month,
                        formattedDate: formatDate(entry.date)
                    }))
                });
            }

            // Max series (if exists)
            const hasMax = group.entries.some(e => e.statistics?.max !== null && e.statistics?.max !== undefined);
            if (hasMax) {
                series.push({
                    plotType: 'max',
                    timeSeriesData: group.entries.map(entry => ({
                        date: new Date(entry.date),
                        value: entry.statistics?.max || null,
                        year: entry.year,
                        month: entry.month,
                        formattedDate: formatDate(entry.date)
                    }))
                });
            }

            return series;
        }

        // Simple single value without statistics
        return {
            plotType: 'singleValue',
            timeSeriesData: group.entries.map(entry => ({
                date: new Date(entry.date),
                value: entry.value,
                year: entry.year,
                month: entry.month,
                formattedDate: formatDate(entry.date)
            }))
        };
    } else if (group.type === 'ensemble') {
        // For ensemble data, create multiple plot types
        const ensembleSeries = [];

        // Add individual ensemble lines (if needed for visualization)
        const hasEnsembleValues = group.entries.some(e => e.ensembleValues && e.ensembleValues.length > 0);

        if (hasEnsembleValues) {
            // Get the number of ensemble members
            const numEnsembles = Math.max(...group.entries.map(e => e.ensembleValues?.length || 0));

            // Create series for each ensemble member
            for (let i = 0; i < numEnsembles; i++) {
                ensembleSeries.push({
                    plotType: 'ensemble',
                    ensembleIndex: i,
                    timeSeriesData: group.entries.map(entry => ({
                        date: new Date(entry.date),
                        value: entry.ensembleValues?.[i] || null,
                        year: entry.year,
                        month: entry.month,
                        formattedDate: formatDate(entry.date)
                    }))
                });
            }
        }

        // Add statistics lines (mean, min, max, l95, h95)
        const meanSeries = {
            plotType: 'mean',
            timeSeriesData: group.entries.map(entry => ({
                date: new Date(entry.date),
                value: entry.statistics?.mean || entry.value,
                year: entry.year,
                month: entry.month,
                formattedDate: formatDate(entry.date)
            }))
        };

        const minSeries = {
            plotType: 'min',
            timeSeriesData: group.entries.map(entry => ({
                date: new Date(entry.date),
                value: entry.statistics?.min || null,
                year: entry.year,
                month: entry.month,
                formattedDate: formatDate(entry.date)
            }))
        };

        const maxSeries = {
            plotType: 'max',
            timeSeriesData: group.entries.map(entry => ({
                date: new Date(entry.date),
                value: entry.statistics?.max || null,
                year: entry.year,
                month: entry.month,
                formattedDate: formatDate(entry.date)
            }))
        };

        const l95Series = {
            plotType: 'l95',
            timeSeriesData: group.entries.map(entry => ({
                date: new Date(entry.date),
                value: convertNullValue(entry.statistics?.l95, varType),
                year: entry.year,
                month: entry.month,
                formattedDate: formatDate(entry.date)
            }))
        };

        const h95Series = {
            plotType: 'h95',
            timeSeriesData: group.entries.map(entry => ({
                date: new Date(entry.date),
                value: convertNullValue(entry.statistics?.h95, varType),
                year: entry.year,
                month: entry.month,
                formattedDate: formatDate(entry.date)
            }))
        };

        return [
            ...ensembleSeries,
            minSeries,
            maxSeries,
            l95Series,
            h95Series,
            meanSeries
        ];
    }

    return null;
}

/**
 * Generate chart configuration metadata
 */
function generateChartConfig(series, options) {
    const colorConfig = getColorConfig(options);
    const { varType, adminLevel, dateType } = options;

    // Determine title
    const title = getChartTitle(varType, adminLevel);

    // Determine labels
    const ylabel = getYAxisLabel(varType, colorConfig);
    const xlabel = "Date";

    // Get shaded area configuration for SPI variables
    const shadedAreas = getShadedAreas(varType);

    return {
        title,
        ylabel,
        xlabel,
        shadedAreas,
        colorConfig,
        varType,
        adminLevel,
        dateType
    };
}

/**
 * Get default chart configuration when no data available
 */
function getDefaultChartConfig(options) {
    const colorConfig = getColorConfig(options);
    return generateChartConfig([], options);
}

/**
 * Get chart title based on variable type and admin level
 */
function getChartTitle(varType, adminLevel) {
    const varTypeNames = {
        'SPI1': '1-Month SPI',
        'SPI3': '3-Month SPI',
        'SPI6': '6-Month SPI',
        'SPI12': '12-Month SPI',
        'Prcp': 'Precipitation',
        'Temp': 'Temperature',
        'Yield': 'Rice Yield',
        'Area': 'Rice Area',
        'Production': 'Rice Production'
    };

    const adminLevelNames = {
        'Grid': 'Grid Level',
        'Prov': 'Province Level',
        'Country': 'Country Level'
    };

    const varName = varTypeNames[varType] || varType;
    const levelName = adminLevelNames[adminLevel] || '';

    return `${varName} ${levelName}`.trim();
}

/**
 * Get Y-axis label
 */
function getYAxisLabel(varType, colorConfig) {
    // Override labels for Production and Area to use actual units, not scaled units
    const overrideLabels = {
        'Production': 'Production (ton)',
        'Area': 'Area (ha)'
    };

    if (overrideLabels[varType]) {
        return overrideLabels[varType];
    }

    if (colorConfig && colorConfig.title) {
        return colorConfig.title;
    }

    const labels = {
        'SPI1': 'Drought Index',
        'SPI3': 'Drought Index',
        'SPI6': 'Drought Index',
        'SPI12': 'Drought Index',
        'Prcp': 'Precipitation (mm)',
        'Temp': 'Temperature (°C)',
        'Yield': 'Yield (ton/ha)',
        'Area': 'Area (ha)',
        'Production': 'Production (ton)'
    };

    return labels[varType] || varType;
}

/**
 * Get shaded area configuration for SPI drought indices
 */
function getShadedAreas(varType) {
    if (!varType || !varType.startsWith('SPI')) {
        return null;
    }

    return {
        'Extremely Wet': {
            range: [2, 100],
            color: '#14713d',
            opacity: 0.15
        },
        'Very Wet': {
            range: [1.5, 2],
            color: '#3cb371',
            opacity: 0.15
        },
        'Moderately Wet': {
            range: [1, 1.5],
            color: '#98fb98',
            opacity: 0.15
        },
        'Near Normal': {
            range: [-1, 1],
            color: '#EEE',
            opacity: 0.1
        },
        'Moderately Dry': {
            range: [-1.5, -1],
            color: '#f5deb3',
            opacity: 0.15
        },
        'Severely Dry': {
            range: [-2, -1.5],
            color: '#d2691e',
            opacity: 0.15
        },
        'Extremely Dry': {
            range: [-100, -2],
            color: '#b22222',
            opacity: 0.15
        }
    };
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (month === 1) {
        return `${year}`;
    }
    return `${year}-${month.toString().padStart(2, '0')}`;
}

/**
 * Get year range from series data
 */
export function getYearRange(series) {
    if (!series || series.length === 0) {
        return { startYear: null, endYear: null };
    }

    let minYear = Infinity;
    let maxYear = -Infinity;

    series.forEach(s => {
        if (Array.isArray(s)) {
            // Flattened ensemble series
            s.forEach(innerS => {
                if (innerS.timeSeriesData) {
                    innerS.timeSeriesData.forEach(entry => {
                        if (entry.year) {
                            minYear = Math.min(minYear, entry.year);
                            maxYear = Math.max(maxYear, entry.year);
                        }
                    });
                }
            });
        } else if (s.timeSeriesData) {
            s.timeSeriesData.forEach(entry => {
                if (entry.year) {
                    minYear = Math.min(minYear, entry.year);
                    maxYear = Math.max(maxYear, entry.year);
                }
            });
        }
    });

    return {
        startYear: minYear === Infinity ? null : minYear,
        endYear: maxYear === -Infinity ? null : maxYear
    };
}

/**
 * Filter series data by year range
 */
export function filterSeriesByYearRange(series, startYear, endYear) {
    if (!series || !startYear || !endYear) {
        return series;
    }

    const filterEntry = (entry) => entry.year >= startYear && entry.year <= endYear;

    return series.map(s => {
        if (Array.isArray(s)) {
            // Flattened ensemble series
            return s.map(innerS => ({
                ...innerS,
                timeSeriesData: innerS.timeSeriesData.filter(filterEntry)
            }));
        } else {
            return {
                ...s,
                timeSeriesData: s.timeSeriesData.filter(filterEntry)
            };
        }
    });
}

/**
 * Extract time series from legacy flat format (backward compatibility)
 * Converts old format (y2020, y202504_0, etc.) to new timeSeries format
 */
function extractLegacyTimeSeries(properties) {
    const timeSeriesData = [];
    const dateGroups = {};

    // Group properties by date
    for (const key in properties) {
        if (!key.startsWith('y')) continue;

        const parsed = parseLegacyDateKey(key);
        if (!parsed) continue;

        const { dateStr, year, month, suffix } = parsed;

        if (!dateGroups[dateStr]) {
            dateGroups[dateStr] = {
                year,
                month,
                ensembles: {},
                statistics: {}
            };
        }

        // Categorize the value
        if (suffix === "") {
            // Simple value: y2020 or y202504
            dateGroups[dateStr].value = properties[key];
        } else if (suffix === "mean" || suffix === "min" || suffix === "max" || suffix === "l95" || suffix === "h95") {
            // Statistics
            dateGroups[dateStr].statistics[suffix] = properties[key];
        } else if (!isNaN(parseInt(suffix))) {
            // Ensemble member
            dateGroups[dateStr].ensembles[parseInt(suffix)] = properties[key];
        }
    }

    // Convert grouped data into time series format
    for (const dateStr of Object.keys(dateGroups).sort()) {
        const group = dateGroups[dateStr];
        const entry = {
            date: dateStr,
            year: group.year,
            month: group.month
        };

        // Determine data type
        if (Object.keys(group.ensembles).length > 0) {
            // Ensemble data
            const ensembleValues = Object.keys(group.ensembles)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(i => group.ensembles[i]);

            entry.type = 'ensemble';
            entry.ensembleValues = ensembleValues;

            // Use provided statistics or calculate them
            if (Object.keys(group.statistics).length > 0) {
                entry.statistics = group.statistics;
            } else {
                const values = ensembleValues.filter(v => v !== null && v !== undefined && !isNaN(v));
                if (values.length > 0) {
                    entry.statistics = {
                        mean: values.reduce((sum, v) => sum + v, 0) / values.length,
                        min: Math.min(...values),
                        max: Math.max(...values)
                    };
                }
            }
            entry.value = entry.statistics.mean;
        } else if (group.value !== null && group.value !== undefined) {
            // Single value data
            entry.type = 'single';
            entry.value = group.value;

            // Attach statistics if they exist (e.g., l95, h95 without ensemble members)
            if (Object.keys(group.statistics).length > 0) {
                entry.statistics = group.statistics;
            }
        } else {
            // Skip entries without values
            continue;
        }

        timeSeriesData.push(entry);
    }

    console.log(`[TimeSeriesProcessor] Extracted ${timeSeriesData.length} entries from legacy format`);
    return timeSeriesData;
}

/**
 * Parse legacy property keys (y2020, y202504_0, etc.)
 */
function parseLegacyDateKey(key) {
    // Pattern: y + YYYY or YYYYMM + optional suffix (_0, _mean, etc.)
    const match = /^y(\d{4})(\d{2})?(?:_(.+))?$/.exec(key);

    if (!match) {
        return null;
    }

    const yearStr = match[1];
    const monthStr = match[2];
    const suffix = match[3] || "";

    const year = parseInt(yearStr);
    const month = monthStr ? parseInt(monthStr) : 1;

    // Format date as YYYY-MM-DD
    const dateStr = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-01`;

    return { dateStr, year, month, suffix };
}
