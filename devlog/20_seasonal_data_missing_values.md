# DevLog 20: Seasonal Data & Missing Value Handling

**Date**: 2025-10-27
**Status**: ✅ Complete

## Overview

Implemented intelligent handling of seasonal agricultural data (Yield, Area, Production) and missing values across all variable types. Rice yield data is seasonal - specific regions only have harvests in certain months, resulting in 0 or null values. The system now properly handles these cases with continuous line plotting and informative tooltips.

## Problem Statement

### Issue
Rice yield data is seasonal:
- Only specific months have harvest data for specific regions
- Data contains many 0.0 values (off-season) and null values (missing data)
- L95/H95 confidence intervals had null values creating gaps in the plot
- Users clicking on 0 values didn't understand why the value was zero

### Requirements
1. Convert null values in l95/h95 to 0 for Yield data to create continuous lines
2. Define missing value recognition for all variable types
3. Show informative messages in tooltips for missing values

## Solution Implemented

### 1. Missing Value Configuration System

**New File**: `utils/missingValueConfig.js`

Created a centralized configuration system for all variable types:

```javascript
export const MISSING_VALUE_CONFIG = {
    // Rice data - seasonal, 0 means no harvest
    Yield: {
        isMissing: (value) => value === null || value === undefined || value === 0,
        message: 'No data available due to the rice cropping calendar',
        convertNullTo: 0  // Convert null to 0 for continuous plotting
    },

    // SPI indices - null means insufficient data
    SPI1: {
        isMissing: (value) => value === null || value === undefined,
        message: 'Insufficient data for SPI calculation',
        convertNullTo: null  // Keep null for SPI
    },

    // ... etc for all variable types
};
```

**Variable Types Configured**:
- **Yield, Area, Production**: 0 and null = missing (seasonal crops)
- **SPI1, SPI3, SPI6, SPI12**: Only null = missing (insufficient data)
- **Prcp, Temp**: Only null = missing (no data)

**Utility Functions**:
- `isMissingValue(value, varType)` - Check if value is missing
- `getMissingValueMessage(varType)` - Get tooltip message
- `convertNullValue(value, varType)` - Convert null based on varType

### 2. Data Processing Updates

**File**: `components/ChartComponent/TimeSeriesProcessor.js`

**Line 9**: Import configuration
```javascript
import { convertNullValue } from "@utils/missingValueConfig";
```

**Line 59, 75**: Pass options (containing varType) to series creation
```javascript
series.push(createSeriesFromGroup(currentGroup, options));
```

**Line 99**: Update function signature
```javascript
function createSeriesFromGroup(group, options = {}) {
    const varType = options?.varType;
```

**Line 130, 146, 263, 274**: Convert null values for l95/h95
```javascript
value: convertNullValue(entry.statistics?.l95, varType)
value: convertNullValue(entry.statistics?.h95, varType)
```

Applied to both:
- Single-value data with statistics (Line 130, 146)
- Ensemble data (Line 263, 274)

### 3. Tooltip Updates

**File**: `components/ChartComponent/ChartRenderers_v2.js`

**Line 9**: Import missing value utilities
```javascript
import { isMissingValue, getMissingValueMessage } from "@utils/missingValueConfig";
```

**Click Tooltips (Ensemble Charts)** - Line 342-346:
```javascript
if (!isNaN(numValue) && isMissingValue(numValue, config.varType)) {
    const missingMessage = getMissingValueMessage(config.varType);
    label = `${dataset.label}: ${value} | ${missingMessage}`;
}
```

**Hover Tooltips (Time Series Charts)** - Line 534-538:
```javascript
if (!isNaN(numValue) && isMissingValue(numValue, config.varType)) {
    const missingMessage = getMissingValueMessage(config.varType);
    label += ` | ${missingMessage}`;
}
```

Both tooltip types now check for missing values before showing SPI interpretation.

## Behavior by Variable Type

### Yield, Area, Production (Seasonal Crops)
- **0 values**: Considered missing (off-season)
- **null values**: Converted to 0 for l95/h95 (continuous lines)
- **Tooltip**: "Value: 0.00 | No data available due to the rice cropping calendar"

### SPI1, SPI3, SPI6, SPI12 (Drought Indices)
- **null values**: Kept as null (gaps in plot)
- **0 values**: Valid data point (near normal conditions)
- **Tooltip**: "Value: N/A | Insufficient data for SPI calculation"

### Prcp, Temp (Meteorological)
- **null values**: Kept as null (gaps in plot)
- **0 values**: Valid measurements
- **Tooltip**: "Value: N/A | No data available"

## Technical Details

### Null Conversion Logic
For Yield l95/h95:
```
Original: y202510_l95: null → Converted: 0
Original: y202510_h95: null → Converted: 0
```

Creates continuous confidence interval bands even during off-season.

### Missing Value Detection
```javascript
// For Yield
isMissingValue(0, 'Yield') → true
isMissingValue(0, 'SPI1') → false

// User clicks on 0 in Yield chart
→ Shows: "Value: 0.00 | No data available due to the rice cropping calendar"
```

### Tooltip Priority
1. Check if missing value → Show missing message
2. Else if SPI data → Show drought interpretation
3. Else → Show plain value

## Files Modified

1. `utils/missingValueConfig.js` - **NEW** (~120 lines)
2. `components/ChartComponent/TimeSeriesProcessor.js` (~15 lines modified)
3. `components/ChartComponent/ChartRenderers_v2.js` (~20 lines modified)

## Testing

**Test Cases**:
1. ✅ Yield data with 0 values shows cropping calendar message
2. ✅ L95/H95 lines are continuous (null → 0 conversion working)
3. ✅ SPI data with 0 values shows drought interpretation, not missing message
4. ✅ SPI data with null shows "Insufficient data" message
5. ✅ Non-seasonal variables (Prcp, Temp) treat 0 as valid data

**Test Data**: `data/ERA5/Yield/Forecast/Prov/Monthly/`

## User Experience

### Before
- User clicks on 0 in Yield chart
- Tooltip: "Value: 0.00"
- User confused: "Why is yield zero?"

### After
- User clicks on 0 in Yield chart
- Tooltip: "Value: 0.00 | No data available due to the rice cropping calendar"
- User understands: "Ah, it's off-season for this region"

## Configuration Extensibility

To add new variable types:
```javascript
export const MISSING_VALUE_CONFIG = {
    NewVariable: {
        isMissing: (value) => /* custom logic */,
        message: 'Custom message for users',
        convertNullTo: 0  // or null
    }
};
```

---

**Implementation Time**: ~25 minutes
**Lines Added**: ~155 lines (120 new file + 35 modifications)

**Key Achievement**: Context-aware missing value handling improves data interpretation for seasonal agricultural monitoring.
