/**
 * Simple Time Series Data Processor
 *
 * Converts flat GeoJSON properties (y202506_0, y202506_mean, etc.)
 * into clean time series arrays for chart visualization.
 *
 * Design principles:
 * - Simple, readable code
 * - Single responsibility
 * - Easy to understand and maintain
 */

/**
 * Extract time series data from feature properties
 *
 * @param {Object} properties - GeoJSON feature properties
 * @returns {Array} Array of time series entries
 *
 * Input format (flat properties):
 *   {
 *     "y202506_mean": 1.5,
 *     "y202506_min": 1.0,
 *     "y202506_max": 2.0,
 *     "y202506_0": 1.2,
 *     "y202506_1": 1.4,
 *     ...
 *   }
 *
 * Output format (time series array):
 *   [
 *     {
 *       date: "202506",        // YYYYMM format
 *       year: 2025,
 *       month: 6,
 *       value: 1.5,            // Mean value (primary)
 *       mean: 1.5,
 *       min: 1.0,
 *       max: 2.0,
 *       ensemble: [1.2, 1.4, ...]  // Array of ensemble values
 *     },
 *     ...
 *   ]
 */
export function extractTimeSeries(properties) {
    if (!properties || typeof properties !== 'object') {
        return [];
    }

    // Find all unique dates from property keys
    const datePattern = /^y(\d{4,6})(?:_(.+))?$/;
    const dates = new Set();

    Object.keys(properties).forEach(key => {
        const match = key.match(datePattern);
        if (match) {
            dates.add(match[1]); // Extract YYYY or YYYYMM
        }
    });

    // Convert Set to sorted array
    const sortedDates = Array.from(dates).sort();

    // Process each date
    const timeSeries = sortedDates.map(dateStr => {
        return processDateEntry(dateStr, properties);
    });

    return timeSeries.filter(entry => entry !== null);
}

/**
 * Process a single date entry from properties
 *
 * @param {string} dateStr - Date string (YYYY or YYYYMM)
 * @param {Object} properties - Feature properties
 * @returns {Object|null} Time series entry or null if no data
 */
function processDateEntry(dateStr, properties) {
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = dateStr.length === 6 ? parseInt(dateStr.slice(4, 6), 10) : null;

    // Extract statistics
    const mean = properties[`y${dateStr}_mean`];
    const min = properties[`y${dateStr}_min`];
    const max = properties[`y${dateStr}_max`];

    // Extract ensemble members
    const ensemble = extractEnsembleMembers(dateStr, properties);

    // Extract simple value (for historical data without ensembles)
    const simpleValue = properties[`y${dateStr}`];

    // Determine primary value: mean > simple value > null
    const value = mean !== undefined ? mean : simpleValue;

    // Only create entry if we have some data
    if (value === undefined && ensemble.length === 0) {
        return null;
    }

    return {
        date: dateStr,
        year,
        month,
        formattedDate: formatDate(year, month),
        value: parseFloat(value) || null,
        mean: mean !== undefined ? parseFloat(mean) : null,
        min: min !== undefined ? parseFloat(min) : null,
        max: max !== undefined ? parseFloat(max) : null,
        ensembleMembers: ensemble.length > 0 ? ensemble.map((val, idx) => ({ ensemble: idx, value: val })) : null
    };
}

/**
 * Extract ensemble member values for a date
 *
 * @param {string} dateStr - Date string (YYYY or YYYYMM)
 * @param {Object} properties - Feature properties
 * @returns {Array} Array of ensemble values
 */
function extractEnsembleMembers(dateStr, properties) {
    const ensemble = [];
    let index = 0;

    // Keep extracting while ensemble members exist
    while (properties.hasOwnProperty(`y${dateStr}_${index}`)) {
        const value = properties[`y${dateStr}_${index}`];
        ensemble.push(parseFloat(value));
        index++;
    }

    return ensemble;
}

/**
 * Detect data type from time series
 *
 * @param {Array} timeSeries - Time series array
 * @returns {string} Data type: 'ensemble', 'monthly', 'yearly', or 'empty'
 */
export function detectDataType(timeSeries) {
    if (!timeSeries || timeSeries.length === 0) {
        return 'empty';
    }

    // Check if any entry has ensemble data
    const hasEnsemble = timeSeries.some(entry => entry.ensembleMembers && entry.ensembleMembers.length > 0);
    if (hasEnsemble) {
        return 'ensemble';
    }

    // Check if data has monthly resolution
    const hasMonthlyData = timeSeries.some(entry => entry.month !== null);
    if (hasMonthlyData) {
        return 'monthly';
    }

    return 'yearly';
}

/**
 * Format date for display
 *
 * @param {number} year - Year
 * @param {number|null} month - Month (1-12) or null for yearly
 * @returns {string} Formatted date string
 */
export function formatDate(year, month = null) {
    if (month) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[month - 1]} ${year}`;
    }

    return `${year}`;
}

/**
 * Get year range from time series
 *
 * @param {Array} timeSeries - Time series array
 * @returns {Object} {startYear, endYear}
 */
export function getYearRange(timeSeries) {
    if (!timeSeries || timeSeries.length === 0) {
        return { startYear: null, endYear: null };
    }

    const years = timeSeries.map(entry => entry.year);
    return {
        startYear: Math.min(...years),
        endYear: Math.max(...years)
    };
}

/**
 * Filter time series by year range
 *
 * @param {Array} timeSeries - Time series array
 * @param {number} startYear - Start year (inclusive)
 * @param {number} endYear - End year (inclusive)
 * @returns {Array} Filtered time series
 */
export function filterByYearRange(timeSeries, startYear, endYear) {
    if (!timeSeries || !startYear || !endYear) {
        return timeSeries;
    }

    return timeSeries.filter(entry =>
        entry.year >= startYear && entry.year <= endYear
    );
}
