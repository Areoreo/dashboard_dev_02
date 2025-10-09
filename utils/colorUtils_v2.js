/**
 * Unified Color Utility Functions (Version 2)
 *
 * This is a complete refactor of the color system with:
 * - Unified getColor() function
 * - Configuration-driven color mapping
 * - Support for continuous and discrete color scales
 * - Multiple color type support (RGB, HSL, HEX)
 */

import { COLOR_MAP_CONFIGS, getColorConfig } from './colorMapConfig';

/**
 * Main unified color function
 * @param {number} value - The value to map to a color
 * @param {object} options - Options object with varType, adminLevel, dateType
 * @returns {string} - Color string (format depends on configuration)
 */
export function getColor(value, options = {}) {
    // Handle invalid values
    if (
        value === undefined ||
        value === null ||
        value < -9999 ||
        isNaN(value)
    ) {
        return "#FFFFFF"; // White for no data
    }

    // Get color configuration
    const config = getColorConfig(options);

    if (!config) {
        console.warn(`No color configuration found for`, options);
        return "#CCCCCC"; // Default gray
    }

    // Route to appropriate color mapping function
    if (config.colormapType === 'discrete') {
        return getDiscreteColor(value, config);
    } else {
        return getContinuousColor(value, config);
    }
}

/**
 * Get color for discrete/categorical scales
 */
function getDiscreteColor(value, config) {
    const { thresholds, colorSeries } = config;

    if (!thresholds || !colorSeries) {
        console.warn('Discrete color config missing thresholds or colorSeries');
        return "#CCCCCC";
    }

    // Find which threshold bin the value falls into
    for (let i = 0; i < thresholds.length - 1; i++) {
        if (value > thresholds[i] && value <= thresholds[i + 1]) {
            return colorSeries[i];
        }
    }

    // Fallback for values outside range
    if (value <= thresholds[0]) return colorSeries[0];
    if (value >= thresholds[thresholds.length - 1]) return colorSeries[colorSeries.length - 1];

    return "#CCCCCC";
}

/**
 * Get color for continuous scales
 */
function getContinuousColor(value, config) {
    const { minValue, maxValue, colorType } = config;

    // Clamp value to range
    const clampedValue = Math.max(minValue, Math.min(maxValue, value));

    // Calculate normalized position [0, 1]
    const ratio = (clampedValue - minValue) / (maxValue - minValue);

    // Route to appropriate color generation method
    if (colorType === 'hueVector') {
        return getHueVectorColor(ratio, config);
    } else if (colorType === 'rgbVector') {
        return getRgbVectorColor(ratio, config);
    } else if (colorType === 'rgbColorCode') {
        return getRgbColorCodeColor(ratio, config);
    }

    console.warn('Unknown colorType:', colorType);
    return "#CCCCCC";
}

/**
 * Generate color from HSL hue range
 * e.g., hueRange: [40, 120] means orange (40°) to green (120°)
 */
function getHueVectorColor(ratio, config) {
    const { hueRange, saturation = 100, lightness = 50 } = config;

    if (!hueRange || hueRange.length !== 2) {
        console.warn('Invalid hueRange:', hueRange);
        return "#CCCCCC";
    }

    const [minHue, maxHue] = hueRange;
    const hue = minHue + ratio * (maxHue - minHue);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generate color from RGB vector interpolation
 * e.g., rgbRange: [[255,0,0], [0,255,0]] means red to green
 */
function getRgbVectorColor(ratio, config) {
    const { rgbRange } = config;

    if (!rgbRange || rgbRange.length !== 2) {
        console.warn('Invalid rgbRange:', rgbRange);
        return "#CCCCCC";
    }

    const [rgb1, rgb2] = rgbRange;
    const r = Math.round(rgb1[0] + ratio * (rgb2[0] - rgb1[0]));
    const g = Math.round(rgb1[1] + ratio * (rgb2[1] - rgb1[1]));
    const b = Math.round(rgb1[2] + ratio * (rgb2[2] - rgb1[2]));

    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generate color by interpolating between hex color codes
 * Finds appropriate segment in colorSeries and interpolates
 */
function getRgbColorCodeColor(ratio, config) {
    const { colorSeries } = config;

    if (!colorSeries || colorSeries.length < 2) {
        console.warn('Invalid colorSeries:', colorSeries);
        return "#CCCCCC";
    }

    // Find which segment of the color series to use
    const segmentCount = colorSeries.length - 1;
    const segmentIndex = Math.floor(ratio * segmentCount);
    const segmentRatio = (ratio * segmentCount) - segmentIndex;

    // Handle edge case where ratio = 1.0
    if (segmentIndex >= segmentCount) {
        return colorSeries[colorSeries.length - 1];
    }

    const color1 = colorSeries[segmentIndex];
    const color2 = colorSeries[segmentIndex + 1];

    return interpolateHexColors(color1, color2, segmentRatio);
}

/**
 * Interpolate between two hex colors
 */
function interpolateHexColors(color1, color2, factor) {
    if (factor > 1) factor = 1;
    if (factor < 0) factor = 0;

    // Parse hex colors
    const c1 = parseInt(color1.replace('#', ''), 16);
    const c2 = parseInt(color2.replace('#', ''), 16);

    const r1 = (c1 >> 16) & 255;
    const g1 = (c1 >> 8) & 255;
    const b1 = c1 & 255;

    const r2 = (c2 >> 16) & 255;
    const g2 = (c2 >> 8) & 255;
    const b2 = c2 & 255;

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Get center coordinates for a GeoJSON feature
 */
export function getFeatureCenter(feature) {
    // Check if feature has a centroid property
    if (feature.properties?.centroid) {
        const [lon, lat] = feature.properties.centroid;
        return [lat, lon]; // Leaflet uses [lat, lon] format
    }

    // If no centroid is provided, calculate the center of the feature
    try {
        // For MultiPolygon or Polygon geometries
        if (feature.geometry.type === "MultiPolygon") {
            const coords = feature.geometry.coordinates[0][0];
            let lat = 0, lon = 0;
            coords.forEach((point) => {
                lon += point[0];
                lat += point[1];
            });
            return [lat / coords.length, lon / coords.length];
        } else if (feature.geometry.type === "Polygon") {
            const coords = feature.geometry.coordinates[0];
            let lat = 0, lon = 0;
            coords.forEach((point) => {
                lon += point[0];
                lat += point[1];
            });
            return [lat / coords.length, lon / coords.length];
        } else if (feature.geometry.type === "Point") {
            const [lon, lat] = feature.geometry.coordinates;
            return [lat, lon];
        }
    } catch (e) {
        console.error("Error calculating feature center:", e);
    }

    return [0, 0];
}

/**
 * Get threshold values for warning/alert system
 */
export function getThresholds(options) {
    const { varType, adminLevel, dateType } = options;

    // Default thresholds structure
    const defaultThresholds = {
        high: null,
        low: null,
        unit: "",
        highMessage: "",
        lowMessage: ""
    };

    // SPI variables (drought indices)
    if (varType?.startsWith("SPI")) {
        return {
            high: 1.99,
            low: -1.99,
            unit: "",
            highMessage: "Extremely wet conditions",
            lowMessage: "Severe drought conditions"
        };
    }

    // Precipitation thresholds
    if (varType === "Prcp") {
        if (dateType === "Monthly") {
            return {
                high: 700,
                low: -5,
                unit: "mm",
                highMessage: "High precipitation",
                lowMessage: "Low precipitation"
            };
        } else {
            return {
                high: 3000,
                low: 200,
                unit: "mm",
                highMessage: "Annual precipitation above normal range",
                lowMessage: "Annual precipitation below normal range"
            };
        }
    }

    // Temperature thresholds
    if (varType === "Temp") {
        return {
            high: 35,
            low: 5,
            unit: "°C",
            highMessage: "High temperature",
            lowMessage: "Low temperature"
        };
    }

    // Soil moisture thresholds
    if (varType === "smpct1") {
        return {
            high: 75,
            low: 25,
            unit: "%",
            highMessage: "High soil moisture",
            lowMessage: "Low soil moisture"
        };
    }

    // Yield anomaly thresholds
    if (varType === "yieldAnom") {
        return {
            high: 4.99,
            low: -4.99,
            unit: "",
            highMessage: "High yield anomaly",
            lowMessage: "Low yield anomaly"
        };
    }

    return defaultThresholds;
}

// Export color config getter for use in legend
export { getColorConfig } from './colorMapConfig';
