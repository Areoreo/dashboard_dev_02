/**
 * Unified Color Map Configuration
 *
 * This file defines all color mapping parameters for different variable types and admin levels.
 * Each configuration specifies:
 * - minValue: Minimum value for color scaling
 * - maxValue: Maximum value for color scaling
 * - colormapType: 'continuous' or 'discrete'
 * - colorType: 'rgbColorCode', 'hueVector', or 'rgbVector'
 * - colorSeries: Array of colors (format depends on colorType)
 * - legendGrades: Values to show in legend
 * - legendLabels: Optional labels for discrete scales
 * - unit: Display unit for the variable
 */

export const COLOR_MAP_CONFIGS = {
    // ==================== SPI (Drought Indices) ====================
    SPI: {
        minValue: -3,
        maxValue: 3,
        colormapType: "discrete",
        colorType: "rgbColorCode",
        colorSeries: [
            "#b22222", // D3 - Extremely dry
            "#d2691e", // D2 - Severely dry
            "#f5deb3", // D1 - Moderately dry
            "#EEE", // D0 - Near normal
            "#98fb98", // W1 - Moderately wet
            "#3cb371", // W2 - Very wet
            "#14713d" // W3 - Extremely wet
        ],
        thresholds: [-2, -1.5, -1, 0, 1, 1.5, 2],
        legendGrades: [2, 1.5, 1, 0, -1, -1.5, -2],
        legendLabels: [
            "Extremely Dry",
            "Severely Dry",
            "Moderately Dry",
            "Near Normal",
            "Moderately Wet",
            "Very Wet",
            "Extremely Wet"
        ],
        title: "Drought Index",
        unit: "",
        className: "legend-SPI"
    },

    // ==================== Precipitation ====================
    PrcpGrid: {
        minValue: 0,
        maxValue: 1000,
        colormapType: "continuous",
        colorType: "hueVector",
        hueRange: [200, 0], // Blue to Red
        saturation: 100,
        lightness: 50,
        legendGrades: [0, 200, 400, 600, 800, 1000],
        title: "Precipitation (mm)",
        unit: "mm"
    },

    PrcpProv: {
        minValue: 0,
        maxValue: 3000,
        colormapType: "continuous",
        colorType: "hueVector",
        hueRange: [200, 0],
        saturation: 100,
        lightness: 50,
        legendGrades: [0, 600, 1200, 1800, 2400, 3000],
        title: "Precipitation (mm)",
        unit: "mm"
    },

    PrcpProvMonthly: {
        minValue: 0,
        maxValue: 500,
        colormapType: "continuous",
        colorType: "hueVector",
        hueRange: [200, 0],
        saturation: 100,
        lightness: 50,
        legendGrades: [0, 100, 200, 300, 400, 500],
        title: "Precipitation (mm)",
        unit: "mm"
    },

    PrcpCountry: {
        minValue: 0,
        maxValue: 3000,
        colormapType: "continuous",
        colorType: "hueVector",
        hueRange: [200, 0],
        saturation: 100,
        lightness: 50,
        legendGrades: [0, 600, 1200, 1800, 2400, 3000],
        title: "Precipitation (mm)",
        unit: "mm"
    },

    PrcpCountryMonthly: {
        minValue: 0,
        maxValue: 500,
        colormapType: "hueVector",
        hueRange: [200, 0],
        saturation: 100,
        lightness: 50,
        legendGrades: [0, 100, 200, 300, 400, 500],
        title: "Precipitation (mm)",
        unit: "mm"
    },

    // ==================== Temperature ====================
    Temp: {
        minValue: 10,
        maxValue: 35,
        colormapType: "continuous",
        colorType: "rgbColorCode",
        colorSeries: [
            "#08306B", // 10°C - Dark Blue (Cold)
            "#4292C6", // 15°C - Light Blue (Cool)
            "#41AB5D", // 20°C - Green (Mild)
            "#F7DC6F", // 25°C - Yellow (Warm)
            "#E67E22", // 30°C - Orange (Hot)
            "#C0392B" // 35°C - Red (Very hot)
        ],
        legendGrades: [10, 15, 20, 25, 30, 35],
        title: "Temperature (℃)",
        unit: "°C"
    },

    // ==================== Yield ====================
    YieldGrid: {
        minValue: 1,
        maxValue: 5,
        colormapType: "continuous",
        colorType: "rgbColorCode",
        colorSeries: [
            "#F8FF96", // Very light yellow-green
            "#F0F09A", // Light yellow-green
            "#C9EC77", // Yellow-green
            "#addd8e", // Light green
            "#78c679", // Medium green
            "#41ab5d", // Dark green
            "#238443", // Darker green
            "#005a32" // Darkest green
        ],
        legendGrades: [1, 2, 3, 4, 5],
        title: "Yield (ton/ha)",
        unit: "ton/ha"
    },

    YieldProv: {
        minValue: 1,
        maxValue: 7,
        colormapType: "continuous",
        colorType: "rgbColorCode",
        colorSeries: [
            "#F8FF96",
            "#F0F09A",
            "#C9EC77",
            "#addd8e",
            "#78c679",
            "#41ab5d",
            "#238443",
            "#005a32"
        ],
        legendGrades: [1, 3, 5, 7],
        title: "Yield (ton/ha)",
        unit: "ton/ha"
    },

    YieldCountry: {
        minValue: 1,
        maxValue: 7,
        colormapType: "continuous",
        colorType: "rgbColorCode",
        colorSeries: [
            "#F8FF96",
            "#F0F09A",
            "#C9EC77",
            "#addd8e",
            "#78c679",
            "#41ab5d",
            "#238443",
            "#005a32"
        ],
        legendGrades: [1, 3, 5, 7],
        title: "Yield (ton/ha)",
        unit: "ton/ha"
    },

    // ==================== Area ====================
    AreaGrid: {
        minValue: 0,
        maxValue: 10000,
        colormapType: "continuous",
        colorType: "hueVector",
        hueRange: [40, 120], // Orange to Green
        saturation: 80,
        lightness: 50,
        legendGrades: [0, 2500, 5000, 7500, 10000],
        title: "Rice Area (ha)",
        unit: "ha"
    },

    AreaProv: {
        minValue: 0,
        maxValue: 500000,
        colormapType: "continuous",
        colorType: "hueVector",
        hueRange: [40, 120],
        saturation: 80,
        lightness: 50,
        legendGrades: [0, 125000, 250000, 375000, 500000],
        legendGradesDisplay: [0, 100, 200, 300, 400, 500], // Display in thousands
        title: "Rice Area (k ha)",
        unit: "ha"
    },

    AreaCountry: {
        minValue: 2000000,
        maxValue: 10000000,
        colormapType: "continuous",
        colorType: "hueVector",
        hueRange: [40, 120],
        saturation: 80,
        lightness: 50,
        legendGrades: [2000000, 4000000, 5000000, 8000000, 10000000],
        legendGradesDisplay: [2, 4, 5, 8, 10], // Display in millions
        title: "Rice Area (million ha)",
        unit: "ha"
    },

    // ==================== Production ====================
    ProductionGrid: {
        minValue: 0,
        maxValue: 10000,
        colormapType: "continuous",
        colorType: "hueVector",
        hueRange: [30, 120],
        saturation: 100,
        lightness: 40,
        legendGrades: [0, 2500, 5000, 7500, 10000],
        title: "Production (ton)",
        unit: "ton"
    },

    ProductionProv: {
        minValue: 0,
        maxValue: 2000000,
        colormapType: "continuous",
        colorType: "hueVector",
        hueRange: [30, 120],
        saturation: 100,
        lightness: 40,
        legendGrades: [0, 500000, 1000000, 1500000, 2000000],
        legendGradesDisplay: [0, 0.5, 1, 1.5, 2], // Display in millions
        title: "Production (million ton)",
        unit: "ton"
    },

    ProductionCountry: {
        minValue: 0,
        maxValue: 10000000,
        colormapType: "continuous",
        colorType: "hueVector",
        hueRange: [30, 120],
        saturation: 100,
        lightness: 40,
        legendGrades: [0, 2500000, 5000000, 7500000, 10000000],
        legendGradesDisplay: [0, 2.5, 5, 7.5, 10], // Display in millions
        title: "Production (million ton)",
        unit: "ton"
    },

    // ==================== Soil Moisture ====================
    smpct1: {
        minValue: 0,
        maxValue: 1,
        colormapType: "discrete",
        colorType: "rgbColorCode",
        colorSeries: [
            "#8c510a", // D3/D4 - Extreme/Exceptional Drought
            "#bf812d", // D2 - Severe Drought
            "#dfc27d", // D1 - Moderate Drought
            "#f6e8c3", // D0 - Abnormally Dry
            "#f5f5f5", // No Drought (Normal)
            "#c7eae5", // Slightly Wet
            "#80cdc1" // Somewhat Wet
        ],
        thresholds: [0, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
        legendGrades: [0, 25, 50, 75, 100],
        legendLabels: [
            "Extreme Drought",
            "Severe Drought",
            "Moderate Drought",
            "Abnormally Dry",
            "Near Normal",
            "Slightly Wet",
            "Very Wet"
        ],
        title: "Soil Moisture Percentile",
        unit: "%",
        className: "legend-smpct1"
    },

    // ==================== Yield Anomaly ====================
    yieldAnom: {
        minValue: -5.0,
        maxValue: 5.0,
        colormapType: "discrete",
        colorType: "rgbColorCode",
        colorSeries: [
            "#a50026", // Significantly Below Normal
            "#f46d43", // Moderately Below Normal
            "#d9d9d9", // Near Normal
            "#74add1", // Moderately Above Normal
            "#1a9850" // Significantly Above Normal
        ],
        thresholds: [-5.0, -1.199, -0.3995, 0.4001, 1.1987, 5.0],
        legendGrades: [1.5, 0.3, -0.3, -1.199, -5],
        legendLabels: [
            "Significantly Above Normal",
            "Moderately Above Normal",
            "Near Normal",
            "Moderately Below Normal",
            "Significantly Below Normal"
        ],
        title: "Yield Anomaly (Z-score)",
        unit: "",
        className: "legend-yieldAnom"
    }
};

/**
 * Get color map configuration key based on varType and adminLevel
 */
export function getColorMapKey(varType, adminLevel, dateType) {
    // SPI indices
    if (varType?.startsWith("SPI")) {
        return "SPI";
    }

    // Precipitation
    if (varType === "Prcp") {
        if (adminLevel === "Grid") {
            return "PrcpGrid";
        } else if (adminLevel === "Prov") {
            return dateType === "Monthly" ? "PrcpProvMonthly" : "PrcpProv";
        } else if (adminLevel === "Country") {
            return dateType === "Monthly"
                ? "PrcpCountryMonthly"
                : "PrcpCountry";
        }
    }

    // Temperature
    if (varType === "Temp") {
        return "Temp";
    }

    // Yield
    if (varType === "Yield") {
        if (adminLevel === "Grid") return "YieldGrid";
        if (adminLevel === "Prov") return "YieldProv";
        if (adminLevel === "Country") return "YieldCountry";
    }

    // Area
    if (varType === "Area") {
        if (adminLevel === "Grid") return "AreaGrid";
        if (adminLevel === "Prov") return "AreaProv";
        if (adminLevel === "Country") return "AreaCountry";
    }

    // Production
    if (varType === "Production") {
        if (adminLevel === "Grid") return "ProductionGrid";
        if (adminLevel === "Prov") return "ProductionProv";
        if (adminLevel === "Country") return "ProductionCountry";
    }

    // Soil Moisture
    if (varType === "smpct1") {
        return "smpct1";
    }

    // Yield Anomaly
    if (varType === "yieldAnom") {
        return "yieldAnom";
    }

    // Default fallback
    return "YieldProv";
}

/**
 * Get color configuration for a given set of options
 */
export function getColorConfig(options) {
    const { varType, adminLevel, dateType } = options;
    const key = getColorMapKey(varType, adminLevel, dateType);
    return COLOR_MAP_CONFIGS[key] || COLOR_MAP_CONFIGS["YieldProv"];
}
