# Data Structure Guide

## Purpose
This document defines the standardized data structure for all agricultural and climate datasets in the dashboard application.

## Standard Path Structure

```
data/
├── [DataSource]/          # ERA5, ECMWF, or Variable name
│   ├── [Variable]/        # Prcp, Temp, SPI1, SPI3, etc. (OR Forecast/Hist for Area/Yield/Production)
│   │   ├── [Overview]/    # Forecast or Hist
│   │   │   ├── [AdminLevel]/  # Country, Prov, or Grid
│   │   │   │   ├── [TimeType]/    # Monthly or Yearly
│   │   │   │   │   └── [Files]
```

## File Naming Convention

### For GeoJSON (Country/Prov levels):
```
[Overview]_[AdminLevel]_[TimeType]_[Variable]_[Region].geojson

Examples:
- Forecast_Prov_Monthly_SPI1_SEA.geojson
- Forecast_Country_Yearly_Prcp_Myanmar.geojson
- Hist_Prov_Monthly_SPI1_Thailand.geojson
```

### For GeoTIFF (Grid level):
```
[Overview]_[AdminLevel]_[TimeType]_[Variable]_[Region]_[Date].tif

Examples:
- Forecast_Grid_Monthly_Prcp_Myanmar_202506.tif
- Hist_Grid_Yearly_SPI1_SEA_2024.tif
```

## Current Data Sources

### 1. ERA5 (Historical Climate Data)
**Path**: `data/ERA5/[Variable]/[Overview]/[AdminLevel]/[TimeType]/`

**Variables**:
- `SPI1`, `SPI3`, `SPI6`, `SPI12` - Drought indices
- `Prcp` - Precipitation
- `Temp` - Temperature
- `smpct1` - Soil moisture percentile

**Example Paths**:
```
data/ERA5/SPI1/Forecast/Prov/Monthly/Forecast_Prov_Monthly_SPI1_SEA.geojson
data/ERA5/SPI1/Hist/Prov/Monthly/Hist_Prov_Monthly_SPI1_SEA.geojson
data/ERA5/Prcp/Forecast/Grid/Monthly/Forecast_Grid_Monthly_Prcp_Myanmar_202506.tif
```

### 2. ECMWF (Forecast Climate Data)
**Path**: `data/ECMWF/[Variable]/Forecast/[AdminLevel]/[TimeType]/`

**Variables**:
- `SPI1` - 1-month Standardized Precipitation Index
- `Prcp` - Precipitation forecast
- `Temp` - Temperature forecast

**Example Paths**:
```
data/ECMWF/Prcp/Forecast/Prov/Monthly/Forecast_Prov_Monthly_Prcp_Thailand.geojson
data/ECMWF/SPI1/Forecast/Country/Yearly/Forecast_Country_Yearly_SPI1_SEA.geojson
data/ECMWF/Temp/Forecast/Grid/Monthly/Forecast_Grid_Monthly_Temp_Myanmar_202506.tif
```

### 3. Agricultural Variables (Area, Yield, Production)
**Path**: `data/[Variable]/[Overview]/[AdminLevel]/[TimeType]/`

**Variables**:
- `Area` - Rice cultivation area (hectares)
- `Yield` - Rice yield (tons/hectare)
- `Production` - Rice production (tons)
- `yieldAnom` - Yield anomaly (z-score)

**Example Paths**:
```
data/Area/Forecast/Prov/Monthly/Forecast_Prov_Monthly_Area_SEA.geojson
data/Yield/Forecast/Country/Yearly/Forecast_Country_Yearly_Yield_SEA.geojson
data/Production/Hist/Prov/Yearly/Hist_Prov_Yearly_Production_Thailand.geojson
```

## API Path Resolution Logic

The `get_data.js` API uses the following logic to determine file paths:

```javascript
// For ERA5/ECMWF climate variables
if (varType.startsWith("SPI") || varType === "Prcp" || varType === "Temp" || varType === "smpct1") {
    directory = path.join("ERA5", varType, overviewDir, adminLevel, dateType);
}

// For agricultural variables
else if (varType === "Area" || varType === "Production" || varType === "yieldAnom") {
    directory = path.join(varType, overviewDir, adminLevel, dateType);
}

// Special handling for Yield (legacy structure)
else if (varType === "Yield" && adminLevel === "Grid") {
    directory = "yield_grid";
} else if (varType === "Yield" && overview === "forecast" && adminLevel !== "Grid") {
    directory = "yield_json_forecast";
}
```

## Region Codes

- `SEA` - Southeast Asia (all countries combined)
- `Myanmar` - Myanmar only
- `Thailand` - Thailand only
- `Vietnam` - Vietnam only
- `Cambodia` - Cambodia only
- `Laos` - Laos only

## GeoJSON Property Structure

### Time Series Data (Monthly)
Properties contain time-indexed values:
```json
{
  "name": "Province Name",
  "y202502": 0.0,
  "y202503": 156946.39,
  "y202504": 316018.02,
  "y202505": 0.0
}
```

### Single Value Data (Yearly)
Properties contain yearly values:
```json
{
  "name": "Province Name",
  "y2024": 3.5,
  "y2025": 3.8
}
```

## Data Standardization TODOs

### High Priority
1. ✅ **Standardize ECMWF/ERA5 paths** - Use consistent `DataSource/Variable/Overview/AdminLevel/TimeType` structure
2. ✅ **Consistent file naming** - All files follow `Overview_AdminLevel_TimeType_Variable_Region` pattern
3. ⚠️ **Merge duplicate files** - Remove files with redundant naming (e.g., files with and without variable name in filename)

### Medium Priority
4. ⚠️ **Standardize Area/Yield/Production paths** - Currently using legacy structure, should migrate to standard structure
5. ⚠️ **Create separate regional files** - Split `SEA.geojson` into individual country files where appropriate
6. ⚠️ **Add metadata files** - Create JSON metadata files describing value ranges, units, and update dates

### Low Priority
7. ⚠️ **Archive legacy files** - Move old naming convention files to `data_legacy/` folder
8. ⚠️ **Create data validation scripts** - Automated checks for file structure and naming consistency

## Notes

### Current Issues Found (2025-10-09)
1. **Area data file** (`Forecast_Prov_Monthly_Area_SEA.geojson`) contains mostly Indian provinces, not true "SEA" coverage
2. **Zero values** in Area/Yield data are CORRECT - represents seasonal patterns (no rice planting in certain months)
3. **Color rendering** issue was caused by incorrect `minVal = 100000` in `colorUtils.js` - fixed to `minVal = 0`

### Migration Notes
- Legacy Yield files in `yield_json_forecast/` and `yield_grid/` folders
- Some ECMWF files have duplicate naming patterns (with and without variable in filename)
- Need to verify all files follow standard naming before cleanup

## Usage in API

When requesting data via `/api/get_data`:

```javascript
// Request parameters
{
  region: "Thailand",      // Region code
  varType: "SPI1",        // Variable type
  adminLevel: "Prov",     // Admin level
  dateType: "Monthly",    // Time type
  overview: "forecast",   // Forecast or hist
  selectedDate: "202506"  // For grid data only
}

// Resolves to file path:
// data/ERA5/SPI1/Forecast/Prov/Monthly/Forecast_Prov_Monthly_SPI1_Thailand.geojson
```

## References

- See `pages/api/get_data.js` for file path resolution logic
- See `utils/colorUtils.js` for variable-specific color scales
- See `devlog/08_duplicate_api_calls_analysis.md` for historical API optimization notes
