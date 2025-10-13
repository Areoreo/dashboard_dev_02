/**
 * Chart Component - Module Exports
 *
 * This file provides exports for both legacy and refactored versions
 * of the Chart Component, allowing for gradual migration.
 *
 * Styles: styles/core/components/_chart-component.scss
 */

// Refactored Components (v2) - Recommended for new code
export { ChartComponent_v2 } from "./ChartComponent_v2";
export {
    processFeatureForChart,
    filterChartData,
    getAvailableYears
} from "./ChartDataProcessor_v2";
export {
    createChart,
    createTimeSeriesChart,
    createEnsembleChart
} from "./ChartRenderers_v2";
export {
    processTimeSeriesData,
    getYearRange,
    filterSeriesByYearRange
} from "./TimeSeriesProcessor";

// Legacy Components - Preserved for backward compatibility
export * from "./ChartComponent";
export {
    processData,
    processHistoricalData,
    getYearOptions,
    filterDataByYearRange
} from "./ChartDataProcessor";

// Shared Utilities
export { downloadCSV, downloadImage } from "./ChartExportUtils";

// Default export - legacy component for backward compatibility
// To use v2, explicitly import ChartComponent_v2
export { ChartComponent as default } from "./ChartComponent";
