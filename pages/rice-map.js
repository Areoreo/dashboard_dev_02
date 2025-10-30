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
const StatisticsTable = dynamic(() => import("@components/StatisticsTable"), {
    ssr: false
});

/**
 * Get current date information for dynamic default setting
 * @returns {Object} Object containing current year, month, and formatted strings
 */
const getCurrentDateInfo = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, so add 1 for next month

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
 * Determine if a given date is historical, current, or forecast
 * @param {string} selectedYear - Selected year as string
 * @param {string} selectedMonth - Selected month as string (with leading zero)
 * @returns {string} "hist", "current", or "forecast"
 */
const getDateType = (selectedYear, selectedMonth) => {
    const currentInfo = getCurrentDateInfo();
    const selectedDate = parseInt(`${selectedYear}${selectedMonth}`);
    const currentDate = parseInt(currentInfo.dateString);

    if (selectedDate < currentDate) {
        return "hist";
    } else if (selectedDate === currentDate) {
        return "current";
    } else {
        return "forecast";
    }
};

/**
 * Get default forecast date (1 month after current)
 * @returns {Object} Default forecast year and month
 */
const getDefaultForecastDate = () => {
    const currentInfo = getCurrentDateInfo();
    let forecastYear = currentInfo.year;
    let forecastMonth = currentInfo.month + 1;

    // Handle year rollover
    if (forecastMonth > 12) {
        forecastMonth = 1;
        forecastYear += 1;
    }

    return {
        yearString: String(forecastYear),
        monthString: String(forecastMonth).padStart(2, "0"),
        dateString: `${forecastYear}${String(forecastMonth).padStart(2, "0")}`
    };
};

/**
 * Get intelligent default dates based on overview type
 * @param {string} overview - "forecast" or "hist"
 * @returns {Object} Default year and month for the given overview type
 */
const getDefaultDates = (overview = "forecast") => {
    if (overview === "forecast") {
        // For forecast, use 1 month after current date
        return getDefaultForecastDate();
    } else {
        // For historical data, use a fixed historical date
        return {
            year: "2000",
            month: "04",
            dateString: "200004"
        };
    }
};

export default function Home() {
    // Get current date info for default initialization
    const currentDateInfo = getCurrentDateInfo();

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

    // Initialize with current date (activates "current" button on first load)
    const [options, setOptions] = useState({
        varType: "Yield",
        region: "SEA",
        overview: "forecast", // Current uses forecast overview
        adminLevel: "Grid",
        dateType: "Monthly",
        date: currentDateInfo.dateString // Use current date by default
    });

    // Removed redundant refs and states - data is now passed directly via mapData
    const [mapData, setMapData] = useState(null);

    const [selectedProvince, setSelectedProvince] = useState(null);
    const [timeSeries, setTimeSeries] = useState([]);

    // Initialize with current date to activate "current" button
    const [selectedDate, setSelectedDate] = useState(
        currentDateInfo.dateString
    );
    const [selectedYear, setSelectedYear] = useState(
        currentDateInfo.yearString
    );
    const [selectedMonth, setSelectedMonth] = useState(
        currentDateInfo.monthString
    );
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
                            Statistical analysis of {options.varType} data
                            across all regions
                        </p>
                    </div>
                    {mapData &&
                    mapData.datatype === "geojson" &&
                    mapData.data ? (
                        <StatisticsTable
                            geojsonData={mapData.data}
                            initialStartDate={null}
                            initialEndDate={null}
                        />
                    ) : (
                        <div className="no-data-message">
                            <p>
                                Statistics table is only available for Province
                                and Country level data.
                                {mapData?.datatype === "geotiff" &&
                                    " (Grid data not supported)"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
