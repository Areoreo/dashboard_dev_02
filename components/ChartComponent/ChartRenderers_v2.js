/**
 * Chart Renderers v2
 *
 * Refactored chart rendering functions that work with standardized series format.
 */

import Chart from "chart.js/auto";
import "chartjs-adapter-date-fns";

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
    // Destroy existing chart
    if (chartInstanceRef.current) {
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
                spanGaps: true
            };
        })
        .filter(Boolean);

    // Create chart options
    const chartOptions = createChartOptions(config, false);

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
            tension: 0.3,
            spanGaps: true,
            order: 1 // Draw on top
        });
    }

    // Create chart options
    const chartOptions = createChartOptions(config, true);

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
 * Create chart options
 */
function createChartOptions(config, isEnsemble) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false
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
                callbacks: {
                    title: (tooltipItems) => {
                        const date = tooltipItems[0].parsed.x;
                        if (date instanceof Date) {
                            return date.toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long"
                            });
                        }
                        return tooltipItems[0].label;
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
        }
    };

    // Apply Y-axis constraints for SPI
    if (config.varType?.startsWith("SPI")) {
        options.scales.y.min = -3;
        options.scales.y.max = 3;
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
