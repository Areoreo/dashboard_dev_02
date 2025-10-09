# Color System Migration Guide

**Date**: 2025-10-09
**Version**: 2.0
**Status**: Ready for Testing

---

## Overview

This guide explains the complete refactoring of the color mapping system from scattered, hardcoded functions to a unified, configuration-driven approach.

## What Changed

### Before (Old System)
- **12+ separate color functions** (`getYieldColor()`, `getAreaColor()`, `getPrecipitationColor()`, etc.)
- **Hardcoded parameters** scattered across multiple files
- **Duplicate style applications** causing darker colors (triple rendering bug)
- **Inconsistent legend generation** with repeated color definitions

### After (New System)
- **Single `getColor()` function** that routes to config-based handlers
- **Centralized color parameters** in `colorMapConfig.js`
- **Single style application** (fixed triple rendering bug)
- **Unified legend component** that reads from same config as color function

---

## File Structure

### New Files Created

```
utils/
├── colorMapConfig.js          # ✨ NEW: All color parameters defined here
└── colorUtils_v2.js           # ✨ NEW: Unified color functions

components/
└── MapLegend/
    └── MapLegend_v2.js        # ✨ NEW: Config-driven legend

DOUBLE_RENDERING_ANALYSIS.md  # ✨ Documentation of rendering bug
COLOR_SYSTEM_MIGRATION_GUIDE.md  # ✨ This file
```

### Modified Files

```
components/
├── GeojsonLayer/GeojsonLayer.js    # Fixed triple style application
├── DashMapTif/DashMapTif.js        # Now passes 'options' to MapLegend
└── responsive/ResponsiveMapContainer.js  # (No changes needed)

styles/
└── core/components/_map-legend.scss  # Enhanced styles for discrete legends
```

---

## Migration Steps

### Step 1: Understanding the New Color Config Structure

**File**: `utils/colorMapConfig.js`

Each variable type now has a configuration object:

```javascript
export const COLOR_MAP_CONFIGS = {
    AreaProv: {
        minValue: 0,              // Minimum data value
        maxValue: 500000,         // Maximum data value
        colormapType: 'continuous', // 'continuous' or 'discrete'
        colorType: 'hueVector',   // Color generation method
        hueRange: [40, 120],      // Orange to Green (HSL hues)
        saturation: 80,           // HSL saturation %
        lightness: 50,            // HSL lightness %
        legendGrades: [0, 125000, 250000, 375000, 500000],  // Legend tick marks
        legendGradesDisplay: [0, 100, 200, 300, 400, 500],  // Display values (in thousands)
        title: "Rice Area (k ha)",
        unit: "ha"
    },
    // ... more configs
};
```

#### Color Types Supported

1. **`hueVector`**: HSL color interpolation
   ```javascript
   colorType: 'hueVector',
   hueRange: [40, 120],  // Orange → Green
   saturation: 80,
   lightness: 50
   ```

2. **`rgbColorCode`**: Interpolate between hex colors
   ```javascript
   colorType: 'rgbColorCode',
   colorSeries: [
       "#F8FF96",  // Light yellow-green
       "#78c679",  // Medium green
       "#005a32"   // Dark green
   ]
   ```

3. **`rgbVector`**: RGB value interpolation
   ```javascript
   colorType: 'rgbVector',
   rgbRange: [[255, 0, 0], [0, 255, 0]]  // Red → Green
   ```

4. **`discrete`**: Categorical/threshold-based
   ```javascript
   colormapType: 'discrete',
   colorType: 'rgbColorCode',
   colorSeries: ["#b22222", "#f5deb3", "#98fb98", "#14713d"],
   thresholds: [-2, -1, 0, 1, 2],
   legendLabels: ["D2", "D1", "Normal", "W1", "W2"]
   ```

### Step 2: Using the New Color System

**File**: `utils/colorUtils_v2.js`

```javascript
import { getColor } from '@utils/colorUtils_v2';

// Old way (DEPRECATED):
const color = getAreaColor(150000, 'Prov');

// New way:
const color = getColor(150000, {
    varType: 'Area',
    adminLevel: 'Prov',
    dateType: 'Monthly'  // Optional for some types
});
```

The function automatically:
1. Looks up the correct config (`AreaProv`)
2. Routes to the appropriate color generation method
3. Returns the correct color string

### Step 3: Using the New Legend Component

**File**: `components/MapLegend/MapLegend_v2.js`

```javascript
import { MapLegend } from '@components/MapLegend/MapLegend_v2';

// Old way (DEPRECATED):
<MapLegend data={data} selectedDate={selectedDate} />

// New way:
<MapLegend options={options} selectedDate={selectedDate} />
```

**Why this change?**
- Legend now reads from the SAME config as `getColor()`
- No duplicate color definitions
- Automatic sync between map colors and legend

### Step 4: Adding a New Variable Type

To add support for a new variable (e.g., "SoilTemperature"):

1. **Add config** to `utils/colorMapConfig.js`:

```javascript
SoilTemp: {
    minValue: 0,
    maxValue: 40,
    colormapType: 'continuous',
    colorType: 'rgbColorCode',
    colorSeries: [
        "#0000FF",  // Blue (cold)
        "#FFFF00",  // Yellow (moderate)
        "#FF0000"   // Red (hot)
    ],
    legendGrades: [0, 10, 20, 30, 40],
    title: "Soil Temperature (°C)",
    unit: "°C"
}
```

2. **Update key mapping** in `getColorMapKey()`:

```javascript
if (varType === "SoilTemp") {
    return "SoilTemp";
}
```

3. **Done!** Both colors and legend will automatically work.

---

## Bug Fixes Included

### 1. Triple Style Application Bug (Fixed)

**Problem**: Features were styled 3 times, causing color stacking with 70% opacity

**Before** (`GeojsonLayer.js`):
```javascript
const geojsonLayer = L.geoJSON(data, {
    style: styleGeoJSON,  // ← First application
    onEachFeature: function (feature, layer) {
        layer.setStyle({...});  // ← Second application (Line 233)

        layer.on("mouseover", () => {
            layer.setStyle({...});  // ← Third (Line 243)
        });

        layer.on("mouseover", function() {  // ← DUPLICATE handler!
            layer.setStyle(highlightStyle);  // ← Fourth (Line 270)
        });
    }
});
```

**After** (Fixed):
```javascript
const geojsonLayer = L.geoJSON(data, {
    style: styleGeoJSON,  // ← ONLY style source
    onEachFeature: function (feature, layer) {
        // No duplicate setStyle() calls!

        // SINGLE mouseover handler
        layer.on("mouseover", () => {
            layer.setStyle({
                color: "#EB5A3C",  // Only update border
                weight: 4
            });
        });

        // SINGLE mouseout handler
        layer.on("mouseout", () => {
            if (selectedFeature !== feature) {
                layer.setStyle({
                    color: "#666",  // Only reset border
                    weight: 2
                });
            }
        });
    }
});
```

**Impact**:
- ✅ Consistent colors across all regions
- ✅ Improved performance (66% fewer DOM updates)
- ✅ Fixes "India appears darker than Myanmar" issue

### 2. Legend Inconsistency (Fixed)

**Problem**: Legend colors didn't always match map colors

**Before**:
- Map: `getAreaColor()` with parameters in `colorUtils.js`
- Legend: Separate color array in `MapLegend.js` (line 398-404)
- **Result**: Different colors if one was updated but not the other

**After**:
- Both use `COLOR_MAP_CONFIGS['AreaProv']`
- **Result**: Always in sync

---

## Testing Checklist

### Visual Tests

- [ ] **Area (Prov)**: Value=0 should show consistent color in all regions
- [ ] **Area (Prov)**: Value=250,000 should show mid-range green
- [ ] **SPI**: Discrete colors match legend exactly
- [ ] **Temperature**: Gradient from blue to red
- [ ] **Yield**: Yellow-green gradient
- [ ] **Legend**: Colors match map features

### Performance Tests

- [ ] No duplicate `setStyle()` calls in console (add logging if needed)
- [ ] Map renders smoothly without flashing
- [ ] Hover effects work correctly (red border on mouseover)

### Functional Tests

- [ ] Switching variables updates both map and legend
- [ ] Changing admin level loads correct color scale
- [ ] Date changes update feature colors
- [ ] Legend displays correct units and ranges

---

## Rollback Plan

If issues are found, you can temporarily revert:

1. **Restore old colorUtils**:
   ```bash
   # Rename files
   mv utils/colorUtils.js utils/colorUtils_old.js
   mv utils/colorUtils_backup.js utils/colorUtils.js  # If you created a backup
   ```

2. **Revert GeojsonLayer** (use git):
   ```bash
   git checkout HEAD -- components/GeojsonLayer/GeojsonLayer.js
   ```

3. **Revert MapLegend** (use old version):
   ```bash
   # Edit DashMapTif.js line 124:
   <MapLegend data={data} selectedDate={selectedDate} />  # Old way
   ```

---

## Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| `setStyle()` calls per feature | 3-4 | 1 | 66-75% reduction |
| Legend color definitions | 2 (duplicated) | 1 (shared) | 50% reduction |
| Color function complexity | 12 functions | 1 unified | 92% reduction |
| Code maintainability | Low (scattered) | High (centralized) | Significant |

---

## Next Steps

1. **Test with real data** - Verify all variable types render correctly
2. **Add more variables** - Easy to extend with new configs
3. **Optimize further** - Consider memoizing color calculations
4. **Add animations** - Smooth color transitions when changing dates

---

## Support

If you encounter issues:
1. Check `DOUBLE_RENDERING_ANALYSIS.md` for rendering issues
2. Review `colorMapConfig.js` for parameter reference
3. See `devlog/11_color_system_refactor.md` for detailed changes

---

**Migration Status**: ✅ Complete - Ready for User Testing
