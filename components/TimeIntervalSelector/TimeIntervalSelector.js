import React, { useState, useEffect, useMemo } from "react";

export const TimeIntervalSelector = ({
    label,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedStartDate,
    setSelectedStartDate,
    selectedEndDate,
    setSelectedEndDate,
    options,
    updateOption
}) => {
    const months = [
        { value: "01", label: "Jan" },
        { value: "02", label: "Feb" },
        { value: "03", label: "Mar" },
        { value: "04", label: "Apr" },
        { value: "05", label: "May" },
        { value: "06", label: "Jun" },
        { value: "07", label: "Jul" },
        { value: "08", label: "Aug" },
        { value: "09", label: "Sep" },
        { value: "10", label: "Oct" },
        { value: "11", label: "Nov" },
        { value: "12", label: "Dec" }
    ];

    const [isTimeIntervalOpen, setTimeIntervalOpen] = useState(true);

    // Calculate selectable date range (current date + 6 months)
    const selectableRange = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-indexed (0 = Jan, 9 = Oct)

        const range = [];
        for (let i = 0; i < 6; i++) {
            const date = new Date(currentYear, currentMonth + i);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            range.push({ year, month });
        }

        return range;
    }, []);

    // Get available years for the selectable range
    const availableYears = useMemo(() => {
        const years = [...new Set(selectableRange.map((item) => item.year))];
        return years.sort();
    }, [selectableRange]);

    // Get available months for selected year
    const availableMonths = useMemo(() => {
        if (options.overview === "forecast") {
            return selectableRange
                .filter((item) => item.year === parseInt(selectedYear))
                .map((item) => item.month);
        }
        // For historical data, return all months
        return months.map((m) => m.value);
    }, [selectedYear, selectableRange, options.overview, months]);

    // Initialize selected year/month to current date on mount
    useEffect(() => {
        if (options.overview === "forecast") {
            const today = new Date();
            const currentYear = today.getFullYear().toString();
            const currentMonth = String(today.getMonth() + 1).padStart(2, "0");

            if (
                !selectedYear ||
                !availableYears.includes(parseInt(selectedYear))
            ) {
                setSelectedYear(currentYear);
            }

            if (!selectedMonth || !availableMonths.includes(selectedMonth)) {
                setSelectedMonth(currentMonth);
            }
        }
    }, [options.overview, availableYears, availableMonths]);

    // Validate and adjust selected month when year changes
    useEffect(() => {
        if (options.overview === "forecast" && selectedMonth) {
            if (!availableMonths.includes(selectedMonth)) {
                // Set to first available month for this year
                if (availableMonths.length > 0) {
                    setSelectedMonth(availableMonths[0]);
                }
            }
        }
    }, [selectedYear, availableMonths, options.overview]);

    return (
        <div className="variable-selector">
            <div className="variable-section">
                <button
                    className="section-title"
                    onClick={() => setTimeIntervalOpen(!isTimeIntervalOpen)}
                >
                    Time Interval
                    <span
                        className={`toggle-icon ${
                            isTimeIntervalOpen ? "open" : "closed"
                        }`}
                    >
                        ▼
                    </span>
                </button>
                {isTimeIntervalOpen && (
                    <>
                        <div className="date-picker-list">
                            <button
                                className={`dateType-selector-button ${
                                    options.dateType === "Yearly"
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    updateOption("dateType", "Yearly")
                                }
                            >
                                Yearly
                            </button>
                            <button
                                className={`dateType-selector-button ${
                                    options.dateType === "Monthly"
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    updateOption("dateType", "Monthly")
                                }
                            >
                                Monthly
                            </button>
                        </div>
                        <div className="date-picker-list">
                            <p className=" font-medium text-gray-700 date-selector-text-box">
                                {label}
                            </p>

                            {/* Year Selection */}
                            <select
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedYear}
                                onChange={(e) =>
                                    setSelectedYear(e.target.value)
                                }
                            >
                                {options.overview === "forecast"
                                    ? // Dynamic year selection for forecast (current year + next year if applicable)
                                      availableYears.map((year) => (
                                          <option key={year} value={year}>
                                              {year}
                                          </option>
                                      ))
                                    : // Historical data: 1990-2010
                                      Array.from(
                                          { length: 21 },
                                          (_, i) => 1990 + i
                                      ).map((year) => (
                                          <option key={year} value={year}>
                                              {year}
                                          </option>
                                      ))}
                            </select>

                            {/* Month Selection (if not Yearly type) */}
                            {options.dateType !== "Yearly" && (
                                <select
                                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedMonth}
                                    onChange={(e) =>
                                        setSelectedMonth(e.target.value)
                                    }
                                >
                                    {options.overview === "forecast"
                                        ? // Dynamic month selection based on current date + 6 months
                                          availableMonths.map((monthValue) => (
                                              <option
                                                  key={monthValue}
                                                  value={monthValue}
                                              >
                                                  {
                                                      months.find(
                                                          (m) =>
                                                              m.value ===
                                                              monthValue
                                                      )?.label
                                                  }
                                              </option>
                                          ))
                                        : // Historical data: all months
                                          months.map((month) => (
                                              <option
                                                  key={month.value}
                                                  value={month.value}
                                              >
                                                  {month.label}
                                              </option>
                                          ))}
                                </select>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
