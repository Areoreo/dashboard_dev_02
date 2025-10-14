import React, {
    useState,
    useEffect,
    useMemo,
    useRef,
    useCallback
} from "react";
import { createPortal } from "react-dom";

const MONTHS = [
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

const HISTORICAL_YEAR_START = 1990;
const HISTORICAL_YEAR_END = 2020;

export const TimeIntervalSelector = ({
    label,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    setSelectedStartDate,
    setSelectedEndDate,
    options,
    updateOption
}) => {
    const [isTimeIntervalOpen, setTimeIntervalOpen] = useState(true);
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarMode, setCalendarMode] = useState(
        options?.dateType === "Yearly" ? "year" : "month"
    );
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState("");
    const [calendarPosition, setCalendarPosition] = useState({
        top: 0,
        left: 0,
        minWidth: 0,
        ready: false
    });
    const [portalReady, setPortalReady] = useState(false);

    const triggerRef = useRef(null);
    const calendarRef = useRef(null);
    const yearListRef = useRef(null);
    const portalRootRef = useRef(null);
    const manualModeRef = useRef(false);
    const initialSelectionRef = useRef({
        year: selectedYear || "",
        month: selectedMonth || ""
    });

    const selectableRange = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        const range = [];
        for (let i = 0; i < 6; i += 1) {
            const date = new Date(currentYear, currentMonth + i);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            range.push({ year, month });
        }

        return range;
    }, []);

    const availableForecastYears = useMemo(() => {
        const years = Array.from(
            new Set(selectableRange.map((item) => item.year))
        );
        years.sort((a, b) => a - b);
        return years;
    }, [selectableRange]);

    const historicalYears = useMemo(() => {
        if (
            Array.isArray(options?.availableYears) &&
            options.availableYears.length > 0
        ) {
            const normalized = options.availableYears
                .map((year) => parseInt(year, 10))
                .filter((year) => !Number.isNaN(year));
            const unique = Array.from(new Set(normalized));
            unique.sort((a, b) => a - b);
            return unique;
        }

        const years = [];
        for (
            let year = HISTORICAL_YEAR_START;
            year <= HISTORICAL_YEAR_END;
            year += 1
        ) {
            years.push(year);
        }
        return years;
    }, [options?.availableYears]);

    const calendarYears = useMemo(() => {
        return options.overview === "forecast"
            ? availableForecastYears
            : historicalYears;
    }, [availableForecastYears, historicalYears, options.overview]);

    const selectedYearNum = useMemo(() => {
        const parsed = parseInt(selectedYear, 10);
        return Number.isNaN(parsed) ? null : parsed;
    }, [selectedYear]);

    const getMonthsForYear = useCallback(
        (year) => {
            if (!year) {
                return [];
            }

            if (options.overview === "forecast") {
                return selectableRange
                    .filter((item) => item.year === year)
                    .map((item) => item.month);
            }

            return MONTHS.map((month) => month.value);
        },
        [options.overview, selectableRange]
    );

    const availableMonths = useMemo(
        () => getMonthsForYear(selectedYearNum),
        [getMonthsForYear, selectedYearNum]
    );

    const monthPanelYear = useMemo(() => {
        if (selectedYearNum) {
            return selectedYearNum;
        }
        if (calendarYears.length > 0) {
            return calendarYears[calendarYears.length - 1];
        }
        return null;
    }, [calendarYears, selectedYearNum]);

    const monthsForPanel = useMemo(
        () => getMonthsForYear(monthPanelYear),
        [getMonthsForYear, monthPanelYear]
    );

    const formatSelection = useCallback(() => {
        if (options.dateType === "Yearly") {
            return selectedYear || "";
        }
        if (selectedYear && selectedMonth) {
            return `${selectedYear}-${selectedMonth}`;
        }
        return selectedYear || "";
    }, [selectedMonth, selectedYear, options.dateType]);

    useEffect(() => {
        if (typeof document === "undefined") {
            return undefined;
        }

        const portalElement = document.createElement("div");
        portalElement.setAttribute("data-time-interval-portal", "true");
        document.body.appendChild(portalElement);
        portalRootRef.current = portalElement;
        setPortalReady(true);

        return () => {
            setPortalReady(false);
            portalRootRef.current = null;
            document.body.removeChild(portalElement);
        };
    }, []);

    useEffect(() => {
        setInputValue(formatSelection());
        setInputError("");
    }, [formatSelection]);

    useEffect(() => {
        if (!calendarYears.length) {
            return;
        }

        const yearValue = parseInt(selectedYear, 10);
        if (
            !selectedYear ||
            Number.isNaN(yearValue) ||
            !calendarYears.includes(yearValue)
        ) {
            const fallback =
                calendarYears[calendarYears.length - 1] || calendarYears[0];
            setSelectedYear(fallback?.toString());
        }
    }, [calendarYears, selectedYear, setSelectedYear]);

    useEffect(() => {
        if (options.overview !== "forecast") {
            return;
        }

        if (!availableForecastYears.length) {
            return;
        }

        const fallback =
            availableForecastYears[availableForecastYears.length - 1];
        if (
            !selectedYear ||
            !availableForecastYears.includes(parseInt(selectedYear, 10))
        ) {
            setSelectedYear(fallback.toString());
        }
    }, [
        availableForecastYears,
        options.overview,
        selectedYear,
        setSelectedYear
    ]);

    useEffect(() => {
        if (options.overview !== "forecast") {
            return;
        }

        if (!availableMonths.length) {
            return;
        }

        if (!selectedMonth || !availableMonths.includes(selectedMonth)) {
            setSelectedMonth(availableMonths[0]);
        }
    }, [
        availableMonths,
        options.overview,
        selectedMonth,
        setSelectedMonth
    ]);

    const updateRangeDates = useCallback(
        (year, month) => {
            if (
                typeof setSelectedStartDate !== "function" &&
                typeof setSelectedEndDate !== "function"
            ) {
                return;
            }

            if (!year) {
                return;
            }

            if (options.dateType === "Yearly" || !month) {
                setSelectedStartDate?.(`${year}-01-01`);
                setSelectedEndDate?.(`${year}-12-31`);
                return;
            }

            const monthIndex = parseInt(month, 10);
            if (Number.isNaN(monthIndex)) {
                return;
            }

            const lastDay = String(
                new Date(parseInt(year, 10), monthIndex, 0).getDate()
            ).padStart(2, "0");

            setSelectedStartDate?.(`${year}-${month}-01`);
            setSelectedEndDate?.(`${year}-${lastDay}`);
        },
        [options.dateType, setSelectedEndDate, setSelectedStartDate]
    );

    useEffect(() => {
        if (!selectedYear) {
            return;
        }

        if (options.dateType === "Yearly") {
            updateRangeDates(selectedYear);
        } else if (selectedMonth) {
            updateRangeDates(selectedYear, selectedMonth);
        }
    }, [
        options.dateType,
        selectedMonth,
        selectedYear,
        updateRangeDates
    ]);

    useEffect(() => {
        if (options.dateType === "Yearly") {
            manualModeRef.current = false;
            setCalendarMode("year");
            return;
        }

        if (manualModeRef.current) {
            return;
        }

        const preferYearView =
            options.overview !== "forecast" || calendarYears.length > 2;

        setCalendarMode((prev) => {
            const next = preferYearView ? "year" : "month";
            return prev === next ? prev : next;
        });
    }, [calendarYears.length, options.dateType, options.overview]);

    const updateCalendarPosition = useCallback(() => {
        if (
            typeof window === "undefined" ||
            !triggerRef.current ||
            !calendarRef.current
        ) {
            return;
        }

        const rect = triggerRef.current.getBoundingClientRect();
        const gap = 12;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const scrollX = window.scrollX || window.pageXOffset || 0;

        const popoverWidth = calendarRef.current.offsetWidth || 0;
        const viewportWidth = document.documentElement.clientWidth || 0;

        let left = rect.right + scrollX + gap;
        const top = rect.top + scrollY;

        if (popoverWidth) {
            const maxRight = viewportWidth - gap;
            if (left + popoverWidth > maxRight) {
                left = rect.left + scrollX - gap - popoverWidth;
                if (left < gap) {
                    left = gap;
                }
            }
        }

        setCalendarPosition({
            top,
            left,
            minWidth: rect.width,
            ready: true
        });
    }, []);

    const closeCalendar = useCallback(() => {
        setShowCalendar(false);
        manualModeRef.current = false;
        setCalendarPosition((prev) => ({ ...prev, ready: false }));
    }, []);

    const handleCalendarRef = useCallback(
        (node) => {
            calendarRef.current = node;
            if (node) {
                updateCalendarPosition();
            }
        },
        [updateCalendarPosition]
    );

    const cancelCalendar = useCallback(() => {
        if (!showCalendar) {
            setInputError("");
            setInputValue(formatSelection());
            return;
        }

        const { year, month } = initialSelectionRef.current;
        if (year && year !== selectedYear) {
            setSelectedYear(year);
        }
        if (options.dateType !== "Yearly") {
            if (month && month !== selectedMonth) {
                setSelectedMonth(month);
            } else if (!month && selectedMonth) {
                setSelectedMonth("");
            }
        }

        setInputError("");
        closeCalendar();
    }, [
        closeCalendar,
        formatSelection,
        options.dateType,
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        showCalendar
    ]);

    const handleCalendarToggle = () => {
        if (showCalendar) {
            closeCalendar();
            return;
        }

        initialSelectionRef.current = {
            year: selectedYear || "",
            month: selectedMonth || ""
        };
        manualModeRef.current = false;
        setCalendarPosition((prev) => ({ ...prev, ready: false }));
        setShowCalendar(true);
    };

    useEffect(() => {
        if (!showCalendar) {
            return;
        }

        const handleOutsideClick = (event) => {
            if (
                calendarRef.current?.contains(event.target) ||
                triggerRef.current?.contains(event.target)
            ) {
                return;
            }
            closeCalendar();
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                cancelCalendar();
            }
        };

        const handleLayout = () => {
            updateCalendarPosition();
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick);
        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("resize", handleLayout);
        window.addEventListener("scroll", handleLayout, true);

        const raf = requestAnimationFrame(() => updateCalendarPosition());

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("touchstart", handleOutsideClick);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", handleLayout);
            window.removeEventListener("scroll", handleLayout, true);
            cancelAnimationFrame(raf);
        };
    }, [cancelCalendar, closeCalendar, showCalendar, updateCalendarPosition]);

    useEffect(() => {
        if (!showCalendar || !yearListRef.current) {
            return;
        }

        const container = yearListRef.current;
        const yearNumber = parseInt(selectedYear, 10);

        if (!Number.isNaN(yearNumber)) {
            const activeButton = container.querySelector(
                `[data-year='${yearNumber}']`
            );
            if (activeButton) {
                const offset =
                    activeButton.offsetTop -
                    container.clientHeight / 2 +
                    activeButton.offsetHeight / 2;
                container.scrollTo({
                    top: Math.max(offset, 0),
                    behavior: "smooth"
                });
                return;
            }
        }

        container.scrollTo({ top: 0, behavior: "smooth" });
    }, [selectedYear, showCalendar]);

    const parseDateInput = useCallback(
        (value) => {
            if (!calendarYears.length) {
                return {
                    status: "error",
                    message: "No years available."
                };
            }

            if (!value || !value.trim()) {
                return { status: "empty" };
            }

            const normalized = value.trim().replace(/[\/\s.]+/g, "-");
            if (
                !/^\d{4}(-\d{1,2})?$/.test(normalized) &&
                !/^\d{6}$/.test(normalized)
            ) {
                return {
                    status: "error",
                    message:
                        options.dateType === "Yearly"
                            ? "Enter year as YYYY."
                            : "Use YYYY or YYYY-MM."
                };
            }

            let yearPart = normalized;
            let monthPart = null;

            if (normalized.includes("-")) {
                const [y, m] = normalized.split("-");
                yearPart = y;
                monthPart = m || null;
            } else if (normalized.length === 6) {
                yearPart = normalized.slice(0, 4);
                monthPart = normalized.slice(4);
            }

            if (yearPart.length !== 4 || !/^\d{4}$/.test(yearPart)) {
                return {
                    status: "error",
                    message: "Year must have four digits."
                };
            }

            const yearNumber = parseInt(yearPart, 10);
            if (!calendarYears.includes(yearNumber)) {
                const first = calendarYears[0];
                const last = calendarYears[calendarYears.length - 1];
                return {
                    status: "error",
                    message: `Select a year between ${first} and ${last}.`
                };
            }

            if (monthPart) {
                const monthNumber = parseInt(monthPart, 10);
                if (
                    Number.isNaN(monthNumber) ||
                    monthNumber < 1 ||
                    monthNumber > 12
                ) {
                    return {
                        status: "error",
                        message: "Month must be between 01 and 12."
                    };
                }

                const monthValue = String(monthNumber).padStart(2, "0");
                if (
                    options.dateType !== "Yearly" &&
                    !getMonthsForYear(yearNumber).includes(monthValue)
                ) {
                    return {
                        status: "error",
                        message: "Month not available for the selected year."
                    };
                }

                return {
                    status: "valid",
                    year: yearPart,
                    month: monthValue
                };
            }

            if (options.dateType === "Yearly") {
                return {
                    status: "valid",
                    year: yearPart
                };
            }

            return {
                status: "year-only",
                year: yearPart
            };
        },
        [calendarYears, getMonthsForYear, options.dateType]
    );

    const commitInputValue = useCallback(
        (trigger = "blur") => {
            const trimmed = inputValue.trim();
            if (!trimmed) {
                setInputError("");
                setInputValue(formatSelection());
                return;
            }

            const parsed = parseDateInput(trimmed);
            if (parsed.status === "error") {
                setInputError(parsed.message);
                return;
            }

            setInputError("");

            if (parsed.status === "year-only") {
                if (parsed.year !== selectedYear) {
                    setSelectedYear(parsed.year);
                }
                return;
            }

            if (parsed.status === "valid") {
                if (parsed.year && parsed.year !== selectedYear) {
                    setSelectedYear(parsed.year);
                }

                if (
                    parsed.month &&
                    options.dateType !== "Yearly" &&
                    parsed.month !== selectedMonth
                ) {
                    setSelectedMonth(parsed.month);
                }

                if (trigger === "enter") {
                    closeCalendar();
                }
            }
        },
        [
            closeCalendar,
            formatSelection,
            inputValue,
            options.dateType,
            parseDateInput,
            selectedMonth,
            selectedYear,
            setSelectedMonth,
            setSelectedYear
        ]
    );

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
        if (inputError) {
            setInputError("");
        }
    };

    const handleInputBlur = () => {
        commitInputValue("blur");
    };

    const handleInputKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            commitInputValue("enter");
        } else if (event.key === "Escape") {
            event.preventDefault();
            cancelCalendar();
        }
    };

    const handleModeChange = (mode) => {
        manualModeRef.current = true;

        if (mode === "month") {
            let nextYear = selectedYear;
            if (!nextYear && calendarYears.length) {
                nextYear =
                    calendarYears[calendarYears.length - 1].toString();
                setSelectedYear(nextYear);
            }

            const monthYear = parseInt(nextYear, 10);
            const monthsForYear = getMonthsForYear(monthYear);
            if (!selectedMonth && monthsForYear.length) {
                setSelectedMonth(monthsForYear[0]);
            }
        }

        setCalendarMode(mode);
    };

    const handleYearSelect = (year) => {
        const yearString = year.toString();
        if (yearString !== selectedYear) {
            setSelectedYear(yearString);
        }

        if (options.dateType === "Yearly") {
            updateRangeDates(yearString);
            closeCalendar();
            return;
        }

        const monthsForYear = getMonthsForYear(year);
        if (
            monthsForYear.length &&
            (!selectedMonth || !monthsForYear.includes(selectedMonth))
        ) {
            const fallbackMonth = monthsForYear[0];
            setSelectedMonth(fallbackMonth);
            updateRangeDates(yearString, fallbackMonth);
        }

        setCalendarMode("month");
    };

    const handleMonthSelect = (year, month) => {
        const yearString = year.toString();
        if (yearString !== selectedYear) {
            setSelectedYear(yearString);
        }
        if (month !== selectedMonth) {
            setSelectedMonth(month);
        }
        updateRangeDates(yearString, month);
        closeCalendar();
    };

    const calendarPopover =
        showCalendar && portalReady && portalRootRef.current
            ? createPortal(
                  <div
                      className={`time-interval__popover ${
                          options.dateType === "Yearly" ? "is-year-only" : ""
                      }`}
                      ref={handleCalendarRef}
                      role="dialog"
                      aria-label="Date picker"
                      style={{
                          top: `${calendarPosition.top}px`,
                          left: `${calendarPosition.left}px`,
                          minWidth:
                              calendarPosition.minWidth > 0
                                  ? `${calendarPosition.minWidth}px`
                                  : undefined,
                          visibility: calendarPosition.ready
                              ? "visible"
                              : "hidden"
                      }}
                  >
                      <div className="time-interval__popover-header">
                          <h4 className="time-interval__popover-title">
                              Select Date
                          </h4>
                          <button
                              type="button"
                              className="time-interval__close-btn"
                              onClick={closeCalendar}
                              aria-label="Close calendar"
                          >
                              ×
                          </button>
                      </div>

                      {options.dateType !== "Yearly" && (
                          <div
                              className="time-interval__mode-toggle"
                              role="group"
                              aria-label="Calendar level"
                          >
                              <button
                                  type="button"
                                  className={`time-interval__mode-button ${
                                      calendarMode === "year"
                                          ? "is-active"
                                          : ""
                                  }`}
                                  onClick={() => handleModeChange("year")}
                              >
                                  Year
                              </button>
                              <button
                                  type="button"
                                  className={`time-interval__mode-button ${
                                      calendarMode === "month"
                                          ? "is-active"
                                          : ""
                                  }`}
                                  onClick={() => handleModeChange("month")}
                                  disabled={!calendarYears.length}
                              >
                                  Month
                              </button>
                          </div>
                      )}

                      <div className="time-interval__calendar-body">
                          <div
                              className="time-interval__year-column"
                              ref={yearListRef}
                          >
                              {calendarYears.length === 0 ? (
                                  <div className="time-interval__empty-state">
                                      No years available
                                  </div>
                              ) : (
                                  calendarYears.map((year) => {
                                      const isSelected =
                                          selectedYearNum === year;
                                      return (
                                          <button
                                              key={year}
                                              type="button"
                                              data-year={year}
                                              className={`time-interval__year-button ${
                                                  isSelected
                                                      ? "is-selected"
                                                      : ""
                                              }`}
                                              onClick={() =>
                                                  handleYearSelect(year)
                                              }
                                          >
                                              {year}
                                          </button>
                                      );
                                  })
                              )}
                          </div>

                          {options.dateType !== "Yearly" &&
                              calendarMode === "month" && (
                                  <div className="time-interval__month-grid">
                                      {monthPanelYear === null ||
                                      !monthsForPanel.length ? (
                                          <div className="time-interval__empty-state">
                                              {monthPanelYear === null
                                                  ? "Select a year first"
                                                  : "No months available"}
                                          </div>
                                      ) : (
                                          MONTHS.map((month) => {
                                              const isAvailable =
                                                  monthsForPanel.includes(
                                                      month.value
                                                  );
                                              const isSelected =
                                                  selectedYearNum ===
                                                      monthPanelYear &&
                                                  selectedMonth ===
                                                      month.value;

                                              return (
                                                  <button
                                                      key={month.value}
                                                      type="button"
                                                      className={`time-interval__month-button ${
                                                          isSelected
                                                              ? "is-selected"
                                                              : ""
                                                      }`}
                                                      onClick={() =>
                                                          handleMonthSelect(
                                                              monthPanelYear,
                                                              month.value
                                                          )
                                                      }
                                                      disabled={!isAvailable}
                                                  >
                                                      {month.label}
                                                  </button>
                                              );
                                          })
                                      )}
                                  </div>
                              )}
                      </div>

                      <div className="time-interval__actions">
                          <button
                              type="button"
                              className="time-interval__action-btn time-interval__action-btn--secondary"
                              onClick={cancelCalendar}
                          >
                              Cancel
                          </button>
                          <button
                              type="button"
                              className="time-interval__action-btn time-interval__action-btn--primary"
                              onClick={closeCalendar}
                          >
                              Apply
                          </button>
                      </div>
                  </div>,
                  portalRootRef.current
              )
            : null;

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
                                onClick={() => updateOption("dateType", "Yearly")}
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
                            <p className="font-medium text-gray-700 date-selector-text-box">
                                {label}
                            </p>
                            <div
                                className="time-interval__input-panel"
                                ref={triggerRef}
                            >
                                <div className="time-interval__input-wrapper">
                                    <input
                                        type="text"
                                        className="time-interval__input border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        onBlur={handleInputBlur}
                                        onKeyDown={handleInputKeyDown}
                                        placeholder={
                                            options.dateType === "Yearly"
                                                ? "YYYY"
                                                : "YYYY-MM"
                                        }
                                        aria-label="Selected date"
                                    />
                                    <button
                                        type="button"
                                        className={`time-interval__calendar-trigger ${
                                            showCalendar ? "is-active" : ""
                                        }`}
                                        onClick={handleCalendarToggle}
                                        aria-label="Open calendar"
                                    >
                                        <svg
                                            className="time-interval__calendar-icon"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <rect
                                                x="3.5"
                                                y="4.5"
                                                width="13"
                                                height="11"
                                                rx="1.5"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                            />
                                            <path
                                                d="M6 2.75V6"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                            />
                                            <path
                                                d="M14 2.75V6"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                            />
                                            <path
                                                d="M3.5 8H16.5"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                {inputError && (
                                    <p className="time-interval__input-error text-xs text-red-500">
                                        {inputError}
                                    </p>
                                )}
                                {calendarPopover}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
