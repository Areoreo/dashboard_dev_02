/**
 * Chart Component v2 - Refactored
 *
 * This is a refactored version of ChartComponent that works with standardized
 * timeSeries data format. It provides a cleaner, more maintainable architecture.
 *
 * Key improvements:
 * - Works with standardized timeSeries format from preprocessed GeoJSON
 * - Cleaner separation of concerns (processing, rendering, exporting)
 * - Better handling of ensemble data and statistics
 * - Improved code readability and maintainability
 */

import React, { useEffect, useRef, useState } from "react";
import {
    processFeatureForChart,
    filterChartData,
    getAvailableYears,
    exportToCSV,
    validateChartData
} from "./ChartDataProcessor_v2";
import { createChart } from "./ChartRenderers_v2";
import { downloadImage } from "./ChartExportUtils";

export const ChartComponent_v2 = ({ selectedFeature, options }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // State management
    const [series, setSeries] = useState([]);
    const [config, setConfig] = useState({});
    const [filteredSeries, setFilteredSeries] = useState([]);
    const [startYear, setStartYear] = useState(null);
    const [endYear, setEndYear] = useState(null);
    const [availableYears, setAvailableYears] = useState([]);
    const [dataReady, setDataReady] = useState(false);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const [validationResult, setValidationResult] = useState({ isValid: true, message: null });

    // Process feature when it changes or options change
    useEffect(() => {
        console.log("\n=== ChartComponent_v2: Processing Feature ===");
        console.log("[ChartComponent_v2] Options changed:", options);

        if (!selectedFeature) {
            console.log("[ChartComponent_v2] No feature selected");
            // Destroy chart when no feature is selected
            if (chartInstanceRef.current) {
                // Clean up any tooltips before destroying
                if (chartInstanceRef.current._customTooltip) {
                    if (chartInstanceRef.current._tooltipClickHandler) {
                        document.removeEventListener('click', chartInstanceRef.current._tooltipClickHandler);
                    }
                    if (chartInstanceRef.current._customTooltip.remove) {
                        chartInstanceRef.current._customTooltip.remove();
                    }
                }
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            setSeries([]);
            setConfig({});
            setDataReady(false);
            setValidationResult({ isValid: true, message: null });
            return;
        }

        // Clean up old chart tooltips when options change
        if (chartInstanceRef.current) {
            if (chartInstanceRef.current._customTooltip) {
                if (chartInstanceRef.current._tooltipClickHandler) {
                    document.removeEventListener('click', chartInstanceRef.current._tooltipClickHandler);
                    chartInstanceRef.current._tooltipClickHandler = null;
                }
                if (chartInstanceRef.current._customTooltip.remove) {
                    chartInstanceRef.current._customTooltip.remove();
                }
                chartInstanceRef.current._customTooltip = null;
            }
        }

        // Process feature data
        const { series: processedSeries, config: chartConfig, yearRange } =
            processFeatureForChart(selectedFeature, options);

        console.log("[ChartComponent_v2] Processed data:", {
            seriesCount: processedSeries.length,
            yearRange
        });

        // Validate data before setting state
        const validation = validateChartData(processedSeries);
        setValidationResult(validation);

        // Update state
        setSeries(processedSeries);
        setConfig(chartConfig);

        if (validation.isValid) {
            // Set year range
            if (yearRange.startYear && yearRange.endYear) {
                setStartYear(yearRange.startYear);
                setEndYear(yearRange.endYear);
            }

            // Get available years for selectors
            const years = getAvailableYears(processedSeries);
            setAvailableYears(years);

            setDataReady(true);
        } else {
            // Reset state if data is invalid
            setStartYear(null);
            setEndYear(null);
            setAvailableYears([]);
            setDataReady(false);
            setFilteredSeries([]);
        }

        console.log("=== End ChartComponent_v2 Processing ===\n");
    }, [selectedFeature, options]);

    // Filter series when year range changes
    useEffect(() => {
        if (!series || series.length === 0 || !startYear || !endYear || !validationResult.isValid) {
            return;
        }

        const filtered = filterChartData(series, startYear, endYear);
        console.log("[ChartComponent_v2] Filtered series:", filtered.length);

        // Validate filtered data as well
        const filteredValidation = validateChartData(filtered);
        if (filteredValidation.isValid) {
            setFilteredSeries(filtered);
        } else {
            // Show warning if filtered data becomes invalid
            setValidationResult(filteredValidation);
            setFilteredSeries([]);
        }
    }, [series, startYear, endYear, validationResult.isValid]);

    // Update chart when filtered data changes
    useEffect(() => {
        if (!dataReady || !chartRef.current || !filteredSeries || filteredSeries.length === 0) {
            // Destroy chart if no data
            if (chartInstanceRef.current && filteredSeries.length === 0) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            return;
        }

        console.log("[ChartComponent_v2] Creating chart");
        createChart(chartRef.current, filteredSeries, config, chartInstanceRef);
    }, [filteredSeries, config, dataReady]);

    // Cleanup on unmount or when options change
    useEffect(() => {
        return () => {
            if (chartInstanceRef.current) {
                console.log("[ChartComponent_v2] Cleaning up chart instance");
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [options]);

    // Handle year range update
    const handleYearRangeChange = () => {
        if (!startYear || !endYear || !series || series.length === 0) {
            return;
        }

        const filtered = filterChartData(series, startYear, endYear);
        setFilteredSeries(filtered);
    };

    // Handle download
    const handleDownload = (format) => {
        if (format === "csv") {
            const csvData = exportToCSV(filteredSeries, config);
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chart_data_${startYear}-${endYear}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } else {
            downloadImage(chartRef, startYear, endYear, format);
        }
        setShowDownloadOptions(false);
    };

    return (
        <div className="chart-component">
            {/* Header with controls */}
            <div className="chart-header">
                {selectedFeature && (
                    <div className="chart-controls">
                        {/* Year range selector */}
                        <div className="range-selector">
                            <div className="year-range">
                                <label>
                                    Start Year:
                                    <select
                                        value={startYear || ""}
                                        onChange={(e) => setStartYear(Number(e.target.value))}
                                        className="year-select"
                                    >
                                        {availableYears.map((year) => (
                                            <option key={`start-${year}`} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    End Year:
                                    <select
                                        value={endYear || ""}
                                        onChange={(e) => setEndYear(Number(e.target.value))}
                                        className="year-select"
                                    >
                                        {availableYears.map((year) => (
                                            <option key={`end-${year}`} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <button
                                    onClick={handleYearRangeChange}
                                    className="update-button"
                                >
                                    Update Chart
                                </button>
                            </div>
                        </div>

                        {/* Download options */}
                        <div className="download-options">
                            <button
                                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                                className="download-button"
                            >
                                Download ▼
                            </button>
                            {showDownloadOptions && (
                                <div className="download-dropdown">
                                    <button onClick={() => handleDownload("csv")}>
                                        CSV Data
                                    </button>
                                    <button onClick={() => handleDownload("png")}>
                                        PNG Image
                                    </button>
                                    <button onClick={() => handleDownload("jpg")}>
                                        JPG Image
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Chart container */}
            <div className="chart-container">
                {!selectedFeature ? (
                    <div className="no-data-message">
                        <p>No data available. Please select a region on the map.</p>
                    </div>
                ) : !validationResult.isValid ? (
                    <div className="warning-message">
                        <p>⚠️ {validationResult.message}</p>
                        <p className="warning-hint">Try selecting a different region or adjusting the time range.</p>
                    </div>
                ) : (
                    <canvas ref={chartRef}></canvas>
                )}

                {/* Loading indicator */}
                {selectedFeature && !dataReady && validationResult.isValid && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>Processing data...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Export as default for backward compatibility
export default ChartComponent_v2;
