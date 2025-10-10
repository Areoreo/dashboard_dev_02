import React from "react";
import { getColorConfig } from "@utils/colorMapConfig";

/**
 * Unified Map Legend Component (Version 2)
 *
 * This component generates legends dynamically based on color configuration.
 * It receives 'options' to determine which color scale to display.
 */
export const MapLegend = ({ options, selectedDate }) => {
    // Validate options
    if (!options || !options.varType) {
        console.warn("MapLegend: No options provided");
        return null;
    }

    // Get color configuration based on options
    const colorConfig = getColorConfig(options);

    if (!colorConfig) {
        console.warn("MapLegend: No color config found for options:", options);
        return null;
    }

    // Format date for display (optional - can be removed if not needed)
    const formatDateDisplay = (selectedDate) => {
        if (!selectedDate) return "Unknown Date";

        const year = selectedDate.slice(0, 4);
        const month =
            selectedDate.length >= 6 ? selectedDate.slice(4, 6) : null;
        const day = selectedDate.length === 8 ? selectedDate.slice(6, 8) : null;

        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];
        const monthFormatted = month ? monthNames[parseInt(month, 10) - 1] : "";

        if (selectedDate.length === 4) {
            return `${year}`;
        } else if (selectedDate.length === 6) {
            return `${monthFormatted}, ${year}`;
        } else if (selectedDate.length === 8) {
            return `${monthFormatted} ${parseInt(day, 10)}, ${year}`;
        }

        return "Invalid Date";
    };

    // Determine if this is a discrete or continuous scale
    const isDiscrete =
        colorConfig.colormapType === "discrete" && colorConfig.legendLabels;

    // Get display grades (use legendGradesDisplay if available, otherwise legendGrades)
    const displayGrades =
        colorConfig.legendGradesDisplay || colorConfig.legendGrades;

    return (
        <div
            className={`legend-container ${
                colorConfig.className || "legend-default"
            }`}
        >
            <div className="legend-title">{colorConfig.title}</div>

            {isDiscrete ? (
                /* Discrete legend with labeled color swatches */
                <div className="legend-items">
                    {colorConfig.legendLabels.map((label, i) => {
                        // Get tooltip text for this label based on current varType
                        const tooltipText = getTooltipText(
                            options.varType,
                            label
                        );

                        return (
                            <div key={i} className="legend-item">
                                {/* Color swatch */}
                                <div
                                    className="color-box"
                                    style={{
                                        backgroundColor:
                                            colorConfig.colorSeries[i]
                                    }}
                                ></div>

                                {/* Label text */}
                                <span className="legend-text">
                                    {tooltipText ? (
                                        <span className="legend-label-with-tooltip">
                                            {label}
                                            <span className="legend-tooltip">
                                                {tooltipText}
                                            </span>
                                        </span>
                                    ) : (
                                        label
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Continuous legend with gradient bar */
                <div className="legend-gradient-container">
                    <div
                        className="legend-gradient"
                        style={{
                            background: `linear-gradient(to right, ${generateGradientColors(
                                colorConfig
                            ).join(", ")})`
                        }}
                    ></div>
                    <div className="legend-labels">
                        {displayGrades.map((grade, i) => (
                            <span key={i}>{grade}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Generate gradient colors for continuous scales
 */
function generateGradientColors(config) {
    const { colorType, colorSeries, hueRange, saturation, lightness } = config;

    if (colorType === "rgbColorCode" && colorSeries) {
        // Use colorSeries directly
        return colorSeries;
    } else if (colorType === "hueVector" && hueRange) {
        // Generate HSL colors from hue range
        const [minHue, maxHue] = hueRange;
        const steps = 5; // Number of gradient steps
        const colors = [];

        for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            const hue = minHue + ratio * (maxHue - minHue);
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }

        return colors;
    }

    // Fallback
    return ["#CCCCCC", "#999999"];
}

/**
 * Tooltip texts for discrete legends, organized by variable type
 * Structure: { [varType]: { [label]: "description" } }
 */
const TOOLTIP_TEXTS_BY_VAR_TYPE = {
    // SPI (Standardized Precipitation Index) - All SPI variants use same tooltips
    SPI: {
        "Extremely Dry": "Major crop losses, widespread water shortages.",
        "Severely Dry":
            "Severe Drought: Likely crop loss, water restrictions may be needed.",
        "Moderately Dry":
            "Some damage to crops, low streamflow, water shortages possible.",
        "Near Normal": "Typical climate conditions, no significant anomalies.",
        "Moderately Wet":
            "Above-normal precipitation, beneficial for agriculture.",
        "Very Wet":
            "High rainfall, increased runoff, risk of localized flooding.",
        "Extremely Wet":
            "Unusual flooding, excessive soil moisture, potential waterlogging."
    },

    // Soil Moisture Percentile
    smpct1: {
        "Extreme Drought":
            "Soil moisture at critical levels, severe agricultural impact.",
        "Severe Drought": "Very low soil moisture, crop stress expected.",
        "Moderate Drought": "Below-normal soil moisture, some crop impact.",
        "Abnormally Dry": "Slightly dry conditions, minimal impact.",
        "Near Normal": "Normal soil moisture levels.",
        "Slightly Wet": "Above-normal soil moisture, beneficial for crops.",
        "Very Wet": "High soil moisture, potential for waterlogging."
    },

    // Yield Anomaly (Z-score)
    yieldAnom: {
        "Significantly Above Normal":
            "Crop yield is significantly above average, among the top 20% of all years.",
        "Moderately Above Normal":
            "Crop yield is higher than usual, among the top 20% to 40% of all years.",
        "Near Normal":
            "Crop yield is close to the historical average, within the middle 20% of all years.",
        "Moderately Below Normal":
            "Crop yield is lower than average, among the bottom 20% to 40% of all years.",
        "Significantly Below Normal":
            "Crop yield is significantly below average, among the lowest 20% of all years."
    }
};

/**
 * Get tooltip text for a specific label based on variable type
 */
function getTooltipText(varType, label) {
    // Check if varType starts with "SPI" (handles SPI1, SPI3, SPI6, SPI12, etc.)
    const varTypeKey = varType?.startsWith("SPI") ? "SPI" : varType;

    const tooltipSet = TOOLTIP_TEXTS_BY_VAR_TYPE[varTypeKey];
    return tooltipSet ? tooltipSet[label] : null;
}

export default MapLegend;
