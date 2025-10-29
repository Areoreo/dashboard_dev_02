/**
 * Utility functions for the ChartComponent
 */

import { color } from "d3";

// // Format date string from year and month
// export const formatDateString = (year, month) => {
//     if (!month) return `${year}`;

//     const monthNames = [
//         'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
//         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
//     ];

//     return `${monthNames[month-1]} ${year}`;
// };

// Format date string from year and month with splitting symbol
export const formatDateString = (year, month) => {
    if (!month) return `${year}`;

    // Use dot as splitting symbol between year and month
    // return `${year}.${String(month).padStart(2, '0')}`;
    return `${String(year)}${String(month)}`;
};

// // Format date string from year and month with splitting symbol
// export const formatDateString = (year, month) => {
//     if (!month) return `${year}`;

//     // Use dot as splitting symbol between year and month
//     return `${year}.${String(month).padStart(2, '0')}`;
// };

// Determine the appropriate time unit based on the data points
export const determineTimeUnit = (dataPoints) => {
    if (!dataPoints || dataPoints.length < 2) return "month";

    // Check if all data points have the same year
    const allSameYear = dataPoints.every((d) => d.year === dataPoints[0].year);

    // If all in the same year, use 'month' as the unit
    if (allSameYear) return "month";

    // Calculate the time span
    const years = [...new Set(dataPoints.map((d) => d.year))];

    // If the span is larger than 10 years, use 'year'
    if (years.length > 10) return "year";

    // Otherwise, use 'month' or 'quarter' depending on data density
    return dataPoints.length / years.length > 4 ? "month" : "quarter";
};

// Get appropriate chart title based on options
export const getChartTitle = (options) => {
    let title = "";

    if (options && options.varType) {
        if (options.varType.startsWith("SPI")) {
            title = `Drought Index (${options.varType.slice(3)} month${
                options.varType.slice(3) > 1 ? "s" : ""
            })`;
        } else if (options.varType === "Yield") {
            title = "Rice Yield";
        } else if (options.varType === "Prcp") {
            title = "Precipitation";
        } else if (options.varType === "Temp") {
            title = "Temperature";
        } else if (options.varType === "Area") {
            title = "Rice Area";
        } else if (options.varType === "Production") {
            title = "Rice Production";
        } else if (options.varType === "smpct1") {
            title = "Soil Moisture Percentile";
        } else {
            title = options.varType;
        }
    }

    return title;
};

// Get appropriate y-axis label
export const getYAxisLabel = (options) => {
    if (!options || !options.varType) return "Value";

    switch (options.varType) {
        case "SPI1":
        case "SPI3":
        case "SPI6":
        case "SPI12":
            return `Drought Index Value`;
        case "Yield":
            return "Yield (ton/ha)";
        case "Area":
            return "Area (ha)";
        case "Production":
            return "Production (ton)";
        case "Prcp":
            return "Precipitation (mm)";
        case "Temp":
            return "Temperature (°C)";
        case "smpct1":
            return "Soil Moisture Percentile";
        default:
            return "Value";
    }
};

// Get appropriate dataset label
export const getChartLabel = (options) => {
    if (!options || !options.varType) return "Value";

    switch (options.varType) {
        case "SPI1":
        case "SPI3":
        case "SPI6":
        case "SPI12":
            return `${options.varType} Value`;
        case "Yield":
            return "Rice Yield";
        case "Area":
            return "Rice Area";
        case "Production":
            return "Rice Production";
        case "Prcp":
            return "Precipitation";
        case "Temp":
            return "Temperature";
        default:
            return options.varType;
    }
};

// Create background coloring plugin for SPI charts
export const createBackgroundPlugin = (options) => {
    return {
        id: "customBackgroundColors",
        beforeDraw: (chart) => {
            const { ctx, chartArea, scales } = chart;
            if (!chartArea || !scales.y) return;

            // Only apply for SPI charts
            if (
                !options ||
                !options.varType ||
                !options.varType.startsWith("SPI")
            )
                return;

            const { top, bottom, left, right } = chartArea;
            const yScale = scales.y;

            // Draw colored background zones

            // Extremely wet zone (> 2): green
            const y2 = yScale.getPixelForValue(2);
            ctx.fillStyle = "rgba(20, 113, 61, 0.25)";
            ctx.fillRect(left, top, right - left, y2 - top);

            // Moderately wet zone (1-2): light green
            const y1 = yScale.getPixelForValue(1);
            ctx.fillStyle = "rgba(152, 238, 152, 0.3)";
            ctx.fillRect(left, y2, right - left, y1 - y2);

            // Moderately dry zone (-1 to -2): light red
            const ym1 = yScale.getPixelForValue(-1);
            const ym2 = yScale.getPixelForValue(-2);
            ctx.fillStyle = "rgba(245, 222, 179, 0.3)";
            ctx.fillRect(left, ym1, right - left, ym2 - ym1);

            // Extremely dry zone (< -2): red
            ctx.fillStyle = "rgba(178, 34, 34, 0.3)";
            ctx.fillRect(left, ym2, right - left, bottom - ym2);
        }
    };
};

// Generate a random but consistent color for ensemble members
export const getEnsembleColor = (member) => {
    // Use the member number to generate a color with golden ratio to spread colors
    // const hue = (member * 137) % 360;
    const hue = 240 % 360;
    return `hsla(${hue}, 70%, 50%, 0.3)`; // Light, semi-transparent colors
};

// Create common chart options
export const createChartOptions = (
    title,
    yAxisLabel,
    useTimeScale,
    timeUnit,
    isEnsemble
) => {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: title,
                font: { size: 18, weight: "bold" },
                padding: { top: 10, bottom: 20 }
            },
            legend: isEnsemble // if it is Ensemble (forecast), only show legend labels for statistic curves
                ? {
                      display: true,
                      position: "top",
                      labels: {
                          font: { size: 15 },
                          // color: 'black',
                          // For ensemble charts, only show statistical lines
                          filter: isEnsemble
                              ? (legendItem) =>
                                    !legendItem.text.startsWith("Ensemble")
                              : undefined,
                          usePointStyle: false,
                          boxWidth: 40,
                          boxHeight: 2
                      }
                  } // if it is not Ensemble (forecast), do not show legend labels
                : {
                      display: false,
                      position: "top"
                  }
        },
        interaction: {
            mode: "nearest",
            intersect: false
        },
        scales: {
            x: {
                type: "time",
                time: {
                    unit: timeUnit,
                    displayFormats: {
                        day: "MMM d, yyyy",
                        month: "yyyy.MM", // Update format here
                        quarter: "yyyy.MM", // Update format here
                        year: "yyyy"
                    },
                    tooltipFormat: "yyyy.MM" // Update format here
                },
                title: {
                    display: true,
                    text: "Date",
                    font: { size: 16, weight: "bold" },
                    padding: { top: 10 }
                },
                ticks: {
                    font: { size: 14 }
                }
            },
            // useTimeScale ?
            //     {
            //         type: 'time',
            //         time: {
            //             unit: timeUnit,
            //             displayFormats: {
            //                 day: 'MMM d, yyyy',
            //                 month: 'yyyy.MM',  // Update format here
            //                 quarter: 'yyyy.MM', // Update format here
            //                 year: 'yyyy'
            //             },
            //             tooltipFormat: 'yyyy.MM'  // Update format here
            //         },
            //         title: {
            //             display: true,
            //             text: 'Date',
            //             font: { size: 16, weight: 'bold' },
            //             padding: { top: 10 }
            //         }
            //     }
            //     :
            //     {
            //         type: 'category',
            //         title: {
            //             display: true,
            //             text: 'Date',
            //             font: { size: 16, weight: 'bold' },
            //             padding: { top: 10 }
            //         },
            //     },
            y: {
                title: {
                    display: true,
                    text: yAxisLabel,
                    font: { size: 16, weight: "bold" },
                    padding: { bottom: 10 }
                },
                ticks: { font: { size: 14 } }
            }
        }
    };
};
