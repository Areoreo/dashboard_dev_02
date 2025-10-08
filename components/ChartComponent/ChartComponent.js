// import React, { useEffect, useRef, useState } from "react";
// import Chart from "chart.js/auto";
// import "chartjs-adapter-date-fns"; // Required for proper time-scale handling

// // Import modular utilities
// import {
//     processData,
//     getYearOptions,
//     filterDataByYearRange
// } from "./ChartDataProcessor";
// import { createTimeSeriesChart, createEnsembleChart } from "./ChartRenderers";
// import { downloadCSV, downloadImage } from "./ChartExportUtils";
// import { getChartTitle } from "./ChartComponentUtils";

// export const ChartComponent = ({ data, options }) => {
//     const chartRef = useRef(null);
//     const chartInstanceRef = useRef(null);

//     // For date filtering and range selection
//     const [startYear, setStartYear] = useState(null);
//     const [endYear, setEndYear] = useState(null);
//     const [filteredData, setFilteredData] = useState([]);
//     const [processedData, setProcessedData] = useState([]);
//     const [dataReady, setDataReady] = useState(false);
//     const [showDownloadOptions, setShowDownloadOptions] = useState(false);
//     const [chartType, setChartType] = useState("standard"); // standard, ensemble, or timeSeries

//     // Process data when it changes
//     useEffect(() => {
//         if (!data || data.length === 0) return;

//         // Process data for chart
//         processData(
//             data,
//             setChartType,
//             setProcessedData,
//             setDataReady,
//             setStartYear,
//             setEndYear
//         );
//     }, [data]);

//     // Filter data when year range or processed data changes
//     useEffect(() => {
//         if (
//             !processedData ||
//             processedData.length === 0 ||
//             !startYear ||
//             !endYear
//         )
//             return;

//         const filtered = filterDataByYearRange(
//             processedData,
//             startYear,
//             endYear
//         );
//         setFilteredData(filtered);
//     }, [processedData, startYear, endYear]);

//     // Update chart when filtered data changes
//     useEffect(() => {
//         if (!dataReady || !chartRef.current || filteredData.length === 0)
//             return;

//         createChart();
//     }, [filteredData, dataReady]);

//     // Create and render the chart
//     const createChart = () => {
//         // Clean up existing chart
//         if (chartInstanceRef.current) {
//             chartInstanceRef.current.destroy();
//         }

//         const ctx = chartRef.current.getContext("2d");

//         // Create chart based on detected chart type
//         if (chartType === "ensemble") {
//             createEnsembleChart(ctx, filteredData, options, chartInstanceRef);
//         } else {
//             createTimeSeriesChart(
//                 ctx,
//                 filteredData,
//                 chartType,
//                 options,
//                 chartInstanceRef
//             );
//         }
//     };

//     // Handle year range selection change
//     const handleYearRangeChange = () => {
//         if (
//             !startYear ||
//             !endYear ||
//             !processedData ||
//             processedData.length === 0
//         )
//             return;

//         const filtered = filterDataByYearRange(
//             processedData,
//             startYear,
//             endYear
//         );
//         setFilteredData(filtered);
//     };

//     // Handle download button options
//     const handleDownload = (format) => {
//         if (format === "csv") {
//             downloadCSV(filteredData, startYear, endYear);
//         } else {
//             downloadImage(chartRef, startYear, endYear, format);
//         }
//         setShowDownloadOptions(false); // Hide dropdown after selection
//     };

//     return (
//         <div className="chart-component">
//             {/* Title area */}
//             <div className="chart-header">
//                 {/* <h2 className="chart-title">{getChartTitle(options)}</h2> */}
//                 {data && data.length > 0 && (
//                     <div className="chart-controls">
//                         <div className="range-selector">
//                             <div className="year-range">
//                                 <label>
//                                     Start Year:
//                                     <select
//                                         value={startYear || ""}
//                                         onChange={(e) =>
//                                             setStartYear(Number(e.target.value))
//                                         }
//                                         className="year-select"
//                                     >
//                                         {getYearOptions(processedData).map(
//                                             (year) => (
//                                                 <option
//                                                     key={`start-${year}`}
//                                                     value={year}
//                                                 >
//                                                     {year}
//                                                 </option>
//                                             )
//                                         )}
//                                     </select>
//                                 </label>
//                                 <label>
//                                     End Year:
//                                     <select
//                                         value={endYear || ""}
//                                         onChange={(e) =>
//                                             setEndYear(Number(e.target.value))
//                                         }
//                                         className="year-select"
//                                     >
//                                         {getYearOptions(processedData).map(
//                                             (year) => (
//                                                 <option
//                                                     key={`end-${year}`}
//                                                     value={year}
//                                                 >
//                                                     {year}
//                                                 </option>
//                                             )
//                                         )}
//                                     </select>
//                                 </label>
//                                 <button
//                                     onClick={handleYearRangeChange}
//                                     className="update-button"
//                                 >
//                                     Update Chart
//                                 </button>
//                             </div>
//                         </div>

//                         <div className="download-options">
//                             <button
//                                 onClick={() =>
//                                     setShowDownloadOptions(!showDownloadOptions)
//                                 }
//                                 className="download-button"
//                             >
//                                 Download ▼
//                             </button>
//                             {showDownloadOptions && (
//                                 <div className="download-dropdown">
//                                     <button
//                                         onClick={() => handleDownload("csv")}
//                                     >
//                                         CSV Data
//                                     </button>
//                                     <button
//                                         onClick={() => handleDownload("png")}
//                                     >
//                                         PNG Image
//                                     </button>
//                                     <button
//                                         onClick={() => handleDownload("jpg")}
//                                     >
//                                         JPG Image
//                                     </button>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 )}
//             </div>

//             {/* Chart container */}
//             <div className="chart-container">
//                 {data && data.length > 0 ? (
//                     <canvas ref={chartRef}></canvas>
//                 ) : (
//                     <div className="no-data-message">
//                         <p>
//                             No data available. Please select a region on the
//                             map.
//                         </p>
//                     </div>
//                 )}

//                 {/* Loading indicator */}
//                 {data && data.length > 0 && !dataReady && (
//                     <div className="loading-overlay">
//                         <div className="loading-spinner"></div>
//                         <p>Processing data...</p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

//
//
//

import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "chartjs-adapter-date-fns"; // Required for proper time-scale handling

// Import simplified time series processor
import {
    extractTimeSeries,
    detectDataType,
    formatDate,
    getYearRange,
    filterByYearRange
} from "@utils/timeSeriesProcessor";

// Import existing chart renderers (keep using these)
import { createTimeSeriesChart, createEnsembleChart } from "./ChartRenderers";
import { downloadCSV, downloadImage } from "./ChartExportUtils";
import { getChartTitle } from "./ChartComponentUtils";

export const ChartComponent = ({ selectedFeature, options }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // Chart state
    const [startYear, setStartYear] = useState(null);
    const [endYear, setEndYear] = useState(null);
    const [timeSeries, setTimeSeries] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [dataReady, setDataReady] = useState(false);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const [chartType, setChartType] = useState("standard");

    // Process selectedFeature using simplified processor
    useEffect(() => {
        console.log("\n=== ChartComponent: Processing Feature ===");
        console.log("[ChartComponent] selectedFeature:", selectedFeature);

        if (!selectedFeature || !selectedFeature.properties) {
            console.log("[ChartComponent] ⚠️ No feature selected");
            setTimeSeries([]);
            setDataReady(false);
            return;
        }

        // Extract time series from flat properties using simplified processor
        const extracted = extractTimeSeries(selectedFeature.properties);
        console.log("[ChartComponent] ✅ Extracted time series:", extracted);
        console.log("[ChartComponent] Time series count:", extracted.length);

        // Detect data type
        const dataType = detectDataType(extracted);
        console.log("[ChartComponent] Detected data type:", dataType);

        // Map data type to chart type
        const chartTypeMapping = {
            'ensemble': 'ensembleWithStats',
            'monthly': 'timeSeries',
            'yearly': 'standard',
            'empty': 'standard'
        };
        const mappedChartType = chartTypeMapping[dataType] || 'standard';
        setChartType(mappedChartType);
        console.log("[ChartComponent] Chart type:", mappedChartType);

        // Get year range
        const { startYear: minYear, endYear: maxYear } = getYearRange(extracted);
        setStartYear(minYear);
        setEndYear(maxYear);
        console.log("[ChartComponent] Year range:", minYear, "-", maxYear);

        // Set time series data
        setTimeSeries(extracted);
        setDataReady(true);
        console.log("=== End ChartComponent Processing ===\n");
    }, [selectedFeature, options]);

    // Filter data by year range using simplified processor
    useEffect(() => {
        if (!timeSeries || timeSeries.length === 0 || !startYear || !endYear) {
            return;
        }

        const filtered = filterByYearRange(timeSeries, startYear, endYear);
        console.log("[ChartComponent] Filtered data:", filtered.length, "entries");
        setFilteredData(filtered);
    }, [timeSeries, startYear, endYear]);

    // Update chart when filtered data changes
    useEffect(() => {
        if (!dataReady || !chartRef.current || filteredData.length === 0)
            return;

        createChart();
    }, [filteredData, dataReady]);

    // Create and render the chart
    const createChart = () => {
        // Clean up existing chart
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.getContext("2d");

        // Detect if data has built-in stats (mean, min, max)
        const hasBuiltInStats = filteredData.length > 0 &&
            filteredData[0].mean !== null &&
            filteredData[0].min !== null &&
            filteredData[0].max !== null;

        // Create chart based on detected chart type
        if (chartType === "ensemble" || chartType === "ensembleWithStats") {
            createEnsembleChart(
                ctx,
                filteredData,
                options,
                chartInstanceRef,
                hasBuiltInStats
            );
        } else {
            createTimeSeriesChart(
                ctx,
                filteredData,
                chartType,
                options,
                chartInstanceRef
            );
        }
    };

    // Handle year range selection change
    const handleYearRangeChange = () => {
        if (
            !startYear ||
            !endYear ||
            !timeSeries ||
            timeSeries.length === 0
        )
            return;

        const filtered = filterByYearRange(
            timeSeries,
            startYear,
            endYear
        );
        setFilteredData(filtered);
    };

    // Handle download button options
    const handleDownload = (format) => {
        // Detect if data has built-in stats for CSV export
        const hasBuiltInStats = filteredData.length > 0 &&
            filteredData[0].mean !== null &&
            filteredData[0].min !== null &&
            filteredData[0].max !== null;

        if (format === "csv") {
            downloadCSV(filteredData, startYear, endYear, hasBuiltInStats);
        } else {
            downloadImage(chartRef, startYear, endYear, format);
        }
        setShowDownloadOptions(false); // Hide dropdown after selection
    };

    // Get year options from time series for dropdowns
    const getYearOptions = () => {
        if (!timeSeries || timeSeries.length === 0) {
            return [];
        }
        const years = timeSeries.map(entry => entry.year);
        return [...new Set(years)].sort();
    };

    return (
        <div className="chart-component">
            {/* Title area */}
            <div className="chart-header">
                {selectedFeature && (
                    <div className="chart-controls">
                        <div className="range-selector">
                            <div className="year-range">
                                <label>
                                    Start Year:
                                    <select
                                        value={startYear || ""}
                                        onChange={(e) =>
                                            setStartYear(Number(e.target.value))
                                        }
                                        className="year-select"
                                    >
                                        {getYearOptions().map(
                                            (year) => (
                                                <option
                                                    key={`start-${year}`}
                                                    value={year}
                                                >
                                                    {year}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>
                                <label>
                                    End Year:
                                    <select
                                        value={endYear || ""}
                                        onChange={(e) =>
                                            setEndYear(Number(e.target.value))
                                        }
                                        className="year-select"
                                    >
                                        {getYearOptions().map(
                                            (year) => (
                                                <option
                                                    key={`end-${year}`}
                                                    value={year}
                                                >
                                                    {year}
                                                </option>
                                            )
                                        )}
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

                        <div className="download-options">
                            <button
                                onClick={() =>
                                    setShowDownloadOptions(!showDownloadOptions)
                                }
                                className="download-button"
                            >
                                Download ▼
                            </button>
                            {showDownloadOptions && (
                                <div className="download-dropdown">
                                    <button
                                        onClick={() => handleDownload("csv")}
                                    >
                                        CSV Data
                                    </button>
                                    <button
                                        onClick={() => handleDownload("png")}
                                    >
                                        PNG Image
                                    </button>
                                    <button
                                        onClick={() => handleDownload("jpg")}
                                    >
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
                {selectedFeature ? (
                    <canvas ref={chartRef}></canvas>
                ) : (
                    <div className="no-data-message">
                        <p>
                            No data available. Please select a region on the
                            map.
                        </p>
                    </div>
                )}

                {/* Loading indicator */}
                {selectedFeature && !dataReady && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>Processing data...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
