/**
 * Simplified data processing utilities
 * Replaces the complex, heavily commented ChartDataProcessor
 */

/**
 * Convert legacy GeoJSON properties to unified time series format
 */
export const convertLegacyTimeSeries = (properties) => {
    const timeSeries = [];
    const ensembleData = {};
    
    // Extract all time-related properties
    for (const [key, value] of Object.entries(properties)) {
        if (!key.startsWith('y') || value === null || value === undefined) {
            continue;
        }
        
        // Handle ensemble data (y202504_0, y202504_1, y202504_mean, etc.)
        const ensembleMatch = key.match(/^y(\d{6})_(\w+)$/);
        if (ensembleMatch) {
            const dateStr = ensembleMatch[1];
            const suffix = ensembleMatch[2];
            
            if (!ensembleData[dateStr]) {
                ensembleData[dateStr] = { values: [], stats: {} };
            }
            
            if (suffix.match(/^\d+$/)) {
                ensembleData[dateStr].values.push(parseFloat(value));
            } else if (['mean', 'min', 'max'].includes(suffix)) {
                ensembleData[dateStr].stats[suffix] = parseFloat(value);
            }
            continue;
        }
        
        // Handle regular time series (y2020, y202001)
        const timeMatch = key.match(/^y(\d{4,6})$/);
        if (timeMatch) {
            const dateStr = timeMatch[1];
            let isoDate;
            
            if (dateStr.length === 4) {
                isoDate = `${dateStr}-01-01`;
            } else if (dateStr.length === 6) {
                isoDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-01`;
            } else {
                continue;
            }
            
            timeSeries.push({
                date: isoDate,
                value: parseFloat(value),
                quality: "high"
            });
        }
    }
    
    // Process ensemble data
    for (const [dateStr, data] of Object.entries(ensembleData)) {
        const isoDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-01`;
        
        const entry = { date: isoDate };
        
        if (data.values.length > 0) {
            entry.ensembleValues = data.values.sort((a, b) => a - b);
            entry.statistics = {
                mean: data.stats.mean || data.values.reduce((a, b) => a + b, 0) / data.values.length,
                min: data.stats.min || Math.min(...data.values),
                max: data.stats.max || Math.max(...data.values)
            };
            entry.confidence = 0.85;
        }
        
        timeSeries.push(entry);
    }
    
    // Sort by date
    return timeSeries.sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get the current value for a specific date from time series
 */
export const getValueForDate = (timeSeries, targetDate) => {
    if (!timeSeries || timeSeries.length === 0) return null;
    
    // Find exact match first
    const exactMatch = timeSeries.find(entry => entry.date === targetDate);
    if (exactMatch) {
        return exactMatch.value ?? exactMatch.statistics?.mean ?? null;
    }
    
    // Find closest date
    let closest = timeSeries[0];
    let closestDiff = Math.abs(new Date(targetDate) - new Date(closest.date));
    
    for (const entry of timeSeries) {
        const diff = Math.abs(new Date(targetDate) - new Date(entry.date));
        if (diff < closestDiff) {
            closest = entry;
            closestDiff = diff;
        }
    }
    
    return closest.value ?? closest.statistics?.mean ?? null;
};

/**
 * Format date for display
 */
export const formatDate = (dateString, timeType = 'Monthly') => {
    const date = new Date(dateString);
    
    if (timeType === 'Yearly') {
        return date.getFullYear().toString();
    }
    
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short'
    });
};

/**
 * Validate time series data
 */
export const validateTimeSeries = (timeSeries) => {
    if (!Array.isArray(timeSeries)) return false;
    
    return timeSeries.every(entry => 
        entry.date && 
        (entry.value !== undefined || entry.statistics?.mean !== undefined)
    );
};