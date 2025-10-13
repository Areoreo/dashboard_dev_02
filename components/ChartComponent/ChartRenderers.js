// /**
//  * Chart rendering functions for ChartComponent
//  */

// import React, { useEffect, useRef, useState } from "react";
// import Chart from "chart.js/auto";
// import {
//     getChartTitle,
//     getYAxisLabel,
//     getChartLabel,
//     determineTimeUnit,
//     createBackgroundPlugin,
//     getEnsembleColor,
//     createChartOptions
// } from "./ChartComponentUtils";

// // Create a time series chart
// export const createTimeSeriesChart = (
//     ctx,
//     filteredData,
//     chartType,
//     options,
//     chartInstanceRef
// ) => {
//     // Sort data chronologically
//     const sortedData = [...filteredData].sort((a, b) => {
//         if (a.date && b.date) return a.date - b.date;
//         return a.year - b.year;
//     });

//     // Determine if we need a time scale
//     const useTimeScale = chartType === "timeSeries";

//     // Choose x-value based on chart type
//     const xValueSelector = useTimeScale
//         ? (item) => item.date
//         : (item) => item.formattedDate || item.year.toString();

//     // Prepare datasets
//     const datasets = [
//         {
//             label: getChartLabel(options),
//             data: sortedData.map((item) => ({
//                 x: xValueSelector(item),
//                 y: item.value
//             })),
//             borderColor: "rgba(75, 192, 192, 1)",
//             backgroundColor: "rgba(75, 192, 192, 0.2)",
//             borderWidth: 3,
//             tension: 0.3, // Adds slight curve to lines
//             pointRadius: 0,
//             pointHoverRadius: 6
//         }
//     ];

//     // If data has upper/lower bounds, add them
//     if (
//         sortedData.some(
//             (d) =>
//                 d.hasOwnProperty("upper_bound") &&
//                 d.hasOwnProperty("lower_bound")
//         )
//     ) {
//         datasets.push({
//             label: "Upper Bound",
//             data: sortedData.map((item) => ({
//                 x: xValueSelector(item),
//                 y: item.upper_bound
//             })),
//             borderColor: "rgba(75, 192, 192, 0.5)",
//             borderWidth: 1,
//             borderDash: [5, 5],
//             pointRadius: 0,
//             fill: false
//         });

//         datasets.push({
//             label: "Lower Bound",
//             data: sortedData.map((item) => ({
//                 x: xValueSelector(item),
//                 y: item.lower_bound
//             })),
//             borderColor: "rgba(75, 192, 192, 0.5)",
//             borderWidth: 1,
//             borderDash: [5, 5],
//             pointRadius: 0,
//             fill: {
//                 target: "-1",
//                 above: "rgba(75, 192, 192, 0.3)"
//             }
//         });
//     }

//     // Get base chart options
//     const chartOptions = createChartOptions(
//         getChartTitle(options),
//         getYAxisLabel(options),
//         useTimeScale,
//         determineTimeUnit(filteredData),
//         false
//     );

//     // Special handling for SPI values - set fixed y-axis scale
//     if (options && options.varType && options.varType.startsWith("SPI")) {
//         // Get min and max values from the data
//         const values = sortedData
//             .map((d) => d.value)
//             .filter((v) => v !== null && v !== undefined);
//         const minValue = Math.min(...values);
//         const maxValue = Math.max(...values);

//         // Check if all values are within the range [-2, 2]
//         if (minValue >= -2 && maxValue <= 2) {
//             // If all values are within [-2, 2], use fixed scale
//             chartOptions.scales.y.min = -2;
//             chartOptions.scales.y.max = 2;
//         } else if (minValue >= -2 && maxValue > 2) {
//             // If all values are within [-2, 2], use fixed scale
//             chartOptions.scales.y.min = -2;
//         } else if (minValue < -2 && maxValue <= 2) {
//             // If all values are within [-2, 2], use fixed scale
//             chartOptions.scales.y.max = 2;
//         } else {
//             // If values exceed the range, use automatic scaling with padding
//             // No need to set min/max explicitly, Chart.js will auto-scale
//             // Just ensure we have some padding
//             chartOptions.scales.y.ticks = {
//                 padding: 5
//             };
//         }
//     }

//     // Add tooltip callback
//     chartOptions.plugins.tooltip = {
//         callbacks: {
//             title: (tooltipItems) => {
//                 const xValue = tooltipItems[0].parsed.x;
//                 // Handle different x-value types
//                 if (xValue instanceof Date) {
//                     return xValue.toLocaleDateString(undefined, {
//                         year: "numeric",
//                         month: "long"
//                     });
//                 }
//                 return tooltipItems[0].label || `Date: ${xValue}`;
//             },
//             label: (tooltipItem) => {
//                 let value = tooltipItem.parsed.y.toFixed(2);
//                 // Add color indicators for SPI values
//                 if (
//                     options &&
//                     options.varType &&
//                     options.varType.startsWith("SPI")
//                 ) {
//                     if (value > 2) value += " | Extremely Wet"; // Extremely wet
//                     else if (value > 1)
//                         value += " | Moderately Wet"; // Moderately wet
//                     else if (value < -2)
//                         value += " | Extremely Dry"; // Extremely dry
//                     else if (value < -1) value += " | Moderately Dry"; // Moderately dry
//                 }
//                 return `${tooltipItem.dataset.label}: ${value}`;
//             }
//         },
//         bodyFont: { size: 14 },
//         titleFont: { size: 16, weight: "bold" }
//     };

//     // Create the background plugin
//     const backgroundPlugin = createBackgroundPlugin(options);

//     // Create the chart
//     chartInstanceRef.current = new Chart(ctx, {
//         type: "line",
//         data: { datasets },
//         options: chartOptions,
//         plugins: [backgroundPlugin]
//     });
// };

// // Create an ensemble chart
// export const createEnsembleChart = (
//     ctx,
//     filteredData,
//     options,
//     chartInstanceRef
// ) => {
//     // Extract unique years and ensemble members
//     const years = [...new Set(filteredData.map((d) => d.year))].sort(
//         (a, b) => a - b
//     );
//     const ensembleMembers = [
//         ...new Set(filteredData.map((d) => d.ensemble))
//     ].sort((a, b) => a - b);

//     // Create stats by year
//     const yearlyStats = years.map((year) => {
//         const yearData = filteredData.filter((d) => d.year === year);
//         const values = yearData
//             .map((d) => d.value)
//             .filter((v) => v !== null && v !== undefined);

//         return {
//             year,
//             date: new Date(year, 0, 1),
//             formattedDate: `${year}`,
//             mean: values.length
//                 ? values.reduce((sum, val) => sum + val, 0) / values.length
//                 : null,
//             min: values.length ? Math.min(...values) : null,
//             max: values.length ? Math.max(...values) : null,
//             values: yearData
//         };
//     });

//     // const xValueSelector = item => item.formattedDate || item.year.toString();
//     // const xValueSelector = item => new Date(Number(item.year), 0, 1);
//     const xValueSelector = (item) => {
//         const val = item.year?.toString?.() ?? "";
//         if (val.length === 6) {
//             // 年月，例如 202502
//             const year = parseInt(val.slice(0, 4));
//             const month = parseInt(val.slice(4, 6)) - 1; // JS 中月份从 0 开始
//             return new Date(year, month, 1);
//         } else if (val.length === 4) {
//             // 只有年份
//             return new Date(parseInt(val), 0, 1); // 默认为1月
//         } else {
//             return null; // 或抛出错误
//         }
//     };

//     // Prepare datasets for ensemble members (thin lines)
//     const ensembleDatasets = ensembleMembers.map((member) => {
//         const color = getEnsembleColor(member);
//         return {
//             label: `Ensemble ${member}`,
//             data: years.map((year) => {
//                 const entry = filteredData.find(
//                     (d) => d.year === year && d.ensemble === member
//                 );
//                 return {
//                     x: xValueSelector({ year, formattedDate: `${year}` }),
//                     y: entry ? entry.value : null
//                 };
//             }),
//             borderColor: color,
//             borderWidth: 1,
//             pointRadius: 0,
//             tension: 0.1,
//             spanGaps: true
//         };
//     });

//     // Prepare datasets for statistics (thick lines)
//     const statDatasets = [
//         {
//             label: "Mean",
//             data: yearlyStats.map((stat) => ({
//                 x: xValueSelector(stat),
//                 y: stat.mean
//             })),
//             borderColor: "rgba(75, 192, 192, 1)",
//             backgroundColor: "rgba(75, 192, 192, 0.2)",
//             borderWidth: 3,
//             pointRadius: 4,
//             pointHoverRadius: 6,
//             tension: 0.3,
//             spanGaps: true,
//             order: 1 // Lower order = drawn on top
//         },
//         {
//             label: "Max",
//             data: yearlyStats.map((stat) => ({
//                 x: xValueSelector(stat),
//                 y: stat.max
//             })),
//             borderColor: "rgba(255, 99, 132, 1)",
//             borderWidth: 2,
//             pointRadius: 0,
//             tension: 0.3,
//             spanGaps: true,
//             order: 2
//         },
//         {
//             label: "Min",
//             data: yearlyStats.map((stat) => ({
//                 x: xValueSelector(stat),
//                 y: stat.min
//             })),
//             borderColor: "rgba(54, 162, 235, 1)",
//             borderWidth: 2,
//             pointRadius: 0,
//             tension: 0.3,
//             spanGaps: true,
//             fill: {
//                 target: "-1",
//                 above: "rgba(54, 162, 235, 0.1)"
//             },
//             order: 2
//         }
//     ];

//     // // Prepare datasets for ensemble members (thin lines)
//     // const ensembleDatasets = ensembleMembers.map(member => {
//     //     const color = getEnsembleColor(member);
//     //     return {
//     //         label: `Ensemble ${member}`,
//     //         data: years.map(year => {
//     //             const entry = filteredData.find(d => d.year === year && d.ensemble === member);
//     //             return {
//     //                 x: new Date(year, 0, 1), // Always use Date objects for time scale
//     //                 y: entry ? entry.value : null
//     //             };
//     //         }),
//     //         borderColor: color,
//     //         borderWidth: 1,
//     //         pointRadius: 0,
//     //         tension: 0.1,
//     //         spanGaps: true
//     //     };
//     // });

//     // // Prepare datasets for statistics (thick lines)
//     // const statDatasets = [
//     //     {
//     //         label: "Mean",
//     //         data: yearlyStats.map(stat => ({
//     //             x: new Date(stat.year, 0, 1), // Use Date object
//     //             y: stat.mean
//     //         })),
//     //         borderColor: "rgba(75, 192, 192, 1)",
//     //         backgroundColor: "rgba(75, 192, 192, 0.2)",
//     //         borderWidth: 3,
//     //         pointRadius: 4,
//     //         pointHoverRadius: 6,
//     //         tension: 0.3,
//     //         spanGaps: true,
//     //         order: 1 // Lower order = drawn on top
//     //     },
//     //     {
//     //         label: "Max",
//     //         data: yearlyStats.map(stat => ({
//     //             x: new Date(stat.year, 0, 1), // Use Date object
//     //             y: stat.max
//     //         })),
//     //         borderColor: "rgba(255, 99, 132, 1)",
//     //         borderWidth: 2,
//     //         pointRadius: 0,
//     //         tension: 0.3,
//     //         spanGaps: true,
//     //         order: 2
//     //     },
//     //     {
//     //         label: "Min",
//     //         data: yearlyStats.map(stat => ({
//     //             x: new Date(stat.year, 0, 1), // Use Date object
//     //             y: stat.min
//     //         })),
//     //         borderColor: "rgba(54, 162, 235, 1)",
//     //         borderWidth: 2,
//     //         pointRadius: 0,
//     //         tension: 0.3,
//     //         spanGaps: true,
//     //         fill: {
//     //             target: '-1',
//     //             above: 'rgba(54, 162, 235, 0.1)'
//     //         },
//     //         order: 2
//     //     }
//     // ];

//     // Combine ensemble members with statistics
//     // Put ensemble members first so stats are drawn on top
//     const datasets = [...ensembleDatasets, ...statDatasets];

//     // Get base chart options
//     const chartOptions = createChartOptions(
//         getChartTitle(options),
//         getYAxisLabel(options),
//         true,
//         "month", // change your preferred time showing resolution
//         true // This is an ensemble chart
//     );

//     // Special handling for SPI values - set fixed y-axis scale for ensemble charts
//     if (options && options.varType && options.varType.startsWith("SPI")) {
//         // Get min and max values from all datasets
//         const allValues = filteredData
//             .map((d) => d.value)
//             .filter((v) => v !== null && v !== undefined);

//         const minValue = Math.min(...allValues);
//         const maxValue = Math.max(...allValues);

//         // Check if all values are within the range [-2, 2]
//         if (minValue >= -2 && maxValue <= 2) {
//             // If all values are within [-2, 2], use fixed scale
//             chartOptions.scales.y.min = -2;
//             chartOptions.scales.y.max = 2;
//         } else {
//             // If values exceed the range, use automatic scaling with padding
//             // No need to set min/max explicitly, Chart.js will auto-scale
//             chartOptions.scales.y.ticks = {
//                 padding: 5
//             };
//         }
//     }

//     // Add tooltip callback
//     chartOptions.plugins.tooltip = {
//         callbacks: {
//             title: (tooltipItems) => {
//                 return `Date: ${tooltipItems[0].label}`;
//             },
//             label: (tooltipItem) => {
//                 let value = tooltipItem.parsed.y.toFixed(2);
//                 // Add color indicators for SPI values
//                 if (
//                     options &&
//                     options.varType &&
//                     options.varType.startsWith("SPI")
//                 ) {
//                     if (value > 2) value += " | Extremely Wet"; // Extremely wet
//                     else if (value > 1)
//                         value += " | Moderately Wet"; // Moderately wet
//                     else if (value < -2)
//                         value += " | Extremely Dry"; // Extremely dry
//                     else if (value < -1) value += " | Moderately Dry"; // Moderately dry
//                 }
//                 return `${tooltipItem.dataset.label}: ${value}`;
//             }
//         },
//         bodyFont: { size: 14 },
//         titleFont: { size: 16, weight: "bold" }
//     };

//     // Create the background plugin
//     const backgroundPlugin = createBackgroundPlugin(options);

//     // Create the chart
//     chartInstanceRef.current = new Chart(ctx, {
//         type: "line",
//         data: { datasets },
//         options: chartOptions,
//         plugins: [backgroundPlugin]
//     });
// };

/**
 * Chart rendering functions for ChartComponent with built-in statistics support
 */

import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import {
    getChartTitle,
    getYAxisLabel,
    getChartLabel,
    determineTimeUnit,
    createBackgroundPlugin,
    getEnsembleColor,
    createChartOptions
} from "./ChartComponentUtils";

/**
 * Format date for tooltip based on dateType
 * @param {Date|string} dateValue - Date value from chart
 * @param {string} dateType - Type of date interval (Yearly, Monthly, Daily)
 * @returns {string} Formatted date string
 */
const formatTooltipDate = (dateValue, dateType = "Yearly") => {
    // Handle string input (for category scales)
    if (typeof dateValue === 'string') {
        return dateValue;
    }

    // Handle Date objects (for time scales)
    if (dateValue instanceof Date) {
        if (dateType === "Yearly") {
            // Format: "1983"
            return dateValue.getFullYear().toString();
        } else if (dateType === "Monthly") {
            // Format: "May, 1983"
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[dateValue.getMonth()]}, ${dateValue.getFullYear()}`;
        } else if (dateType === "Daily") {
            // Format: "May 15, 1983"
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[dateValue.getMonth()]} ${dateValue.getDate()}, ${dateValue.getFullYear()}`;
        }
    }

    // Fallback
    return dateValue.toString();
};

// Create a time series chart
export const createTimeSeriesChart = (
    ctx,
    filteredData,
    chartType,
    options,
    chartInstanceRef
) => {
    // Sort data chronologically
    const sortedData = [...filteredData].sort((a, b) => {
        if (a.date && b.date) return a.date - b.date;
        return a.year - b.year;
    });

    // Determine if we need a time scale
    const useTimeScale = chartType === "timeSeries";

    // Choose x-value based on chart type
    const xValueSelector = useTimeScale
        ? (item) => item.date
        : (item) => item.formattedDate || item.year.toString();

    // Prepare datasets
    const datasets = [
        {
            label: getChartLabel(options),
            data: sortedData.map((item) => ({
                x: xValueSelector(item),
                y: item.value
            })),
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderWidth: 3,
            tension: 0.3, // Adds slight curve to lines
            pointRadius: 0,
            pointHoverRadius: 6
        }
    ];

    // If data has upper/lower bounds, add them
    if (
        sortedData.some(
            (d) =>
                d.hasOwnProperty("upper_bound") &&
                d.hasOwnProperty("lower_bound")
        )
    ) {
        datasets.push({
            label: "Upper Bound",
            data: sortedData.map((item) => ({
                x: xValueSelector(item),
                y: item.upper_bound
            })),
            borderColor: "rgba(75, 192, 192, 0.5)",
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
        });

        datasets.push({
            label: "Lower Bound",
            data: sortedData.map((item) => ({
                x: xValueSelector(item),
                y: item.lower_bound
            })),
            borderColor: "rgba(75, 192, 192, 0.5)",
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: {
                target: "-1",
                above: "rgba(75, 192, 192, 0.3)"
            }
        });
    }

    // Get base chart options
    const chartOptions = createChartOptions(
        getChartTitle(options),
        getYAxisLabel(options),
        useTimeScale,
        determineTimeUnit(filteredData),
        false
    );

    // Special handling for SPI values - auto y-axis scale with minimum range [-3, 3]
    if (options && options.varType && options.varType.startsWith("SPI")) {
        // Get min and max values from the data
        const values = sortedData
            .map((d) => d.value)
            .filter((v) => v !== null && v !== undefined);
        const dataMin = Math.min(...values);
        const dataMax = Math.max(...values);

        // Calculate display range with minimum of [-3, 3]
        const displayMin = Math.min(dataMin, -3);
        const displayMax = Math.max(dataMax, 3);

        // Set y-axis range
        chartOptions.scales.y.min = displayMin;
        chartOptions.scales.y.max = displayMax;
        chartOptions.scales.y.ticks = {
            padding: 5
        };
    }

    // Add tooltip callback with dateType-aware formatting
    chartOptions.plugins.tooltip = {
        callbacks: {
            title: (tooltipItems) => {
                const xValue = tooltipItems[0].parsed.x;
                // Use dateType from options for formatting
                const dateType = options?.dateType || "Yearly";

                // Handle different x-value types
                if (typeof xValue === 'number' && useTimeScale) {
                    // x is timestamp for time scale
                    const date = new Date(xValue);
                    return formatTooltipDate(date, dateType);
                }

                // For category scale or string labels
                return tooltipItems[0].label || `Date: ${xValue}`;
            },
            label: (tooltipItem) => {
                let value = tooltipItem.parsed.y.toFixed(2);
                // Add color indicators for SPI values
                if (
                    options &&
                    options.varType &&
                    options.varType.startsWith("SPI")
                ) {
                    if (value > 2) value += " | Extremely Wet"; // Extremely wet
                    else if (value > 1)
                        value += " | Moderately Wet"; // Moderately wet
                    else if (value < -2)
                        value += " | Extremely Dry"; // Extremely dry
                    else if (value < -1) value += " | Moderately Dry"; // Moderately dry
                }
                return `${tooltipItem.dataset.label}: ${value}`;
            }
        },
        bodyFont: { size: 14 },
        titleFont: { size: 16, weight: "bold" }
    };

    // Create the background plugin
    const backgroundPlugin = createBackgroundPlugin(options);

    // Create the chart
    chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: { datasets },
        options: chartOptions,
        plugins: [backgroundPlugin]
    });
};

// Create an ensemble chart with built-in statistics support
export const createEnsembleChart = (
    ctx,
    filteredData,
    options,
    chartInstanceRef,
    hasBuiltInStats = false
) => {
    console.log("Creating ensemble chart with data:", filteredData);
    console.log("Has built-in stats:", hasBuiltInStats);

    if (hasBuiltInStats) {
        // Use new format with built-in statistics
        return createEnsembleChartWithBuiltInStats(
            ctx,
            filteredData,
            options,
            chartInstanceRef
        );
    } else {
        // Use legacy format - calculate statistics from ensemble members
        return createLegacyEnsembleChart(
            ctx,
            filteredData,
            options,
            chartInstanceRef
        );
    }
};

// Create ensemble chart using built-in statistics
const createEnsembleChartWithBuiltInStats = (
    ctx,
    filteredData,
    options,
    chartInstanceRef
) => {
    console.log("Using built-in statistics for ensemble chart");

    // Sort data chronologically
    const sortedData = [...filteredData].sort((a, b) => a.date - b.date);

    const xValueSelector = (item) => {
        const val = item.year?.toString?.() ?? "";
        if (val.length === 4) {
            return new Date(parseInt(val), (item.month || 1) - 1, 1);
        }
        return new Date(parseInt(val), 0, 1);
    };

    // Create datasets for individual ensemble members (if available)
    const ensembleDatasets = [];

    // Check if we have ensemble members data
    const hasEnsembleMembers = sortedData.some(
        (d) => d.ensembleMembers && d.ensembleMembers.length > 0
    );

    if (hasEnsembleMembers) {
        // Get all ensemble member indices
        const allEnsembleIndices = new Set();
        sortedData.forEach((d) => {
            if (d.ensembleMembers) {
                d.ensembleMembers.forEach((member) =>
                    allEnsembleIndices.add(member.ensemble)
                );
            }
        });

        // Create datasets for each ensemble member
        Array.from(allEnsembleIndices)
            .sort((a, b) => a - b)
            .forEach((memberIndex) => {
                const color = getEnsembleColor(memberIndex);
                ensembleDatasets.push({
                    label: `Ensemble ${memberIndex}`,
                    data: sortedData.map((d) => {
                        const member = d.ensembleMembers?.find(
                            (m) => m.ensemble === memberIndex
                        );
                        return {
                            x: xValueSelector(d),
                            y: member ? member.value : null
                        };
                    }),
                    borderColor: color,
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1,
                    spanGaps: true
                });
            });
    }

    // Create datasets for built-in statistics (thick lines)
    const statDatasets = [
        {
            label: "Mean",
            data: sortedData.map((d) => ({
                x: xValueSelector(d),
                y: d.mean
            })),
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            spanGaps: true,
            order: 1 // Lower order = drawn on top
        },
        {
            label: "Max",
            data: sortedData.map((d) => ({
                x: xValueSelector(d),
                y: d.max
            })),
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            spanGaps: true,
            order: 2
        },
        {
            label: "Min",
            data: sortedData.map((d) => ({
                x: xValueSelector(d),
                y: d.min
            })),
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            spanGaps: true,
            fill: {
                target: "-1",
                above: "rgba(54, 162, 235, 0.1)"
            },
            order: 2
        }
    ];

    // Combine ensemble members with statistics
    const datasets = [...ensembleDatasets, ...statDatasets];

    // Get base chart options
    const chartOptions = createChartOptions(
        getChartTitle(options),
        getYAxisLabel(options),
        true,
        "month",
        true // This is an ensemble chart
    );

    // Special handling for SPI values - auto y-axis scale with minimum range [-3, 3]
    if (options && options.varType && options.varType.startsWith("SPI")) {
        const allValues = sortedData
            .flatMap((d) => [d.min, d.max, d.mean])
            .filter((v) => v !== null && v !== undefined);
        const dataMin = Math.min(...allValues);
        const dataMax = Math.max(...allValues);

        // Calculate display range with minimum of [-3, 3]
        const displayMin = Math.min(dataMin, -3);
        const displayMax = Math.max(dataMax, 3);

        // Set y-axis range
        chartOptions.scales.y.min = displayMin;
        chartOptions.scales.y.max = displayMax;
        chartOptions.scales.y.ticks = { padding: 5 };
    }

    // Add enhanced tooltip with individual points for ensemble members and dateType-aware formatting
    chartOptions.plugins.tooltip = {
        mode: 'point', // Show tooltip for individual points instead of all datasets at x-value
        intersect: false, // Show tooltip when hovering near a line
        callbacks: {
            title: (tooltipItems) => {
                const xValue = tooltipItems[0].parsed.x;
                const dateType = options?.dateType || "Monthly";

                // Handle timestamp values
                if (typeof xValue === 'number') {
                    const date = new Date(xValue);
                    return formatTooltipDate(date, dateType);
                }

                // Fallback to label
                return tooltipItems[0].label;
            },
            label: (tooltipItem) => {
                let value = tooltipItem.parsed.y.toFixed(2);
                if (
                    options &&
                    options.varType &&
                    options.varType.startsWith("SPI")
                ) {
                    if (value > 2) value += " | Extremely Wet";
                    else if (value > 1) value += " | Moderately Wet";
                    else if (value < -2) value += " | Extremely Dry";
                    else if (value < -1) value += " | Moderately Dry";
                }
                return `${tooltipItem.dataset.label}: ${value}`;
            }
        },
        bodyFont: { size: 14 },
        titleFont: { size: 16, weight: "bold" }
    };

    // Create the background plugin
    const backgroundPlugin = createBackgroundPlugin(options);

    // Create the chart
    chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: { datasets },
        options: chartOptions,
        plugins: [backgroundPlugin]
    });
};

// Legacy ensemble chart creation (calculate statistics from ensemble members)
const createLegacyEnsembleChart = (
    ctx,
    filteredData,
    options,
    chartInstanceRef
) => {
    console.log("Using legacy ensemble calculation");

    // Extract unique years and ensemble members
    const years = [...new Set(filteredData.map((d) => d.year))].sort(
        (a, b) => a - b
    );
    const ensembleMembers = [
        ...new Set(filteredData.map((d) => d.ensemble))
    ].sort((a, b) => a - b);

    // Create stats by year
    const yearlyStats = years.map((year) => {
        const yearData = filteredData.filter((d) => d.year === year);
        const values = yearData
            .map((d) => d.value)
            .filter((v) => v !== null && v !== undefined);

        return {
            year,
            date: new Date(year, 0, 1),
            formattedDate: `${year}`,
            mean: values.length
                ? values.reduce((sum, val) => sum + val, 0) / values.length
                : null,
            min: values.length ? Math.min(...values) : null,
            max: values.length ? Math.max(...values) : null,
            values: yearData
        };
    });

    const xValueSelector = (item) => {
        const val = item.year?.toString?.() ?? "";
        if (val.length === 6) {
            const year = parseInt(val.slice(0, 4));
            const month = parseInt(val.slice(4, 6)) - 1;
            return new Date(year, month, 1);
        } else if (val.length === 4) {
            return new Date(parseInt(val), 0, 1);
        } else {
            return null;
        }
    };

    // Prepare datasets for ensemble members (thin lines)
    const ensembleDatasets = ensembleMembers.map((member) => {
        const color = getEnsembleColor(member);
        return {
            label: `Ensemble ${member}`,
            data: years.map((year) => {
                const entry = filteredData.find(
                    (d) => d.year === year && d.ensemble === member
                );
                return {
                    x: xValueSelector({ year, formattedDate: `${year}` }),
                    y: entry ? entry.value : null
                };
            }),
            borderColor: color,
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.1,
            spanGaps: true
        };
    });

    // Prepare datasets for statistics (thick lines)
    const statDatasets = [
        {
            label: "Mean",
            data: yearlyStats.map((stat) => ({
                x: xValueSelector(stat),
                y: stat.mean
            })),
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            spanGaps: true,
            order: 1
        },
        {
            label: "Max",
            data: yearlyStats.map((stat) => ({
                x: xValueSelector(stat),
                y: stat.max
            })),
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            spanGaps: true,
            order: 2
        },
        {
            label: "Min",
            data: yearlyStats.map((stat) => ({
                x: xValueSelector(stat),
                y: stat.min
            })),
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            spanGaps: true,
            fill: {
                target: "-1",
                above: "rgba(54, 162, 235, 0.1)"
            },
            order: 2
        }
    ];

    // Combine datasets
    const datasets = [...ensembleDatasets, ...statDatasets];

    // Get base chart options
    const chartOptions = createChartOptions(
        getChartTitle(options),
        getYAxisLabel(options),
        true,
        "month",
        true
    );

    // Special handling for SPI values - auto y-axis scale with minimum range [-3, 3]
    if (options && options.varType && options.varType.startsWith("SPI")) {
        const allValues = filteredData
            .map((d) => d.value)
            .filter((v) => v !== null && v !== undefined);
        const dataMin = Math.min(...allValues);
        const dataMax = Math.max(...allValues);

        // Calculate display range with minimum of [-3, 3]
        const displayMin = Math.min(dataMin, -3);
        const displayMax = Math.max(dataMax, 3);

        // Set y-axis range
        chartOptions.scales.y.min = displayMin;
        chartOptions.scales.y.max = displayMax;
        chartOptions.scales.y.ticks = { padding: 5 };
    }

    // Add tooltip with individual points for ensemble members and dateType-aware formatting
    chartOptions.plugins.tooltip = {
        mode: 'point', // Show tooltip for individual points instead of all datasets at x-value
        intersect: false, // Show tooltip when hovering near a line
        callbacks: {
            title: (tooltipItems) => {
                const xValue = tooltipItems[0].parsed.x;
                const dateType = options?.dateType || "Monthly";

                // Handle timestamp values
                if (typeof xValue === 'number') {
                    const date = new Date(xValue);
                    return formatTooltipDate(date, dateType);
                }

                // Fallback to label
                return tooltipItems[0].label;
            },
            label: (tooltipItem) => {
                let value = tooltipItem.parsed.y.toFixed(2);
                if (
                    options &&
                    options.varType &&
                    options.varType.startsWith("SPI")
                ) {
                    if (value > 2) value += " | Extremely Wet";
                    else if (value > 1) value += " | Moderately Wet";
                    else if (value < -2) value += " | Extremely Dry";
                    else if (value < -1) value += " | Moderately Dry";
                }
                return `${tooltipItem.dataset.label}: ${value}`;
            }
        },
        bodyFont: { size: 14 },
        titleFont: { size: 16, weight: "bold" }
    };

    // Create the background plugin
    const backgroundPlugin = createBackgroundPlugin(options);

    // Create the chart
    chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: { datasets },
        options: chartOptions,
        plugins: [backgroundPlugin]
    });
};
