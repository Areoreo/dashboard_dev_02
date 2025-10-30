import React, { useState, useEffect } from "react";
import Image from "next/image";

import { TimeIntervalSelector } from "@components/TimeIntervalSelector";
import { VariableSelector } from "@components/VariableSelector";
import { AdminLevelSelector } from "@components/AdminLevelSelector";

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

    return {
        year: currentYear,
        month: currentMonth,
        yearString: String(currentYear),
        monthString: formattedMonth,
        dateString: `${currentYear}${formattedMonth}`
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
        monthString: String(forecastMonth).padStart(2, "0")
    };
};

export const ResponsiveNavbar = ({
    options,
    updateOption,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth
}) => {
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("English");
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile on component mount and window resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1300);
        };

        // Set initial value
        checkMobile();

        // Add event listener
        window.addEventListener("resize", checkMobile);

        // Clean up
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isMobileMenuOpen &&
                !event.target.closest(".mobile-menu-container") &&
                !event.target.closest(".mobile-menu-button")
            ) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMobileMenuOpen]);

    // Auto-sync overview state based on selected date
    useEffect(() => {
        const dateType = getDateType(selectedYear, selectedMonth);

        // Only update if there's a mismatch
        if (dateType === "current" && options.overview !== "forecast") {
            // Current date should use forecast overview (as current is a subset of forecast)
            updateOption("overview", "forecast");
        } else if (dateType === "hist" && options.overview !== "hist") {
            updateOption("overview", "hist");
        } else if (dateType === "forecast" && options.overview !== "forecast") {
            updateOption("overview", "forecast");
        }
    }, [selectedYear, selectedMonth, options.overview, updateOption]);

    // When clicking current trigger
    const handleCurrentClick = () => {
        const currentInfo = getCurrentDateInfo();

        // Always switch to forecast overview and set to current date
        updateOption("overview", "forecast");
        updateOption("varType", "SPI1");
        updateOption("dateType", "Monthly");
        setSelectedYear(currentInfo.yearString);
        setSelectedMonth(currentInfo.monthString);
    };

    // When clicking hist or forecast trigger
    const handleOverviewClick = (type) => {
        updateOption("overview", type);

        if (type === "forecast") {
            // For forecast, use default forecast date (1 month after current)
            const forecastDate = getDefaultForecastDate();
            updateOption("dateType", "Monthly");
            setSelectedYear(forecastDate.yearString);
            setSelectedMonth(forecastDate.monthString);
        }
        if (type === "hist") {
            // For historical, use a fixed historical date
            setSelectedYear("2000");
            setSelectedMonth("04");
        }
    };

    // Region selection handler
    const handleRegionSelect = (region) => {
        updateOption("region", region);
        // Close mobile menu if open
        // setMobileMenuOpen(false);
    };

    return (
        <div className="dash-top-container bg-white backdrop-filter backdrop-blur-md bg-opacity-50 shadow-md">
            {/* Left section with logo and tabs */}
            <div className="dash-top-left">
                <div
                    className="header-logo--container cursor-pointer"
                    onClick={() => window.location.reload()}
                >
                    <Image
                        src="/rice_logo.png"
                        alt="logo"
                        className="h-14 w-auto md:max-h-12"
                        height="60"
                        width="200"
                        layout="intrinsic"
                        priority
                    />
                </div>

                {/* Mobile menu button - only visible on small screens */}
                {isMobile && (
                    <button
                        className="mobile-menu-button p-2 focus:outline-none"
                        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                )}

                {/* Navigation tabs - hidden on mobile, shown on larger screens */}
                {!isMobile && (
                    <div className="dash-top-buttons">
                        <button
                            className={`dash-top-button ${
                                getDateType(selectedYear, selectedMonth) ===
                                "hist"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() => handleOverviewClick("hist")}
                        >
                            Historical
                        </button>
                        <button
                            className={`dash-top-button current-button ${
                                getDateType(selectedYear, selectedMonth) ===
                                "current"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={handleCurrentClick}
                        >
                            Current
                        </button>
                        <button
                            className={`dash-top-button ${
                                getDateType(selectedYear, selectedMonth) ===
                                "forecast"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() => handleOverviewClick("forecast")}
                        >
                            Forecast
                        </button>
                    </div>
                )}
            </div>

            {/* Right section with region selectors */}
            {!isMobile && (
                <div className="dash-top-left">
                    <div className="dash-top-buttons">
                        {[
                            "SEA",
                            "Thailand",
                            "Cambodia",
                            "Laos",
                            "Myanmar",
                            "Vietnam"
                        ].map((region) => (
                            <button
                                key={region}
                                className={`dash-top-button-red ${
                                    options.region === region ? "active" : ""
                                }`}
                                onClick={() => updateOption("region", region)}
                            >
                                {region}
                            </button>
                        ))}
                    </div>

                    {/* Language dropdown */}
                    <div className="dash-top-language">
                        <button
                            className="language-button"
                            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                        >
                            Language ▼
                        </button>
                        <div
                            className={`language-dropdown ${
                                isLanguageOpen ? "open" : ""
                            }`}
                        >
                            {["English", "Chinese", "Malay", "Thai"].map(
                                (lang) => (
                                    <div
                                        key={lang}
                                        className={`language-option ${
                                            selectedLanguage === lang
                                                ? "selected"
                                                : ""
                                        }`}
                                        onClick={() => {
                                            setSelectedLanguage(lang);
                                            setIsLanguageOpen(false);
                                        }}
                                    >
                                        {lang}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile menu - expanded dropdown when menu button is clicked */}
            {isMobile && (
                <div
                    className={`mobile-menu-container ${
                        isMobileMenuOpen ? "open" : ""
                    }`}
                >
                    <div className="mb-4">
                        <TimeIntervalSelector
                            label="Date:"
                            selectedYear={selectedYear}
                            setSelectedYear={setSelectedYear}
                            selectedMonth={selectedMonth}
                            setSelectedMonth={setSelectedMonth}
                            options={options}
                            updateOption={updateOption}
                        />

                        <AdminLevelSelector
                            label="Administrative Level:"
                            options={options}
                            updateOption={updateOption}
                        />

                        <VariableSelector
                            selectedVar={options.varType}
                            updateOption={updateOption}
                        />

                        <h3 className="font-bold mb-2 text-gray-700">
                            Overview
                        </h3>
                        <div className="flex flex-col space-y-2">
                            <button
                                className={`p-2 rounded ${
                                    getDateType(selectedYear, selectedMonth) ===
                                    "hist"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100"
                                }`}
                                onClick={() => handleOverviewClick("hist")}
                            >
                                Historical
                            </button>
                            <button
                                className={`p-2 rounded ${
                                    getDateType(selectedYear, selectedMonth) ===
                                    "current"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100"
                                }`}
                                onClick={handleCurrentClick}
                            >
                                Current
                            </button>
                            <button
                                className={`p-2 rounded ${
                                    getDateType(selectedYear, selectedMonth) ===
                                    "forecast"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100"
                                }`}
                                onClick={() => handleOverviewClick("forecast")}
                            >
                                Forecast
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="font-bold mb-2 text-gray-700">Region</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                "SEA",
                                "Thailand",
                                "Cambodia",
                                "Laos",
                                "Myanmar",
                                "Vietnam"
                            ].map((region) => (
                                <button
                                    key={region}
                                    className={`p-2 rounded ${
                                        options.region === region
                                            ? "bg-red-600 text-white"
                                            : "bg-gray-100"
                                    }`}
                                    onClick={() => handleRegionSelect(region)}
                                >
                                    {region}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold mb-2 text-gray-700">
                            Language
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {["English", "Chinese", "Malay", "Thai"].map(
                                (lang) => (
                                    <button
                                        key={lang}
                                        className={`p-2 rounded ${
                                            selectedLanguage === lang
                                                ? "bg-gray-700 text-white"
                                                : "bg-gray-100"
                                        }`}
                                        onClick={() => {
                                            setSelectedLanguage(lang);
                                            // setMobileMenuOpen(false);
                                        }}
                                    >
                                        {lang}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResponsiveNavbar;
