# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a geospatial dashboard application for rice mapping and agricultural data visualization, built with Next.js, React, and specialized mapping libraries. Despite the README mentioning "NutriTrack", the actual codebase is a sophisticated agricultural monitoring dashboard that visualizes rice crop data, climate indices (SPI), and yield predictions across Southeast Asian regions.

## Development Commands

| Command         | Action                                              |
| --------------- | --------------------------------------------------- |
| `npm install`   | Install dependencies                                |
| `npm run dev`   | Start development server at localhost:3000          |
| `npm run build` | Build production bundle                             |
| `npm run start` | Start production server on all interfaces (0.0.0.0) |
| `npm run lint`  | Run ESLint with Next.js config                      |

## Core Architecture

### Data Flow Architecture

-   **API Layer**: `/pages/api/` contains data endpoints that serve both GeoJSON vector data and GeoTIFF raster data
-   **Component Architecture**: Modular component system with specialized chart, map, and selector components
-   **Data Processing**: Multi-stage data pipeline with separate utilities for chart data processing, color mapping, and responsive design

### Key Technologies

-   **Mapping**: Leaflet + React-Leaflet for interactive maps with GeoTIFF and GeoJSON overlay support
-   **Charts**: Chart.js with time-series adapters for temporal data visualization
-   **Data Visualization**: D3.js for custom time-series charts
-   **Styling**: TailwindCSS + SCSS with component-specific stylesheets

### Main Application Pages

-   `pages/rice-map.js` - Primary dashboard interface
-   `pages/rice-map-era5Hist.js` - Historical ERA5 climate data viewer
-   `pages/api/get_data.js` - Main data API for agricultural datasets
-   `pages/api/get_data_era5hist.js` - Historical climate data API
-   `pages/api/getGeoData.js` - test API

### Component Structure

**Chart Components**:

-   `ChartComponent/` - Modular charting system with separate processors, renderers, and export utilities
-   `D3TimeSeriesChart/` - Custom D3-based time series visualization
-   Chart data flows through: `ChartDataProcessor.js` → `ChartRenderers.js` → `ChartExportUtils.js`

**Map Components**:

-   `DashMapTif/` - Main map container supporting both vector and raster data
-   `GeoTiffLayer/` - Custom GeoTIFF raster layer implementation
-   `GeojsonLayer/` - Vector data layer with interactive features
-   `MapLegend/` - Dynamic legend generation based on data types

**UI Selectors**:

-   `VariableSelector/` - Data variable selection (Yield, SPI indices)
-   `DateSelector/` - Temporal data selection
-   `AdminLevelSelector/` - Geographic level selection (Country, Province, Grid)
-   `TimeIntervalSelector/` - Time range controls

### Data Structure

-   Agricultural data organized by: Region → Variable → Administrative Level → Time Period
-   Supported regions: SEA (Southeast Asia), individual countries
-   Data types: Yield, SPI1, SPI3, SPI6, SPI12 drought indices
-   Administrative levels: Country, Province, Grid (raster)
-   File structure: `/data/[DataSource]/[Variable]/[Overview]/[AdminLevel]/[DateType]/`

### Configuration Notes

-   ESLint errors are ignored during builds (see next.config.js)
-   Secure headers implemented with HSTS
-   SASS support with custom include paths
-   Image optimization enabled for AVIF/WebP formats
-   The actual configuration differs significantly from the generic README

### Utility Functions

-   `colorUtils.js` - Color palette generation for data visualization
-   `dashboard_map_update.js` - Map state management utilities
-   `useResponsive.js` - Responsive design hooks
-   `helper.js` - General utility functions and error handling

### Refactoring Update (2025-10-03)

**🚀 Major Architecture Improvements Completed:**

#### New Unified Components (Preferred)
- **UnifiedChart** (`components/UnifiedChart/`): Single component handling all chart types (single-value, time series, ensemble)
- **UnifiedMap** (`components/UnifiedMap/`): Simplified map with preserved Leaflet dynamic imports  
- **Unified API** (`pages/api/unified_data.js`): 90% complexity reduction, automatic legacy format conversion
- **Test Data** (`data/test_data/`): Synthetic datasets for development and validation

#### Data Processing Pipeline
- **Unified Schema**: Single format for all data types (single-value, ensemble, GeoTIFF)
- **Preprocessing Scripts** (`scripts/`): Python tools for data conversion and test generation
- **Legacy Support**: Automatic conversion maintains backward compatibility

#### Development Tools
- **DevLog** (`devlog/`): Complete refactoring documentation and analysis
- **Data Processor** (`utils/dataProcessor.js`): Clean utility functions replacing complex processors

#### Leaflet Compatibility Notes
- ✅ All Leaflet components remain dynamically imported with `{ ssr: false }`
- ✅ UnifiedMap preserves SSR compatibility
- ✅ No direct Leaflet imports in server-side code

### Legacy Components (Deprecated)
- `components/ChartComponent/`: Replaced by UnifiedChart, contains heavily commented code
- `pages/api/get_data.js`: Replaced by unified_data.js, kept for backward compatibility
- Various `.bak` files: Removed during cleanup

### Migration Guide
- Use `pages/unified-dashboard.js` for new development
- Legacy data automatically converted by new API
- Run `scripts/data_preprocessor.py` to convert existing datasets
