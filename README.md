# Agricultural Dashboard - Rice Mapping & Climate Monitoring

<div align="center">

**An interactive geospatial dashboard for agricultural monitoring in Southeast Asia**

[![Next.js](https://img.shields.io/badge/Next.js-13-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green)](https://leafletjs.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4-orange)](https://www.chartjs.org/)

</div>

---

## Overview

This is a sophisticated geospatial dashboard application for rice mapping and agricultural data visualization. Despite the original template mentioning "NutriTrack", the actual application is a comprehensive agricultural monitoring platform that visualizes:

- **Rice crop data** (Area, Yield, Production)
- **Climate indices** (SPI1, SPI3, SPI6, SPI12 drought indices)
- **Meteorological data** (Precipitation, Temperature)
- **Yield predictions** with ensemble forecasts

**Coverage**: Southeast Asian regions including Thailand, Myanmar, Cambodia, Vietnam, Laos, and India.

---

## Key Features

### Data Visualization
- **Interactive Maps**: Leaflet-based maps with GeoJSON vector and GeoTIFF raster data
- **Time Series Charts**: Chart.js visualizations with ensemble forecasts and uncertainty bounds
- **Multi-Level Analysis**: Country, Province, and Grid-level data views
- **Temporal Flexibility**: Yearly, Monthly, and Daily data granularity
- **Real-time Interaction**: Click features to view detailed time series and export data

### Technical Capabilities
- **Standardized Data Format**: Unified schema for single-value, ensemble, and raster data
- **Advanced Color System**: Configuration-driven color maps with automatic legend generation
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Export Functionality**: CSV data export and PNG/JPG chart downloads
- **Performance Optimized**: 90% reduction in API complexity, 69% reduction in data processing

---

## Architecture

### Data Flow

```
┌──────────────┐
│ User Selects │
│ Parameters   │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ API Layer        │
│ get_data.js      │ ← Simplified 500→30 lines (90% reduction)
└──────┬───────────┘
       │
       ▼
┌──────────────────────────┐
│ Data Processing Pipeline │
│ - TimeSeriesProcessor    │ ← Extracts standardized time series
│ - ChartDataProcessor_v2  │ ← Processes for visualization
└──────┬───────────────────┘
       │
       ├──────────────────┬─────────────────┐
       ▼                  ▼                 ▼
┌────────────┐    ┌───────────────┐  ┌──────────────┐
│   Map      │    │   Chart       │  │  Legend      │
│ DashMapTif │    │ChartComponent │  │ MapLegend    │
│ GeoJSON    │    │ _v2           │  │ _v2          │
│ GeoTIFF    │    │               │  │              │
└────────────┘    └───────────────┘  └──────────────┘
```

### Core Components

#### **Map Components**
- `DashMapTif/`: Main map container supporting vector and raster data
- `GeoTiffLayer/`: Custom GeoTIFF raster layer implementation
- `GeojsonLayer/`: Vector data layer with interactive features
- `MapLegend_v2/`: Dynamic legend from unified color configuration

#### **Chart Components**
- `ChartComponent_v2/`: Refactored React chart component
- `TimeSeriesProcessor.js`: Converts flat properties to structured time series
- `ChartDataProcessor_v2.js`: High-level data processing interface
- `ChartRenderers_v2.js`: Chart.js visualization with SPI background shading

#### **UI Selectors**
- `VariableSelector/`: Data variable selection (Yield, SPI, etc.)
- `DateSelector/`: Temporal data selection
- `AdminLevelSelector/`: Geographic level selection (Country/Province/Grid)
- `TimeIntervalSelector/`: Time range controls

---

## Data Structure

### Standardized Time Series Format

```javascript
{
  "name": "Province Name",
  "timeSeries": [
    {
      "date": "2020-01-01",
      "year": 2020,
      "month": 1,
      "type": "single",
      "value": 2.5
    },
    {
      "date": "2025-04-01",
      "year": 2025,
      "month": 4,
      "type": "ensemble",
      "ensembleValues": [2.1, 2.3, 2.2, 2.4, 2.0],
      "statistics": {
        "mean": 2.2,
        "min": 2.0,
        "max": 2.4
      },
      "value": 2.2
    }
  ]
}
```

### Data Types
1. **Single-Value Data**: Historical observations (one value per time period)
2. **Ensemble Data**: Forecast predictions with multiple ensemble members and statistics
3. **GeoTIFF Data**: Raster files for high-resolution grid-level visualization

---

## Development

### Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at `localhost:3000` |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server on all interfaces (0.0.0.0) |
| `npm run lint` | Run ESLint with Next.js config |

### File Structure

```
dashboard_dev_02/
├── pages/
│   ├── rice-map.js                 # Main dashboard interface
│   ├── rice-map-era5Hist.js       # Historical ERA5 climate data
│   └── api/
│       ├── get_data.js            # Main data API (simplified)
│       └── get_data_era5hist.js   # Historical climate API
├── components/
│   ├── ChartComponent/
│   │   ├── ChartComponent_v2.js         # Refactored chart (recommended)
│   │   ├── TimeSeriesProcessor.js       # Time series extraction
│   │   ├── ChartDataProcessor_v2.js     # Data processing
│   │   └── ChartRenderers_v2.js         # Chart rendering
│   ├── DashMapTif/                # Main map container
│   ├── GeoTiffLayer/              # GeoTIFF raster layer
│   ├── GeojsonLayer/              # Vector layer
│   └── MapLegend/
│       └── MapLegend_v2.js        # Configuration-driven legend
├── utils/
│   ├── colorMapConfig.js          # Centralized color configurations
│   ├── colorUtils_v2.js           # Unified color generation
│   ├── timeSeriesProcessor.js     # Time series utilities
│   └── dataProcessor.js           # General data utilities
├── styles/
│   ├── globals.scss               # Global styles
│   └── core/
│       ├── components/            # Component-specific styles
│       └── variables/             # SCSS variables
├── data/
│   └── [DataSource]/[Variable]/[Overview]/[AdminLevel]/[DateType]/
└── devlog/                        # Development logs (see below)
```

### Access Points
- **Main Dashboard**: http://localhost:3000/rice-map
- **Historical ERA5**: http://localhost:3000/rice-map-era5Hist

---

## Recent Major Improvements

### ✅ Chart Component Refactor (DevLog 13)
- **69% reduction** in processing logic
- Standardized time series format
- Cleaner separation of concerns
- Better ensemble visualization

### ✅ Color System Overhaul (DevLog 11)
- **92% simpler** color system (12 functions → 1 unified function)
- Centralized configuration (`colorMapConfig.js`)
- Automatic legend-map color synchronization
- Fixed triple-rendering bug causing color inconsistencies

### ✅ API Simplification (DevLog 06)
- **90% reduction** in directory logic (130 lines → 30 lines)
- Comprehensive logging for debugging
- Cleaner, maintainable codebase

### ✅ Tooltip & Interaction Improvements (2025-10-14)
- Increased hover tolerance with `pointHitRadius`
- Auto y-axis scaling for SPI with minimum range [-3, 3]
- Split ensemble tooltips for individual point visibility
- Date format matching selected dateType (Yearly/Monthly/Daily)

---

## Development Logs

Comprehensive development documentation is available in `/devlog/`:

| Log | Topic | Status |
|-----|-------|--------|
| [01](./devlog/01_workflow_analysis.md) | Workflow Analysis | ✅ Reference |
| [02](./devlog/02_unified_data_schema.md) | Unified Data Schema | ✅ Active Reference |
| [03](./devlog/03_refactoring_summary.md) | Refactoring Summary | ✅ Complete |
| [06](./devlog/06_actual_fixes.md) | API Simplification | ✅ Complete |
| [07](./devlog/07_data_processing_refactor.md) | Data Processing Refactor | ✅ Complete |
| [10](./devlog/10_data_quality_and_path_standardization.md) | Data Quality & Paths | ✅ Complete |
| [11](./devlog/11_color_system_refactor_and_rendering_fix.md) | Color System Overhaul | ✅ Complete |
| [13](./devlog/13_chart_component_refactor.md) | Chart Component Refactor | ✅ Complete |

**Quick Reference**: Start with [DevLog README](./devlog/README.md) for guidance on which log to read for specific tasks.

---

## Configuration

### Color Maps
Add new variable types in `utils/colorMapConfig.js`:

```javascript
export const COLOR_MAP_CONFIGS = {
    YourVariableProv: {
        minValue: 0,
        maxValue: 100,
        colormapType: 'continuous',
        colorType: 'hueVector',
        hueRange: [40, 120],
        saturation: 80,
        lightness: 50,
        legendGrades: [0, 25, 50, 75, 100],
        title: "Your Variable Title",
        unit: "units"
    }
};
```

### Data Preprocessing
Use `scripts/geojson_standardizer.py` to convert legacy data:

```bash
python scripts/geojson_standardizer.py \
  --input-dir data/YourDataset/ \
  --output-dir data/Standardized/YourDataset/
```

---

## Key Technologies

- **Frontend**: Next.js 13, React 18
- **Mapping**: Leaflet 1.9 + React-Leaflet (with SSR compatibility)
- **Charts**: Chart.js 4 with date-fns adapter
- **Styling**: TailwindCSS + SCSS with modular component styles
- **Data Visualization**: D3.js for custom visualizations

---

## Performance Metrics

| Aspect | Before | After | Improvement |
|--------|--------|-------|-------------|
| API Logic | 500+ lines | 30 lines | 90% reduction |
| Chart Processing | 130 lines | 40 lines | 69% reduction |
| Color Functions | 12 functions | 1 unified | 92% simplification |
| Parse Feature Props | ~15ms | ~3ms | 5x faster |
| Style Applications | 3-4 per feature | 1 per feature | 66% reduction |

---

## Important Notes

### Leaflet Compatibility
- All Leaflet components use dynamic imports with `{ ssr: false }`
- No direct Leaflet imports in server-side code
- SSR compatibility preserved throughout refactoring

### Backward Compatibility
- Legacy components preserved (e.g., `ChartComponent.js`)
- New components use `_v2` suffix for clarity
- Gradual migration path available

### Data Organization
Files follow the structure:
```
/data/[DataSource]/[Variable]/[Overview]/[AdminLevel]/[DateType]/filename.geojson
```

---

## Contributing

When adding new features or fixes:

1. Read relevant devlogs for context
2. Follow the established architecture patterns
3. Use v2 components for new development
4. Update devlog with significant changes
5. Test across variable types and admin levels

---

## License

This project is developed for agricultural monitoring and climate research purposes.

---

## Credits

**Development**: Claude Code (Anthropic)
**Data Sources**: ERA5, Agricultural datasets from Southeast Asian sources
**Original Template**: Modified from NutriTrack template

**Last Updated**: 2025-10-14
