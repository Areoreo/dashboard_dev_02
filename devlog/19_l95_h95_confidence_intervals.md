# DevLog 19: L95/H95 Confidence Intervals Support

**Date**: 2025-10-27
**Status**: ✅ Complete

## Overview

Added support for displaying lower and upper 95% confidence intervals (L95 and H95) in ensemble forecast charts. These statistics are present in the new Yield forecast data and needed to be detected, extracted, and visualized alongside existing min/max/mean statistics.

## Changes Made

### 1. TimeSeriesProcessor.js

**Location**: `components/ChartComponent/TimeSeriesProcessor.js`

**Initial Implementation:**
- **Line 137-200**: Extended `createSeriesFromGroup()` to create L95 and H95 series for ensemble data
  - Added `l95Series` with plotType 'l95'
  - Added `h95Series` with plotType 'h95'
  - Both extract values from `entry.statistics?.l95` and `entry.statistics?.h95`

- **Line 451**: Extended legacy format detection to recognize `l95` and `h95` suffixes
  - Updated condition: `suffix === "mean" || suffix === "min" || suffix === "max" || suffix === "l95" || suffix === "h95"`
  - These suffixes now properly categorized as statistics

**Bug Fix (Single-Value Data with Statistics):**
- **Line 498-501**: Attach statistics to single-value entries
  - Problem: Data with only `y202510`, `y202510_l95`, `y202510_h95` (no ensemble members) was treated as simple single-value
  - Fix: Attach statistics object to single-value entries when present

- **Line 99-192**: Extended `createSeriesFromGroup()` to handle single-value data with statistics
  - Detects if single-value data has statistics (l95, h95, min, max)
  - If statistics exist, creates multiple series (main value + l95 + h95 + min + max)
  - Each statistic series is only created if it has non-null data
  - Returns array of series instead of single series when statistics present

### 2. ChartRenderers_v2.js

**Location**: `components/ChartComponent/ChartRenderers_v2.js`

**Initial Implementation:**
- **Line 139-145**: Added series extraction for l95 and h95 in `createEnsembleChart()`
  ```javascript
  const l95Series = series.find((s) => s.plotType === "l95");
  const h95Series = series.find((s) => s.plotType === "h95");
  ```

- **Line 203-241**: Added rendering for L95 and H95 datasets
  - L95: Orange dashed line `rgba(255, 159, 64, 1)` with `borderDash: [5, 5]`
  - H95: Purple dashed line `rgba(153, 102, 255, 1)` with `borderDash: [5, 5]`
  - Both have conditional rendering: only render if data exists (non-null values)
  - Similar styling to min/max: borderWidth 2, no point markers except on hover

- **Line 674-675**: Added labels to `getSeriesLabel()`
  ```javascript
  l95: "L95",
  h95: "H95"
  ```

- **Line 690-691**: Added colors to `getSeriesColor()`
  ```javascript
  l95: "rgba(255, 159, 64, 1)",
  h95: "rgba(153, 102, 255, 1)"
  ```

- **Line 722-723**: Added border widths to `getSeriesBorderWidth()`
  ```javascript
  l95: 2,
  h95: 2
  ```

**Bug Fix (Chart Type Detection):**
- **Line 63-76**: Enhanced chart type detection in `createChart()`
  - Problem: Single-value data with l95/h95 was using time series chart which doesn't render statistics
  - Fix: Detect presence of min/max/l95/h95 series and use ensemble chart renderer
  - Added `hasStatistics` check for min/max/l95/h95 plot types

- **Line 140, 248-266**: Added singleValue series rendering in ensemble chart
  - Problem: Ensemble chart only rendered ensemble members and mean, not singleValue
  - Fix: Extract and render singleValue series when present
  - Displays as "Value" with same styling as Mean (thick teal line on top)

### 3. ChartDataProcessor_v2.js

**Location**: `components/ChartComponent/ChartDataProcessor_v2.js`

- **Line 187-188**: Added labels for CSV export
  ```javascript
  'l95': 'L95',
  'h95': 'H95'
  ```

## Data Format

The new Yield forecast data files contain properties like:
```javascript
{
  "y202510": 3.178,         // Main value
  "y202510_l95": 3.076,     // Lower 95% CI
  "y202510_h95": 3.289      // Upper 95% CI
}
```

**Important**: This data has NO ensemble members (no `_0`, `_1`, etc.) and NO `_mean` suffix.

These are automatically detected by the legacy format parser and converted to:
```javascript
{
  date: "2025-10-01",
  type: "single",           // NOT ensemble!
  value: 3.178,
  statistics: {
    l95: 3.076,
    h95: 3.289
  }
}
```

The processor then creates multiple series from this single-value entry with statistics.

## Visual Appearance

- **L95 (Lower 95% CI)**: Orange dashed line below mean
- **H95 (Upper 95% CI)**: Purple dashed line above mean
- Both use dashed pattern `[5, 5]` to distinguish from solid min/max lines
- Conditional rendering: only show if data contains non-null values

## Behavior

1. **Detection**: Automatically detects `_l95` and `_h95` suffixes in legacy property keys
2. **Extraction**: Groups with other ensemble statistics (mean, min, max)
3. **Rendering**: Conditionally renders only when data exists
4. **Legend**: Shows "L95" and "H95" in chart legend when present
5. **Tooltips**: Click tooltips work for L95/H95 lines (inherited from ensemble chart behavior)

## Bug Fix Summary

### Issue
After initial implementation, l95/h95 lines were not showing up for Yield forecast data.

### Root Cause
1. Data has no ensemble members (`_0`, `_1`) and no `_mean` - just `y202510`, `y202510_l95`, `y202510_h95`
2. Data was classified as `'single'` type, not `'ensemble'`
3. Statistics (l95, h95) were not attached to single-value entries
4. `createSeriesFromGroup()` only created statistics series for ensemble type
5. Chart type detection used time-series chart which doesn't render statistics

### Solution
1. Attach statistics to single-value entries when present (Line 498-501)
2. Detect statistics in single-value data and create multiple series (Line 99-192)
3. Enhanced chart type detection to use ensemble chart when statistics present (Line 63-76)
4. Added singleValue rendering to ensemble chart (Line 248-266)

## Testing Notes

- Test with Province-level Yield data: `data/ERA5/Yield/Forecast/Prov/Monthly/`
- Country-level data may not have l95/h95 (conditional rendering handles this)
- Verify dashed lines appear distinct from solid min/max lines
- Verify main "Value" line renders along with l95/h95 for single-value data with statistics

## Related Files

- `data/ERA5/Yield/Forecast/Prov/Monthly/*.geojson` (contains l95/h95 data)
- Chart component architecture remains unchanged (v2 components)

---

**Implementation Time**:
- Initial implementation: ~15 minutes (~60 lines)
- Bug fix and debugging: ~30 minutes (~90 additional lines)
- Total: ~45 minutes, ~150 lines across 3 files

**Key Takeaway**: Data without ensemble members but with statistics (l95/h95) requires special handling as "single-value with statistics" rather than true ensemble data.
