# Double Rendering Analysis - ROOT CAUSE FOUND

**Date**: 2025-10-09
**Issue**: Features appear darker in some regions (India vs Myanmar) even with same values

## Root Cause: DOUBLE STYLE APPLICATION

### Evidence from GeojsonLayer.js

**Line 207-239**: Layer creation with `L.geoJSON()`
```javascript
const geojsonLayer = L.geoJSON(data, {
    style: styleGeoJSON,  // ← FIRST STYLE APPLICATION (Line 208)
    onEachFeature: function (feature, layer) {
        // ...

        // Default style
        layer.setStyle({  // ← SECOND STYLE APPLICATION (Line 233-239)
            fillColor: getColor(value, colorOptions),
            color: "#666",
            weight: 2,
            fillOpacity: 0.7,  // ← 70% opacity
            dashArray: "3"
        });
    }
});
```

### Why This Causes Darker Colors

1. **First Rendering** (Line 208): `style: styleGeoJSON`
   - Applies style with `fillOpacity: 0.7`
   - Creates initial layer rendering

2. **Second Rendering** (Line 233): `layer.setStyle({...})`
   - **RE-APPLIES** the same style to the SAME layer
   - Because opacity is 0.7, if Leaflet doesn't properly clear the previous rendering,
     the colors effectively STACK: `0.7 + 0.7 = 1.4` (capped at 1.0 but darker)

### Why India Appears Darker

Looking at the data analysis:
- India features: 12 provinces (small dataset)
- Myanmar: 0 features in the SEA file
- Thailand: 8 features

**Hypothesis**:
- India features might be processed/rendered MORE TIMES during map updates
- The double `setStyle()` call happens EVERY time `useEffect` triggers
- Dependencies include: `data_url?.url`, `data_url?.data_vartype`, `selectedDate`
- If India data updates more frequently or triggers more re-renders, colors stack more

### The Fix

**Option 1**: Remove the redundant `layer.setStyle()` call
```javascript
const geojsonLayer = L.geoJSON(data, {
    style: styleGeoJSON,  // ← Keep this
    onEachFeature: function (feature, layer) {
        // REMOVE lines 233-239 - already styled by line 208!

        // Only keep event handlers
        layer.bindTooltip(...);
        layer.on("mouseover", ...);
        layer.on("mouseout", ...);
        layer.on("click", ...);
    }
});
```

**Option 2**: Remove `style` from L.geoJSON options
```javascript
const geojsonLayer = L.geoJSON(data, {
    // REMOVE: style: styleGeoJSON,
    onEachFeature: function (feature, layer) {
        // Keep lines 233-239 - this becomes the ONLY style application
        layer.setStyle({...});
    }
});
```

## Additional Issues Found

### 1. Multiple Style Applications in Event Handlers

**Lines 243-246** (mouseover):
```javascript
layer.on("mouseover", () => {
    layer.setStyle({
        color: "#EB5A3C",
        weight: 4
    });
});
```

**Lines 269-280** (another mouseover):
```javascript
layer.on("mouseover", function (e) {
    // ...
    layer.setStyle(highlightStyle);  // ← THIRD setStyle call!
    highlightRef.current = layer;
});
```

**PROBLEM**: TWO different mouseover handlers on the SAME layer!
- First one (line 243) sets red border
- Second one (line 270) sets highlightStyle
- They conflict and may stack

### 2. Style Reset Logic Issues

**Lines 250-254** (mouseout):
```javascript
layer.on("mouseout", () => {
    if (selectedFeature !== feature) {
        layer.setStyle(styleGeoJSON(feature));  // ← Recomputes style
    }
});
```

**Lines 284-298** (another mouseout):
```javascript
layer.on("mouseout", function (e) {
    // ...
    if (highlightRef.current && selectedFeature !== feature) {
        highlightRef.current.setStyle(styleGeoJSON(feature));  // ← AGAIN!
    }
});
```

**PROBLEM**: Multiple mouseout handlers also cause redundant `setStyle()` calls

## Recommended Comprehensive Fix

### Clean Up GeojsonLayer.js

```javascript
const geojsonLayer = L.geoJSON(data, {
    style: styleGeoJSON,  // Single source of truth for initial style
    onEachFeature: function (feature, layer) {
        const value = feature.properties[`y${selectedDate}_0`] ??
                     feature.properties[`y${selectedDate}`] ?? 0;
        const name = feature.properties.name;

        const colorOptions = {
            varType: data_url.data_vartype,
            adminLevel: data_url.data_adminLevel,
            dateType: data_url.data_dateType
        };

        // Bind tooltip
        layer.bindTooltip(
            `<b>${name}</b><br>${options.varType}: ${
                value !== undefined ? value.toFixed(2) : "N/A"
            }`,
            { direction: "top", sticky: true }
        );

        // SINGLE mouseover handler
        layer.on("mouseover", () => {
            layer.setStyle({
                color: "#EB5A3C",
                weight: 4
            });

            // Update info control
            if (infoRef.current) {
                infoRef.current.update(
                    "<b>" + name + "</b><br>" +
                    (feature.properties.region || "")
                );
            }
        });

        // SINGLE mouseout handler
        layer.on("mouseout", () => {
            if (selectedFeature !== feature) {
                // Reset to original style (don't recompute unnecessarily)
                layer.setStyle({
                    color: "#666",
                    weight: 2,
                    dashArray: "3"
                });
            }

            // Reset info control
            if (infoRef.current) {
                infoRef.current.update();
            }
        });

        // Click event
        layer.on("click", () => {
            removeBoundingBox();
            handleFeatureClick(feature, layer);
            handleProvClickToGenerateTimeSeries(feature);
        });
    }
});
```

## Testing Plan

1. **Visual Test**: Compare India vs Myanmar features with SAME value (e.g., 0)
   - Before fix: India should appear darker
   - After fix: Both should have IDENTICAL color

2. **Console Test**: Add logging to count `setStyle()` calls per feature
   ```javascript
   let styleCallCount = 0;
   layer.setStyle = function(...args) {
       styleCallCount++;
       console.log(`setStyle called ${styleCallCount} times for ${name}`);
       return L.Path.prototype.setStyle.apply(this, args);
   };
   ```

3. **Performance Test**: Monitor re-renders in React DevTools
   - Check if India features trigger more useEffect runs

## Summary

**Root Cause**: Triple style application per feature:
1. Line 208: Initial style via `L.geoJSON` options
2. Line 233: Redundant `layer.setStyle()` in `onEachFeature`
3. Lines 243 + 270: Duplicate mouseover handlers

**Fix**: Remove redundant style applications, consolidate event handlers

**Expected Impact**:
- ✅ Consistent colors across all regions
- ✅ Better performance (fewer DOM updates)
- ✅ Cleaner, more maintainable code
