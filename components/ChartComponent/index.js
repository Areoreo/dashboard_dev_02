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

// Shared Utilities
export { downloadCSV, downloadImage } from "./ChartExportUtils";
