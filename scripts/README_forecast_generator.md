# Forecast Placeholder Generation Script

## Overview

This script (`generate_forecast_placeholders.py`) standardizes data file names and generates forecast placeholders by copying 2019-2020 historical data to 2025-2026.

## Purpose

Due to the lack of actual forecast data, this script creates placeholder forecast files to enable testing and development of forecast visualization features in the dashboard.

## What It Does

1. **Standardizes File Names**: Ensures all data files follow the naming convention:
   - GeoJSON: `{overview}_{adminLevel}_{dateType}_{varType}_{region}.geojson`
   - TIF: `{overview}_{adminLevel}_{dateType}_{varType}_{region}_{date}.tif`

2. **Generates Forecast Data**:
   - Copies 2019 historical data → 2025 forecast data
   - Copies 2020 historical data → 2026 forecast data
   - Updates dates in TIF filenames
   - Updates timestamps in GeoJSON properties (e.g., `y201901` → `y202501`)

## Variables Processed

- **Yield**: Rice yield data
- **Area**: Rice cultivation area data
- **Production**: Rice production data
- **yieldAnom**: Yield anomaly data

## Data Structure

The script expects data to be organized in the following structure:

```
data/
├── ERA5/
│   ├── Yield/
│   │   ├── Hist/
│   │   │   ├── Country/
│   │   │   │   ├── Monthly/
│   │   │   │   └── Yearly/
│   │   │   ├── Prov/
│   │   │   │   ├── Monthly/
│   │   │   │   └── Yearly/
│   │   │   └── Grid/
│   │   │       ├── Monthly/
│   │   │       └── Yearly/
│   │   └── Forecast/
│   │       └── [same structure as Hist]
│   ├── Area/
│   ├── Production/
│   └── yieldAnom/
```

## Usage

### Prerequisites

- Python 3.6+
- Standard library only (no external dependencies)

### Running the Script

1. **Dry-run mode** (recommended first):
   ```bash
   cd /path/to/dashboard_dev_02
   echo "dry-run" | python3 scripts/generate_forecast_placeholders.py
   ```

   This will show what changes would be made without actually modifying any files.

2. **Execute changes**:
   ```bash
   echo "yes" | python3 scripts/generate_forecast_placeholders.py
   ```

### Interactive Mode

You can also run the script interactively:

```bash
python3 scripts/generate_forecast_placeholders.py
```

When prompted, enter:
- `yes` or `y`: Execute changes
- `dry-run` or `dry`: Show what would be done without modifying files
- `no` or `n`: Cancel operation

## Examples

### Example 1: TIF File Processing

**Input (Historical)**:
```
data/ERA5/Yield/Hist/Grid/Monthly/SEA_yield_monthly_201901.tif
```

**Standardized Name**:
```
data/ERA5/Yield/Hist/Grid/Monthly/Hist_Grid_Monthly_Yield_SEA_201901.tif
```

**Output (Forecast)**:
```
data/ERA5/Yield/Forecast/Grid/Monthly/Forecast_Grid_Monthly_Yield_SEA_202501.tif
```

### Example 2: GeoJSON File Processing

**Input (Historical)**:
```
data/ERA5/Area/Hist/Country/Monthly/Hist_Country_Monthly_Area_SEA.geojson
```

**GeoJSON Content Before**:
```json
{
  "type": "Feature",
  "properties": {
    "name": "Cambodia",
    "y201901": 544000.0,
    "y201902": 0.0,
    ...
  }
}
```

**Output (Forecast)**:
```
data/ERA5/Area/Forecast/Country/Monthly/Forecast_Country_Monthly_Area_SEA.geojson
```

**GeoJSON Content After**:
```json
{
  "type": "Feature",
  "properties": {
    "name": "Cambodia",
    "y202501": 544000.0,
    "y202502": 0.0,
    ...
  }
}
```

## File Naming Conventions

### Standard Format

**Pattern**: `{overview}_{adminLevel}_{dateType}_{varType}_{region}[_{date}].{extension}`

**Components**:
- `{overview}`: `Hist` or `Forecast`
- `{adminLevel}`: `Country`, `Prov`, or `Grid`
- `{dateType}`: `Monthly` or `Yearly`
- `{varType}`: `Yield`, `Area`, `Production`, or `yieldAnom`
- `{region}`: Country/region code (e.g., `SEA`, `Cambodia`, `Vietnam`)
- `{date}`: Optional date suffix (e.g., `201901` for Jan 2019, `2019` for year 2019)

### Alternative Formats Supported

The script can parse and standardize the following legacy formats:

1. **Format**: `{region}_{varType}_{dateType}_{date}.tif`
   - Example: `SEA_yield_monthly_201901.tif`

2. **Format**: `{region}_{dateType}_{varType}_{adminLevel}.geojson`
   - Example: `SEA_monthly_yield_province.geojson`

3. **Format**: `{region}_{varType}.geojson`
   - Example: `SEA_yield.geojson`

## GeoJSON Timestamp Format

GeoJSON files use property keys with year-month format:

- **Monthly**: `y{YYYY}{MM}` (e.g., `y201901` for January 2019)
- **Yearly**: `y{YYYY}` (e.g., `y2019` for year 2019)

The script automatically updates these timestamps when generating forecast data.

## Notes

- The script preserves the actual raster/vector data; only metadata (filenames, timestamps) are modified
- For GeoJSON files, the script also updates the `name` field if it contains year references
- The script creates necessary directory structures automatically
- Existing forecast files are not overwritten unless explicitly confirmed

## Troubleshooting

### Issue: Files not being processed

**Solution**: Check that:
1. Files are in the correct directory structure (`data/ERA5/{varType}/Hist/...`)
2. Files contain 2019 or 2020 in their names or content
3. Files have `.geojson` or `.tif` extensions

### Issue: Filename parsing errors

**Solution**: The script logs warnings for files it cannot parse. Check the console output for:
```
WARNING: Cannot parse {filename}, skipping
```

You may need to manually rename these files to match one of the supported formats.

## Output

The script will:

1. Display all planned operations (in dry-run mode)
2. Show progress for each variable type
3. List all renamed files
4. List all generated forecast files
5. Report any errors encountered

Example output:
```
============================================================
Processing variable: Area
============================================================

  Processing directory: data/ERA5/Area
    Standardizing filenames in: data/ERA5/Area/Hist
      Rename: SEA_area_monthly.geojson -> Hist_Country_Monthly_Area_SEA.geojson
    Generating forecast placeholders...
      Processing: ERA5/Area/Hist/Grid/Monthly
        Copy TIF: Hist_Grid_Monthly_Area_SEA_201901.tif -> Forecast_Grid_Monthly_Area_SEA_202501.tif
        Copy TIF: Hist_Grid_Monthly_Area_SEA_201902.tif -> Forecast_Grid_Monthly_Area_SEA_202502.tif
        ...
```

## Safety Features

- **Dry-run mode**: Test before making changes
- **No overwrite**: Existing files are preserved
- **Error handling**: Graceful failure with error messages
- **Backup recommendation**: Always backup your data before running the script

## Future Enhancements

Potential improvements:
- Add support for more date formats
- Include data validation
- Add progress bars for large datasets
- Support for batch year processing
- Configuration file for custom year mappings
