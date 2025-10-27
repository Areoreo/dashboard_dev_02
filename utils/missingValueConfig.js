/**
 * Missing Value Configuration
 *
 * Defines how to identify and handle missing/null values for different variable types.
 * Used for tooltip messages and data processing.
 */

/**
 * Missing value detection configuration by variable type
 */
export const MISSING_VALUE_CONFIG = {
    // Rice Yield - seasonal data, 0 means no harvest in that period
    Yield: {
        isMissing: (value) => value === null || value === undefined || value === 0,
        message: 'No data available due to the rice cropping calendar',
        convertNullTo: 0  // Convert null to 0 for continuous line plotting
    },

    // Rice Area - seasonal data
    Area: {
        isMissing: (value) => value === null || value === undefined || value === 0,
        message: 'No data available due to the rice cropping calendar',
        convertNullTo: 0
    },

    // Rice Production - seasonal data
    Production: {
        isMissing: (value) => value === null || value === undefined || value === 0,
        message: 'No data available due to the rice cropping calendar',
        convertNullTo: 0
    },

    // SPI indices - null means insufficient data for calculation
    SPI1: {
        isMissing: (value) => value === null || value === undefined,
        message: 'Insufficient data for SPI calculation',
        convertNullTo: null  // Keep null for SPI
    },

    SPI3: {
        isMissing: (value) => value === null || value === undefined,
        message: 'Insufficient data for SPI calculation',
        convertNullTo: null
    },

    SPI6: {
        isMissing: (value) => value === null || value === undefined,
        message: 'Insufficient data for SPI calculation',
        convertNullTo: null
    },

    SPI12: {
        isMissing: (value) => value === null || value === undefined,
        message: 'Insufficient data for SPI calculation',
        convertNullTo: null
    },

    // Precipitation - null means no data
    Prcp: {
        isMissing: (value) => value === null || value === undefined,
        message: 'No data available',
        convertNullTo: null
    },

    // Temperature - null means no data
    Temp: {
        isMissing: (value) => value === null || value === undefined,
        message: 'No data available',
        convertNullTo: null
    },

    // Default for unknown variable types
    default: {
        isMissing: (value) => value === null || value === undefined,
        message: 'No data available',
        convertNullTo: null
    }
};

/**
 * Check if a value is missing for a given variable type
 *
 * @param {number|null} value - The value to check
 * @param {string} varType - Variable type (Yield, SPI1, etc.)
 * @returns {boolean} True if value should be considered missing
 */
export function isMissingValue(value, varType) {
    const config = MISSING_VALUE_CONFIG[varType] || MISSING_VALUE_CONFIG.default;
    return config.isMissing(value);
}

/**
 * Get the missing value message for a variable type
 *
 * @param {string} varType - Variable type (Yield, SPI1, etc.)
 * @returns {string} Message to display
 */
export function getMissingValueMessage(varType) {
    const config = MISSING_VALUE_CONFIG[varType] || MISSING_VALUE_CONFIG.default;
    return config.message;
}

/**
 * Get the value to use when converting null for a variable type
 *
 * @param {string} varType - Variable type (Yield, SPI1, etc.)
 * @returns {number|null} Value to use instead of null
 */
export function getNullConversionValue(varType) {
    const config = MISSING_VALUE_CONFIG[varType] || MISSING_VALUE_CONFIG.default;
    return config.convertNullTo;
}

/**
 * Convert null values based on variable type configuration
 * Used for statistics (l95, h95, min, max) to create continuous lines for seasonal data
 *
 * @param {number|null} value - Original value
 * @param {string} varType - Variable type
 * @returns {number|null} Converted value
 */
export function convertNullValue(value, varType) {
    if (value === null || value === undefined) {
        return getNullConversionValue(varType);
    }
    return value;
}
