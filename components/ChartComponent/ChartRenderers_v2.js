/**
 * Chart Renderers v2
 *
 * Refactored chart rendering functions that work with standardized series format.
 */

import Chart from "chart.js/auto";
import "chartjs-adapter-date-fns";
import {
    isMissingValue,
    getMissingValueMessage
} from "@utils/missingValueConfig";

/**
 * Format date for tooltip based on dateType
 * @param {Date|number} dateValue - Date value from chart (can be Date object or timestamp)
 * @param {string} dateType - Type of date interval (Yearly, Monthly, Daily)
 * @returns {string} Formatted date string
 */
const formatTooltipDate = (dateValue, dateType = "Yearly") => {
    // Convert timestamp to Date if needed
    let date = dateValue;
    if (typeof dateValue === "number") {
        date = new Date(dateValue);
    }

    // Handle Date objects
    if (date instanceof Date && !isNaN(date)) {
        if (dateType === "Yearly") {
            // Format: "1983"
            return date.getFullYear().toString();
        } else if (dateType === "Monthly") {
            // Format: "May, 1983"
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
            return `${monthNames[date.getMonth()]}, ${date.getFullYear()}`;
        } else if (dateType === "Daily") {
            // Format: "May 15, 1983"
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
            return `${
                monthNames[date.getMonth()]
            } ${date.getDate()}, ${date.getFullYear()}`;
        }
    }

    // Fallback
    return dateValue.toString();
};

/**
 * Create a chart from processed series data
 *
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} series - Processed series data
 * @param {Object} config - Chart configuration
 * @param {Object} chartInstanceRef - Reference to store chart instance
 * @returns {Chart} Chart.js instance
 */
export function createChart(canvas, series, config, chartInstanceRef) {
    // Destroy existing chart and clean up tooltips
    if (chartInstanceRef.current) {
        clearCustomTooltip(chartInstanceRef.current);
        chartInstanceRef.current.destroy();
    }

    const ctx = canvas.getContext("2d");

    // Determine chart type
    // Use ensemble chart if we have ensemble members, mean, or multiple statistics (min/max/l95/h95)
    const hasEnsemble = series.some(
        (s) => s.plotType === "ensemble" || s.plotType === "mean"
    );
    const hasStatistics = series.some(
        (s) =>
            s.plotType === "min" ||
            s.plotType === "max" ||
            s.plotType === "l95" ||
            s.plotType === "h95"
    );

    if (hasEnsemble || hasStatistics) {
        return createEnsembleChart(ctx, series, config, chartInstanceRef);
    } else {
        return createTimeSeriesChart(ctx, series, config, chartInstanceRef);
    }
}

/**
 * Create a time series chart (single value lines)
 */
export function createTimeSeriesChart(ctx, series, config, chartInstanceRef) {
    console.log("[ChartRenderers_v2] Creating time series chart");

    // Prepare datasets
    const datasets = series
        .map((s) => {
            if (!s.timeSeriesData || s.timeSeriesData.length === 0) {
                return null;
            }

            return {
                label: getSeriesLabel(s),
                data: s.timeSeriesData.map((entry) => ({
                    x: entry.date,
                    y: entry.value
                })),
                borderColor: getSeriesColor(s),
                backgroundColor: getSeriesBackgroundColor(s),
                borderWidth: getSeriesBorderWidth(s),
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHitRadius: 10,
                spanGaps: true
            };
        })
        .filter(Boolean);

    // Extract all data values for y-axis scaling
    const allDataValues = series.flatMap(
        (s) =>
            s.timeSeriesData
                ?.map((entry) => entry.value)
                .filter((v) => v !== null && v !== undefined) || []
    );

    // Create chart options with data values
    const chartOptions = createChartOptions(
        { ...config, dataValues: allDataValues },
        false
    );

    // Add background plugin for SPI shading
    const backgroundPlugin = createBackgroundPlugin(config);

    // Create chart
    chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: { datasets },
        options: chartOptions,
        plugins: [backgroundPlugin]
    });

    return chartInstanceRef.current;
}

/**
 * Create an ensemble chart (multiple ensemble members + statistics)
 */
export function createEnsembleChart(ctx, series, config, chartInstanceRef) {
    console.log("[ChartRenderers_v2] Creating ensemble chart");

    // Separate series by type
    const ensembleSeries = series.filter((s) => s.plotType === "ensemble");
    const singleValueSeries = series.find((s) => s.plotType === "singleValue");
    const meanSeries = series.find((s) => s.plotType === "mean");
    const minSeries = series.find((s) => s.plotType === "min");
    const maxSeries = series.find((s) => s.plotType === "max");
    const l95Series = series.find((s) => s.plotType === "l95");
    const h95Series = series.find((s) => s.plotType === "h95");

    const datasets = [];

    // Add ensemble member datasets (thin grey lines)
    ensembleSeries.forEach((s) => {
        if (s.timeSeriesData && s.timeSeriesData.length > 0) {
            datasets.push({
                label: getSeriesLabel(s),
                data: s.timeSeriesData.map((entry) => ({
                    x: entry.date,
                    y: entry.value
                })),
                borderColor: getEnsembleColor(s.ensembleIndex),
                borderWidth: 1,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHitRadius: 8,
                tension: 0.1,
                spanGaps: true
            });
        }
    });

    // Add min dataset (with fill area to max)
    if (minSeries && minSeries.timeSeriesData) {
        datasets.push({
            label: "Min",
            data: minSeries.timeSeriesData.map((entry) => ({
                x: entry.date,
                y: entry.value
            })),
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.1)",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHitRadius: 10,
            tension: 0.3,
            spanGaps: true,
            fill: "+1" // Fill to next dataset (max)
        });
    }

    // Add max dataset
    if (maxSeries && maxSeries.timeSeriesData) {
        datasets.push({
            label: "Max",
            data: maxSeries.timeSeriesData.map((entry) => ({
                x: entry.date,
                y: entry.value
            })),
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHitRadius: 10,
            tension: 0.3,
            spanGaps: true,
            fill: false
        });
    }

    // Add l95 dataset (lower 95% CI)
    if (
        l95Series &&
        l95Series.timeSeriesData &&
        l95Series.timeSeriesData.some((entry) => entry.value !== null)
    ) {
        datasets.push({
            label: "Lower estimate (95%)",
            data: l95Series.timeSeriesData.map((entry) => ({
                x: entry.date,
                y: entry.value
            })),
            borderColor: "rgba(255, 159, 64, 1)",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHitRadius: 10,
            tension: 0.3,
            spanGaps: true,
            fill: false
        });
    }

    // Add h95 dataset (higher 95% CI)
    if (
        h95Series &&
        h95Series.timeSeriesData &&
        h95Series.timeSeriesData.some((entry) => entry.value !== null)
    ) {
        datasets.push({
            label: "Upper estimate (95%)",
            data: h95Series.timeSeriesData.map((entry) => ({
                x: entry.date,
                y: entry.value
            })),
            borderColor: "rgba(153, 102, 255, 1)",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHitRadius: 10,
            tension: 0.3,
            spanGaps: true,
            fill: false
        });
    }

    // Add singleValue dataset (if present, for data with statistics but no ensemble/mean)
    if (singleValueSeries && singleValueSeries.timeSeriesData) {
        datasets.push({
            label: "Value",
            data: singleValueSeries.timeSeriesData.map((entry) => ({
                x: entry.date,
                y: entry.value
            })),
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHitRadius: 10,
            tension: 0.3,
            spanGaps: true,
            order: 1 // Draw on top
        });
    }

    // Add mean dataset (thick line on top)
    if (meanSeries && meanSeries.timeSeriesData) {
        datasets.push({
            label: "Mean",
            data: meanSeries.timeSeriesData.map((entry) => ({
                x: entry.date,
                y: entry.value
            })),
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHitRadius: 10,
            tension: 0.3,
            spanGaps: true,
            order: 1 // Draw on top
        });
    }

    // Extract all data values for y-axis scaling (from all series)
    const allDataValues = series.flatMap(
        (s) =>
            s.timeSeriesData
                ?.map((entry) => entry.value)
                .filter((v) => v !== null && v !== undefined) || []
    );

    // Create chart options with data values
    const chartOptions = createChartOptions(
        { ...config, dataValues: allDataValues },
        true
    );

    // Add background plugin for SPI shading
    const backgroundPlugin = createBackgroundPlugin(config);

    // Add instruction text plugin for ensemble charts
    const instructionPlugin = createInstructionPlugin();

    // Create chart
    chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: { datasets },
        options: chartOptions,
        plugins: [backgroundPlugin, instructionPlugin]
    });

    return chartInstanceRef.current;
}

/**
 * Handle chart click for ensemble charts
 * Shows tooltip on click instead of hover
 */
function handleChartClick(event, activeElements, chart, config) {
    if (activeElements.length === 0) {
        // Clicked on empty area - clear with animation
        clearCustomTooltip(chart);
        return;
    }

    // Clear existing tooltip immediately before showing new one
    clearCustomTooltip(chart, true);

    const element = activeElements[0];
    const datasetIndex = element.datasetIndex;
    const index = element.index;
    const dataset = chart.data.datasets[datasetIndex];
    const dataPoint = dataset.data[index];

    // Get the date type for formatting
    const dateType = config.dateType || "Yearly";
    const formattedDate = formatTooltipDate(dataPoint.x, dateType);

    // Format value
    const value = dataPoint.y?.toFixed(2) || "N/A";
    const numValue = parseFloat(value);

    // Build tooltip data object with all information
    const tooltipData = {
        label: dataset.label,
        value: value,
        interpretation: null,
        missingMessage: null,
        statisticsInfo: null
    };

    // Check if this is a missing value and show appropriate message
    if (!isNaN(numValue) && isMissingValue(numValue, config.varType)) {
        tooltipData.missingMessage = getMissingValueMessage(config.varType);
    }
    // Add SPI interpretation for non-missing values
    else if (config.varType?.startsWith("SPI") && !isNaN(numValue)) {
        if (numValue > 2) tooltipData.interpretation = "Extremely Wet";
        else if (numValue > 1.5) tooltipData.interpretation = "Very Wet";
        else if (numValue > 1) tooltipData.interpretation = "Moderately Wet";
        else if (numValue < -2) tooltipData.interpretation = "Extremely Dry";
        else if (numValue < -1.5) tooltipData.interpretation = "Severely Dry";
        else if (numValue < -1) tooltipData.interpretation = "Moderately Dry";
    }

    // Add statistics info for confidence interval labels
    if (dataset.label === "Lower estimate (95%)" || dataset.label === "Upper estimate (95%)") {
        tooltipData.statisticsInfo = "Values are expected to fall within this range 95% of the time.";
    }

    // Show custom tooltip
    showCustomTooltip(chart, element, formattedDate, tooltipData);
}

/**
 * Show custom tooltip at clicked position
 * @param {Chart} chart - Chart.js instance
 * @param {Object} element - Active chart element
 * @param {string} title - Formatted date string
 * @param {Object} tooltipData - Structured tooltip data
 * @param {string} tooltipData.label - Dataset label
 * @param {string} tooltipData.value - Formatted value
 * @param {string|null} tooltipData.interpretation - SPI interpretation
 * @param {string|null} tooltipData.missingMessage - Missing value message
 * @param {string|null} tooltipData.statisticsInfo - Statistics explanation
 */
function showCustomTooltip(chart, element, title, tooltipData) {
    // Remove existing tooltip immediately (no animation) when opening new one
    clearCustomTooltip(chart, true);

    const canvas = chart.canvas;
    const position = element.element.tooltipPosition();

    // Create tooltip container
    const tooltip = document.createElement("div");
    tooltip.className = "chart-custom-tooltip";

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.className = "chart-tooltip-close";
    closeButton.innerHTML = "×";
    closeButton.onclick = (e) => {
        e.stopPropagation();
        clearCustomTooltip(chart);
    };

    // Create tooltip content - Title
    const titleDiv = document.createElement("div");
    titleDiv.className = "chart-tooltip-title";
    titleDiv.textContent = title;

    // Create tooltip content - Main value
    const valueDiv = document.createElement("div");
    valueDiv.className = "chart-tooltip-value";
    valueDiv.innerHTML = `<strong>${tooltipData.label}:</strong> ${tooltipData.value}`;

    // Append elements to tooltip
    tooltip.appendChild(closeButton);
    tooltip.appendChild(titleDiv);
    tooltip.appendChild(valueDiv);

    // Add interpretation if available
    if (tooltipData.interpretation) {
        const interpretationDiv = document.createElement("div");
        interpretationDiv.className = "chart-tooltip-interpretation";
        interpretationDiv.textContent = tooltipData.interpretation;
        tooltip.appendChild(interpretationDiv);
    }

    // Add missing value message if available
    if (tooltipData.missingMessage) {
        const missingDiv = document.createElement("div");
        missingDiv.className = "chart-tooltip-missing";
        missingDiv.textContent = tooltipData.missingMessage;
        tooltip.appendChild(missingDiv);
    }

    // Add statistics info if available
    if (tooltipData.statisticsInfo) {
        const statsDiv = document.createElement("div");
        statsDiv.className = "chart-tooltip-stats";
        statsDiv.innerHTML = `<em>${tooltipData.statisticsInfo}</em>`;
        tooltip.appendChild(statsDiv);
    }

    // Position tooltip
    const canvasRect = canvas.getBoundingClientRect();
    const tooltipX = canvasRect.left + position.x + window.scrollX;
    const tooltipY = canvasRect.top + position.y + window.scrollY - 100; // Offset above point

    tooltip.style.left = tooltipX + "px";
    tooltip.style.top = tooltipY + "px";

    // Add to document
    document.body.appendChild(tooltip);

    // Store reference for cleanup
    chart._customTooltip = tooltip;

    // Adjust position if tooltip goes off screen and trigger animation
    setTimeout(() => {
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            tooltip.style.left = tooltipX - tooltipRect.width - 20 + "px";
        }
        if (tooltipRect.top < 0) {
            tooltip.style.top = tooltipY + 120 + "px";
        }

        // Trigger fade-in animation
        requestAnimationFrame(() => {
            tooltip.classList.add("show");
        });
    }, 0);

    // Add global click handler to close tooltip when clicking outside
    const outsideClickHandler = (e) => {
        // Check if click is outside tooltip and canvas
        if (!tooltip.contains(e.target) && !canvas.contains(e.target)) {
            clearCustomTooltip(chart);
        }
    };

    // Store handler reference for cleanup
    chart._tooltipClickHandler = outsideClickHandler;

    // Add listener with slight delay to avoid immediate triggering
    setTimeout(() => {
        document.addEventListener("click", outsideClickHandler);
    }, 100);
}

/**
 * Clear custom tooltip with fade-out animation
 * @param {boolean} immediate - If true, remove immediately without animation
 */
function clearCustomTooltip(chart, immediate = false) {
    // Remove global click listener first
    if (chart._tooltipClickHandler) {
        document.removeEventListener("click", chart._tooltipClickHandler);
        chart._tooltipClickHandler = null;
    }

    // Remove tooltip element
    if (chart._customTooltip) {
        const tooltip = chart._customTooltip;

        if (immediate) {
            // Immediate removal without animation
            if (tooltip.parentNode) {
                tooltip.remove();
            }
            chart._customTooltip = null;
        } else {
            // Add fade-out animation before removal
            tooltip.classList.remove("show");
            tooltip.classList.add("hiding");

            // Clear reference immediately to prevent multiple tooltips
            chart._customTooltip = null;

            // Remove after animation completes
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.remove();
                }
            }, 150); // Match the transition duration in CSS
        }
    }
}

/**
 * Create chart options
 */
function createChartOptions(config, isEnsemble) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: isEnsemble ? "point" : "index", // Use 'point' for ensemble to show individual tooltips
            intersect: false,
            axis: "xy" // Consider both x and y proximity for better tooltip trigger
        },
        hover: {
            mode: isEnsemble ? "nearest" : "index",
            intersect: false,
            axis: "xy"
        },
        plugins: {
            title: {
                display: false
            },
            legend: {
                display: true,
                position: "bottom",
                labels: {
                    filter: (legendItem) => {
                        // Hide individual ensemble members from legend
                        return !legendItem.text.startsWith("Ensemble ");
                    }
                }
            },
            tooltip: {
                enabled: !isEnsemble, // Disable default tooltip for ensemble charts
                callbacks: {
                    title: (tooltipItems) => {
                        const xValue = tooltipItems[0].parsed.x;
                        const dateType = config.dateType || "Yearly";

                        // Format date based on dateType
                        return formatTooltipDate(xValue, dateType);
                    },
                    label: (tooltipItem) => {
                        let value = tooltipItem.parsed.y?.toFixed(2) || "N/A";
                        const numValue = parseFloat(value);
                        let label = `${tooltipItem.dataset.label}: ${value}`;

                        // Check if this is a missing value and show appropriate message
                        if (
                            !isNaN(numValue) &&
                            isMissingValue(numValue, config.varType)
                        ) {
                            const missingMessage = getMissingValueMessage(
                                config.varType
                            );
                            label += ` | ${missingMessage}`;
                        }
                        // Add SPI interpretation for non-missing values
                        else if (
                            config.varType?.startsWith("SPI") &&
                            !isNaN(numValue)
                        ) {
                            if (numValue > 2) label += " | Extremely Wet";
                            else if (numValue > 1.5) label += " | Very Wet";
                            else if (numValue > 1) label += " | Moderately Wet";
                            else if (numValue < -2) label += " | Extremely Dry";
                            else if (numValue < -1.5)
                                label += " | Severely Dry";
                            else if (numValue < -1)
                                label += " | Moderately Dry";
                        }

                        return label;
                    }
                },
                bodyFont: { size: 14 },
                titleFont: { size: 16, weight: "bold" }
            }
        },
        scales: {
            x: {
                type: "time",
                time: {
                    unit: isEnsemble ? "month" : "year",
                    displayFormats: {
                        month: "MMM yyyy",
                        year: "yyyy"
                    }
                },
                title: {
                    display: true,
                    text: config.xlabel || "Date"
                },
                grid: {
                    display: true,
                    color: "rgba(0, 0, 0, 0.05)"
                }
            },
            y: {
                title: {
                    display: true,
                    text: config.ylabel || "Value"
                },
                grid: {
                    display: true,
                    color: "rgba(0, 0, 0, 0.1)"
                }
            }
        },
        // Add click event handler for ensemble charts
        onClick: isEnsemble
            ? (event, activeElements, chart) => {
                  handleChartClick(event, activeElements, chart, config);
              }
            : undefined
    };

    // Apply Y-axis constraints for SPI with auto-scaling
    // Minimum range: [-3, 3], auto-expands if data exceeds this range
    if (config.varType?.startsWith("SPI") && config.dataValues) {
        const dataMin = Math.min(...config.dataValues);
        const dataMax = Math.max(...config.dataValues);

        // Calculate display range with minimum of [-3, 3]
        const displayMin = Math.min(dataMin, -3);
        const displayMax = Math.max(dataMax, 3);

        options.scales.y.min = displayMin;
        options.scales.y.max = displayMax;
        options.scales.y.ticks = {
            padding: 5
        };
    }

    return options;
}

/**
 * Create background plugin for shaded areas (SPI zones)
 */
function createBackgroundPlugin(config) {
    if (!config.shadedAreas) {
        return {
            id: "backgroundPlugin",
            beforeDraw: () => {}
        };
    }

    return {
        id: "backgroundPlugin",
        beforeDraw: (chart) => {
            const ctx = chart.ctx;
            const chartArea = chart.chartArea;
            const yScale = chart.scales.y;

            if (!chartArea || !yScale) {
                return;
            }

            ctx.save();

            // Draw each shaded area
            Object.entries(config.shadedAreas).forEach(([label, area]) => {
                const [minValue, maxValue] = area.range;

                // Convert data values to pixel coordinates
                const yTop = yScale.getPixelForValue(maxValue);
                const yBottom = yScale.getPixelForValue(minValue);

                // Only draw if within chart area
                if (yTop < chartArea.bottom && yBottom > chartArea.top) {
                    const clampedTop = Math.max(yTop, chartArea.top);
                    const clampedBottom = Math.min(yBottom, chartArea.bottom);

                    ctx.fillStyle = hexToRgba(area.color, area.opacity || 0.15);
                    ctx.fillRect(
                        chartArea.left,
                        clampedTop,
                        chartArea.right - chartArea.left,
                        clampedBottom - clampedTop
                    );
                }
            });

            ctx.restore();
        }
    };
}

/**
 * Create instruction text plugin for ensemble charts
 * Shows a subtle hint to click on points
 */
function createInstructionPlugin() {
    return {
        id: "instructionPlugin",
        afterDraw: (chart) => {
            const ctx = chart.ctx;
            const chartArea = chart.chartArea;

            if (!chartArea) {
                return;
            }

            ctx.save();

            // Draw instruction text at top-right corner
            ctx.font = "12px Arial";
            ctx.fillStyle = "rgba(100, 100, 100, 0.6)";
            ctx.textAlign = "right";
            ctx.fillText(
                "💡 Click on a point to view details",
                chartArea.right - 10,
                chartArea.top - 10
            );

            ctx.restore();
        }
    };
}

/**
 * Get series label for display
 */
function getSeriesLabel(series) {
    const labels = {
        singleValue: "Value",
        ensemble: `Ensemble ${series.ensembleIndex}`,
        mean: "Mean",
        min: "Min",
        max: "Max",
        l95: "L95",
        h95: "H95"
    };

    return labels[series.plotType] || series.plotType;
}

/**
 * Get series color
 */
function getSeriesColor(series) {
    const colors = {
        singleValue: "rgba(75, 192, 192, 1)",
        mean: "rgba(75, 192, 192, 1)",
        min: "rgba(54, 162, 235, 1)",
        max: "rgba(255, 99, 132, 1)",
        l95: "rgba(255, 159, 64, 1)",
        h95: "rgba(153, 102, 255, 1)"
    };

    if (series.plotType === "ensemble") {
        return getEnsembleColor(series.ensembleIndex);
    }

    return colors[series.plotType] || "rgba(75, 192, 192, 1)";
}

/**
 * Get series background color
 */
function getSeriesBackgroundColor(series) {
    const colors = {
        singleValue: "rgba(75, 192, 192, 0.2)",
        mean: "rgba(75, 192, 192, 0.2)"
    };

    return colors[series.plotType] || "rgba(75, 192, 192, 0.1)";
}

/**
 * Get series border width
 */
function getSeriesBorderWidth(series) {
    const widths = {
        singleValue: 3,
        mean: 3,
        min: 2,
        max: 2,
        l95: 2,
        h95: 2,
        ensemble: 1
    };

    return widths[series.plotType] || 2;
}

/**
 * Get ensemble member color (grey variations)
 */
export function getEnsembleColor(index) {
    const baseOpacity = 0.3;
    const opacityVariation = 0.1;
    const opacity = baseOpacity + ((index % 5) * opacityVariation) / 5;

    return `rgba(150, 150, 150, ${opacity})`;
}

/**
 * Convert hex color to rgba
 */
function hexToRgba(hex, alpha) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return `rgba(200, 200, 200, ${alpha})`;
    }

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
