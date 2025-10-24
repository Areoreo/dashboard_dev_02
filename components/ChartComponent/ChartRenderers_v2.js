/**
 * Chart Renderers v2
 *
 * Refactored chart rendering functions that work with standardized series format.
 */

import Chart from "chart.js/auto";
import "chartjs-adapter-date-fns";

/**
 * Format date for tooltip based on dateType
 * @param {Date|number} dateValue - Date value from chart (can be Date object or timestamp)
 * @param {string} dateType - Type of date interval (Yearly, Monthly, Daily)
 * @returns {string} Formatted date string
 */
const formatTooltipDate = (dateValue, dateType = "Yearly") => {
    // Convert timestamp to Date if needed
    let date = dateValue;
    if (typeof dateValue === 'number') {
        date = new Date(dateValue);
    }

    // Handle Date objects
    if (date instanceof Date && !isNaN(date)) {
        if (dateType === "Yearly") {
            // Format: "1983"
            return date.getFullYear().toString();
        } else if (dateType === "Monthly") {
            // Format: "May, 1983"
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[date.getMonth()]}, ${date.getFullYear()}`;
        } else if (dateType === "Daily") {
            // Format: "May 15, 1983"
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
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
    const hasEnsemble = series.some(
        (s) => s.plotType === "ensemble" || s.plotType === "mean"
    );

    if (hasEnsemble) {
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
    const allDataValues = series.flatMap(s =>
        s.timeSeriesData?.map(entry => entry.value).filter(v => v !== null && v !== undefined) || []
    );

    // Create chart options with data values
    const chartOptions = createChartOptions({...config, dataValues: allDataValues}, false);

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
    const meanSeries = series.find((s) => s.plotType === "mean");
    const minSeries = series.find((s) => s.plotType === "min");
    const maxSeries = series.find((s) => s.plotType === "max");

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
    const allDataValues = series.flatMap(s =>
        s.timeSeriesData?.map(entry => entry.value).filter(v => v !== null && v !== undefined) || []
    );

    // Create chart options with data values
    const chartOptions = createChartOptions({...config, dataValues: allDataValues}, true);

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
    // Always clear existing tooltip first
    clearCustomTooltip(chart);

    if (activeElements.length === 0) {
        // Clicked on empty area - tooltip already cleared above
        return;
    }

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
    let label = `${dataset.label}: ${value}`;

    // Add SPI interpretation
    if (config.varType?.startsWith("SPI")) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            if (numValue > 2) label += " | Extremely Wet";
            else if (numValue > 1.5) label += " | Very Wet";
            else if (numValue > 1) label += " | Moderately Wet";
            else if (numValue < -2) label += " | Extremely Dry";
            else if (numValue < -1.5) label += " | Severely Dry";
            else if (numValue < -1) label += " | Moderately Dry";
        }
    }

    // Show custom tooltip
    showCustomTooltip(chart, element, formattedDate, label);
}

/**
 * Show custom tooltip at clicked position
 */
function showCustomTooltip(chart, element, title, label) {
    // Remove existing tooltip and its listeners
    clearCustomTooltip(chart);

    const canvas = chart.canvas;
    const position = element.element.tooltipPosition();

    // Create tooltip container
    const tooltip = document.createElement('div');
    tooltip.className = 'chart-custom-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        pointer-events: auto;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        max-width: 320px;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 4px;
        right: 4px;
        background: transparent;
        border: none;
        color: white;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        line-height: 20px;
        border-radius: 4px;
        transition: background-color 0.2s;
    `;
    closeButton.onmouseover = () => closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    closeButton.onmouseout = () => closeButton.style.backgroundColor = 'transparent';
    closeButton.onclick = (e) => {
        e.stopPropagation();
        clearCustomTooltip(chart);
    };

    // Create tooltip content
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'font-weight: bold; font-size: 16px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 4px; padding-right: 24px;';
    titleDiv.textContent = title;

    const labelDiv = document.createElement('div');
    labelDiv.style.cssText = 'padding-right: 24px;';
    labelDiv.textContent = label;

    tooltip.appendChild(closeButton);
    tooltip.appendChild(titleDiv);
    tooltip.appendChild(labelDiv);

    // Position tooltip
    const canvasRect = canvas.getBoundingClientRect();
    const tooltipX = canvasRect.left + position.x + window.scrollX;
    const tooltipY = canvasRect.top + position.y + window.scrollY - 100; // Offset above point

    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';

    // Add to document
    document.body.appendChild(tooltip);

    // Store reference for cleanup
    chart._customTooltip = tooltip;

    // Adjust position if tooltip goes off screen
    setTimeout(() => {
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            tooltip.style.left = (tooltipX - tooltipRect.width - 20) + 'px';
        }
        if (tooltipRect.top < 0) {
            tooltip.style.top = (tooltipY + 120) + 'px';
        }
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
        document.addEventListener('click', outsideClickHandler);
    }, 100);
}

/**
 * Clear custom tooltip
 */
function clearCustomTooltip(chart) {
    // Remove tooltip element
    if (chart._customTooltip) {
        chart._customTooltip.remove();
        chart._customTooltip = null;
    }

    // Remove global click listener
    if (chart._tooltipClickHandler) {
        document.removeEventListener('click', chart._tooltipClickHandler);
        chart._tooltipClickHandler = null;
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
            axis: 'xy' // Consider both x and y proximity for better tooltip trigger
        },
        hover: {
            mode: isEnsemble ? "nearest" : "index",
            intersect: false,
            axis: 'xy'
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
                        let label = `${tooltipItem.dataset.label}: ${value}`;

                        // Add SPI interpretation
                        if (config.varType?.startsWith("SPI")) {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                                if (numValue > 2) label += " | Extremely Wet";
                                else if (numValue > 1.5) label += " | Very Wet";
                                else if (numValue > 1)
                                    label += " | Moderately Wet";
                                else if (numValue < -2)
                                    label += " | Extremely Dry";
                                else if (numValue < -1.5)
                                    label += " | Severely Dry";
                                else if (numValue < -1)
                                    label += " | Moderately Dry";
                            }
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
        onClick: isEnsemble ? (event, activeElements, chart) => {
            handleChartClick(event, activeElements, chart, config);
        } : undefined
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
            ctx.font = '12px Arial';
            ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
            ctx.textAlign = 'right';
            ctx.fillText('💡 Click on a point to view details', chartArea.right - 10, chartArea.top - 10);

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
        max: "Max"
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
        max: "rgba(255, 99, 132, 1)"
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
