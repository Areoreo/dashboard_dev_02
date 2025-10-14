import React, { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

// Import responsive components
import { ResponsiveNavbar } from "@components/responsive/ResponsiveNavbar";
import { ResponsiveSidebar } from "@components/responsive/ResponsiveSidebar";
import { ResponsiveMapContainer } from "@components/responsive/ResponsiveMapContainer";

// Import loading components
import {
    LoadingSpinner,
    MapLoadingOverlay,
    DataLoadingIndicator
} from "@components/LoadingSpinner";

// Dynamic imports to avoid SSR issues
// Use the refactored ChartComponent_v2
const ChartComponent = dynamic(
    () =>
        import("@components/ChartComponent").then(
            (mod) => mod.ChartComponent_v2
        ),
    { ssr: false }
);

// Import StatisticsTable component
const StatisticsTable = dynamic(
    () => import("@components/StatisticsTable"),
    { ssr: false }
);

/**
 * Get current date information for dynamic default setting
 * @returns {Object} Object containing current year, month, and formatted strings
 */
const getCurrentDateInfo = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, so add 1

    // Format month with leading zero (e.g., "04" instead of "4")
    const formattedMonth = String(currentMonth).padStart(2, "0");

    // Format for selectedDate (YYYYMM format)
    const formattedDate = `${currentYear}${formattedMonth}`;

    return {
        year: currentYear,
        month: currentMonth,
        yearString: String(currentYear),
        monthString: formattedMonth,
        dateString: formattedDate
    };
};

/**
 * Get intelligent default dates based on overview type
 * @param {string} overview - "forecast" or "hist"
 * @returns {Object} Default year and month for the given overview type
 */
const getDefaultDates = (overview = "forecast") => {
    const current = getCurrentDateInfo();

    if (overview === "forecast") {
        // For forecast, use current date or next month if we're near month end
        // This ensures we always have recent/relevant forecast data
        return {
            year: current.yearString,
            month: current.monthString
        };
    } else {
        // For historical data, use a recent historical date
        // You can adjust this logic based on your data availability
        const historicalYear = current.year - 1; // Use previous year for historical
        return {
            year: String(historicalYear),
            month: current.monthString
        };
    }
};

export default function Home() {
    // Get dynamic default dates
    const currentDateInfo = getCurrentDateInfo();
    const defaultDates = getDefaultDates("forecast"); // Since default overview is "forecast"

    // Add loading state variables
    const [isLoading, setIsLoading] = useState(false);
    const [mapLoading, setMapLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState(
        "Loading application..."
    );

    // Responsive state
    const [isMobile, setIsMobile] = useState(false);

    // Existing state variables
    const [spi, setSpi] = useState("0");
    const [lastUpdated, setLastUpdated] = useState("15/07/2024");
    const [currData, setCurrData] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");

    // ----Hardcoded date------
    // const [options, setOptions] = useState({
    //     varType: "Yield",
    //     region: "SEA",
    //     overview: "forecast",
    //     adminLevel: "Grid",
    //     dateType: "Monthly",
    //     date: "202504"
    // });

    const [options, setOptions] = useState({
        varType: "Yield",
        region: "SEA",
        overview: "forecast",
        adminLevel: "Grid",
        dateType: "Monthly",
        date: currentDateInfo.dateString // Use dynamic date here
    });

    // Removed redundant refs and states - data is now passed directly via mapData
    const [mapData, setMapData] = useState(null);

    const [selectedProvince, setSelectedProvince] = useState(null);
    const [timeSeries, setTimeSeries] = useState([]);

    // const [selectedDate, setSelectedDate] = useState("20100101");
    // const [selectedYear, setSelectedYear] = useState("2025");
    // const [selectedMonth, setSelectedMonth] = useState("04");
    // const [selectedDay, setSelectedDay] = useState("01");

    // Use dynamic defaults instead of hardcoded values
    const [selectedDate, setSelectedDate] = useState(
        currentDateInfo.dateString
    );
    const [selectedYear, setSelectedYear] = useState(defaultDates.year);
    const [selectedMonth, setSelectedMonth] = useState(defaultDates.month);
    const [selectedDay, setSelectedDay] = useState("01");

    const [selectedYearEnd, setSelectedYearEnd] = useState("2000");
    const [selectedMonthEnd, setSelectedMonthEnd] = useState("01");
    const [selectedDayEnd, setSelectedDayEnd] = useState("01");

    const [selectedFeature, setSelectedFeature] = useState(null);

    // Check if mobile on component mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Check initially
        checkMobile();

        // Add resize listener
        window.addEventListener("resize", checkMobile);

        // Cleanup
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close initial loading after component mounts
    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    // Updated fetch data function with loading states
    const fetchData = useCallback(async () => {
        const { varType, region, overview, adminLevel, dateType } = options;
        console.log(`${varType}_${dateType}_${adminLevel}_${region}`);

        // Set loading states
        setDataLoading(true);
        setLoadingMessage(`Loading ${varType} data for ${region}...`);

        // Set map loading state
        setMapLoading(true);

        // Clear previous data immediately to prevent old data showing
        setMapData(null);
        setSelectedProvince(null);
        setTimeSeries([]);

        try {
            // Generate request URL
            const url = `/api/get_data?varType=${options.varType}&dateType=${options.dateType}&adminLevel=${options.adminLevel}&region=${options.region}&overview=${options.overview}&selectedDate=${selectedDate}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch data: ${response.status} ${response.statusText}`
                );
            }

            if (adminLevel === "Grid") {
                const arrayBuffer = await response.arrayBuffer();
                console.log("Response URL:", response.url);
                console.log(
                    "Fetched GeoTIFF data, size:",
                    arrayBuffer.byteLength
                );

                setMapData({
                    data: arrayBuffer, // Pass actual data, not just URL
                    url: response.url, // Keep URL for reference/debugging
                    datatype: "geotiff",
                    data_vartype: varType,
                    data_adminLevel: adminLevel,
                    data_dateType: dateType
                });
                setSelectedProvince(null);
                setTimeSeries([]);
            } else {
                const data = await response.json();
                console.log("Fetched geoJSON data:", data);

                setMapData({
                    data: data, // Already passing actual data
                    url: response.url, // Keep URL for reference/debugging
                    datatype: "geojson",
                    data_vartype: varType,
                    data_adminLevel: adminLevel,
                    data_dateType: dateType
                });
                setSelectedProvince(null);
                setTimeSeries([]);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setErrorMessage(`Failed to load data: ${error.message}`);
            // Keep error message visible longer for user to read
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            // Reset loading states
            setDataLoading(false);
            // Delay turning off map loading for smoother UX
            setTimeout(() => setMapLoading(false), 500);
        }
    }, [options, selectedDate]);

    // Format selected date for display
    // NOTE: Don't update options.date here to avoid triggering duplicate fetchData calls
    useEffect(() => {
        let formattedDate = selectedYear;
        if (options.dateType === "Monthly") {
            formattedDate = `${selectedYear}${selectedMonth}`;
        } else if (options.dateType === "Daily") {
            formattedDate = `${selectedYear}${selectedMonth}${selectedDay}`;
        }

        setSelectedDate(formattedDate);
    }, [selectedYear, selectedMonth, selectedDay, options.dateType]);

    // Error message handling
    useEffect(() => {
        if (options.dateType === "Daily") {
            setErrorMessage(
                "Daily data is under development, please check and select again"
            );
        } else if (
            options.overview === "forecast" &&
            options.varType.startsWith("SPI") &&
            (options.dateType !== "Monthly" || options.adminLevel !== "Grid")
        ) {
            setErrorMessage(
                "Note that only 'Monthly' and 'Grid' SPI forecast data is available currently"
            );
        } else if (
            options.adminLevel === "Grid" &&
            options.dateType === "Yearly" &&
            (options.varType === "Prcp" || options.varType === "Temp") &&
            (Number(selectedDate) > 2010 || Number(selectedDate) < 1990)
        ) {
            setErrorMessage(
                "Grid data for this varType is only available for 1990-2010, please check and select again"
            );
        } else if (
            options.adminLevel === "Prov" &&
            options.region === "SEA" &&
            options.varType === "Yield"
        ) {
            setErrorMessage(
                "There is no individual country data, please select region-SEA for country-wide details"
            );
        } else if (
            options.adminLevel === "Country" &&
            options.varType !== "Prcp" &&
            options.varType !== "Temp" &&
            options.varType !== "Yield"
        ) {
            setErrorMessage(
                "There is no country data for this variable type, please check and select again"
            );
        }

        // Clear error message after a delay
        const timer = setTimeout(() => setErrorMessage(""), 5000);
        return () => clearTimeout(timer);
    }, [options, selectedDate]);

    // Fetch data when options change
    useEffect(() => {
        console.log("Re-fetch start.");
        fetchData();
    }, [fetchData]);

    // Removed deprecated useEffects for geoJsonLayerRef and geoRasterLayerRef
    // Data is now passed directly to child components via mapData

    // Update options function
    const updateOption = (key, value) => {
        setOptions((prev) => ({ ...prev, [key]: value }));
    };

    // -------- deprecated, this part has been moved to inner ChartComponent ------------//
    // Enhanced time series data extraction that handles both historical and forecast data
    // useEffect(() => {
    //     if (selectedFeature) {
    //         const { properties } = selectedFeature;
    //         console.log("AAA selectedFeature data structure:", selectedFeature);

    //         // Check for different data patterns
    //         const historicalKeys = Object.keys(properties).filter(
    //             (key) => /^y\d+$/.test(key) && !/^y\d+_\d+$/.test(key)
    //         );

    //         const forecastKeys = Object.keys(properties).filter((key) =>
    //             /^y\d+_\d+$/.test(key)
    //         );

    //         let extractedData = [];

    //         // Process data based on the detected pattern
    //         if (historicalKeys.length > 0) {
    //             // Historical data pattern (y1990, y2000, etc.)
    //             console.log(
    //                 "Detected historical data pattern:",
    //                 historicalKeys
    //             );

    //             extractedData = historicalKeys
    //                 .map((key) => {
    //                     const year = parseInt(key.substring(1), 10);
    //                     const value = properties[key];
    //                     return {
    //                         year,
    //                         value:
    //                             typeof value === "number"
    //                                 ? value
    //                                 : parseFloat(value)
    //                     };
    //                 })
    //                 .filter(
    //                     (item) =>
    //                         item.value !== null &&
    //                         item.value !== undefined &&
    //                         !isNaN(item.value)
    //                 );

    //             // Sort data chronologically
    //             extractedData.sort((a, b) => a.year - b.year);
    //         } else if (forecastKeys.length > 0) {
    //             // Forecast data with ensembles pattern (y2025_1, y2025_2, etc.)
    //             console.log("Detected forecast data pattern:", forecastKeys);

    //             extractedData = forecastKeys
    //                 .map((key) => {
    //                     const match = key.match(/^y(\d+)_(\d+)$/);
    //                     if (match) {
    //                         return {
    //                             year: parseInt(match[1], 10),
    //                             ensemble: parseInt(match[2], 10),
    //                             value:
    //                                 typeof properties[key] === "number"
    //                                     ? properties[key]
    //                                     : parseFloat(properties[key])
    //                         };
    //                     }
    //                     return null;
    //                 })
    //                 .filter(
    //                     (item) =>
    //                         item !== null &&
    //                         item.value !== null &&
    //                         item.value !== undefined &&
    //                         !isNaN(item.value)
    //                 );
    //         }

    //         console.log("Processed time series data:", extractedData);

    //         if (extractedData.length > 0) {
    //             setTimeSeries(extractedData);
    //             setSelectedProvince(properties.name || "Selected Region");
    //         } else {
    //             console.warn(
    //                 "No valid time series data found in properties:",
    //                 properties
    //             );
    //             // You might want to show an error message to the user
    //             setTimeSeries([]);
    //         }
    //     }
    // }, [selectedFeature]);

    useEffect(() => {
        if (selectedFeature && selectedFeature.properties) {
            const properties = selectedFeature.properties;
            setSelectedProvince(properties.name || "Selected Region");
            console.log("Selected feature:", selectedFeature);
            console.log("Selected feature properties:", properties);
        } else {
            setSelectedProvince(null);
        }
    }, [selectedFeature]);

    return (
        <>
            {/* Initial application loading */}
            {initialLoading && (
                <LoadingSpinner
                    isLoading={true}
                    message="Initializing Rice Map Application..."
                    size="large"
                />
            )}

            {/* Data loading indicator */}
            <DataLoadingIndicator isLoading={dataLoading} />

            {/* Responsive header/nav bar */}
            <ResponsiveNavbar
                options={options}
                updateOption={updateOption}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
            />

            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
            </Head>

            <div className="dashboard-container">
                {/* Responsive sidebar that collapses on mobile */}
                <ResponsiveSidebar
                    options={options}
                    updateOption={updateOption}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    isMobile={isMobile}
                />

                {/* Responsive map container */}
                <ResponsiveMapContainer
                    mapData={mapData}
                    options={options}
                    selectedDate={selectedDate}
                    selectedFeature={selectedFeature}
                    setSelectedFeature={setSelectedFeature}
                    setSelectedProvince={setSelectedProvince}
                    setTimeSeries={setTimeSeries}
                    mapLoading={mapLoading}
                    errorMessage={errorMessage}
                />
            </div>

            {/* Details section */}
            <div id="details-section" className="details-container">
                <button
                    className="back-to-map-btn"
                    onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                >
                    Back to Map
                </button>
                <div className="info-panel">
                    {selectedFeature ? (
                        <div>
                            <h3 className="text-lg font-bold">
                                {selectedProvince}
                            </h3>
                            {options.overview === "forecast" ? (
                                <p className="text-sm text-gray-600 italic">
                                    {/* Showing forecast data with ensemble members */}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-600 italic">
                                    {/* Showing historical data */}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p>Click on a region to see details.</p>
                    )}
                </div>
                <div className="chart-panel">
                    <>
                        {selectedFeature ? (
                            <ChartComponent
                                selectedFeature={selectedFeature}
                                options={options}
                            />
                        ) : (
                            <div className="no-data-message">
                                <p>
                                    Select a region on the map to view time
                                    series data
                                </p>
                            </div>
                        )}
                    </>
                </div>

                {/* Statistics Table Section */}
                <div className="statistics-panel">
                    <div className="statistics-header">
                        <h3 className="text-xl font-bold mb-2">
                            Regional Statistics Overview
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Statistical analysis of {options.varType} data across all regions
                        </p>
                    </div>
                    {mapData && mapData.datatype === "geojson" && mapData.data ? (
                        <StatisticsTable
                            geojsonData={mapData.data}
                            initialStartDate={null}
                            initialEndDate={null}
                        />
                    ) : (
                        <div className="no-data-message">
                            <p>
                                Statistics table is only available for Province and Country level data.
                                {mapData?.datatype === "geotiff" && " (Grid data not supported)"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
