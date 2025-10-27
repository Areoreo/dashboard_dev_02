# GeoTIFF Layer Flashing/Disappearing Issue Fix

**Date:** 2025-10-08
**Issue:** GeoTIFF (Grid) data flashes and disappears. Forecast TIF data flashes briefly, historical TIF data shows nothing.

## Problem Investigation

### Symptoms
1. **Forecast GeoTIFF**: Layer appears briefly then disappears
2. **Historical GeoTIFF**: Layer doesn't appear at all
3. **GeoJSON layers**: Work correctly (Country/Prov levels)

### Data Structure Analysis

#### How GeoTIFF Data is Saved
GeoTIFF files are binary raster data files stored in `/data/` directory with structure:
```
/data/{VarType}/{Forecast|Hist}/{AdminLevel}/{DateType}/{filename}.tif
```

Example:
```
/data/Yield/Forecast/Grid/Monthly/Forecast_Grid_Monthly_Yield_SEA_202510.tif
```

#### How Data is Transferred

**1. API Endpoint (`pages/api/get_data.js`)**
```javascript
if (adminLevel === "Grid") {
    // Serves GeoTIFF as binary stream
    res.setHeader("Content-Type", "application/octet-stream");
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);  // Streams raw binary data
}
```

**2. Parent Component (`pages/rice-map.js`)**
```javascript
if (adminLevel === "Grid") {
    const arrayBuffer = await response.arrayBuffer();  // Fetch once
    setMapData({
        data: arrayBuffer,  // Pass actual binary data
        url: response.url,
        datatype: "geotiff",
        data_vartype: varType,
        data_adminLevel: adminLevel,
        data_dateType: dateType
    });
}
```

**3. Child Component (`components/GeoTiffLayer/GeoTiffLayer.js`)**
```javascript
// BEFORE (was fetching again):
const response = await fetch(data_url.url);
const arrayBuffer = await response.arrayBuffer();

// AFTER (uses passed data):
const arrayBuffer = data_url.data;  // Direct use - no fetch
```

#### Data Flow Diagram
```
User changes option
  ↓
Parent fetchData()
  ↓
Fetch /api/get_data (returns ArrayBuffer)
  ↓
setMapData({ data: arrayBuffer, ... })
  ↓
GeoTiffLayer receives data_url prop
  ↓
useEffect triggered
  ↓
georaster(arrayBuffer) → Parse GeoTIFF
  ↓
GeoRasterLayer created and added to map
```

## Root Cause Identified

### Issue 1: Unstable Dependency Array (PRIMARY CAUSE)

**Problem:** The `useEffect` dependency array included **object references** that changed on every render:

```javascript
// BEFORE - BROKEN:
const colorOptions = {  // ❌ New object every render!
    varType: data_url.data_vartype,
    adminLevel: data_url.data_adminLevel,
    dateType: data_url.data_dateType
};

useEffect(() => {
    loadGeoTIFFData();
}, [map, data_url.data, selectedDate, data_url.data_vartype, colorOptions, options]);
//                                                                   ^^^^^^^^^^^  ^^^^^^^^
//                                                                   Always new objects!
```

**What happened:**
1. Component renders
2. `colorOptions` object created (new reference)
3. `options` prop is an object (new reference on parent re-render)
4. useEffect sees "new" dependencies
5. Cleanup function runs → removes layer from map
6. loadGeoTIFFData() runs → adds layer back
7. Infinite loop of remove/add → **FLASHING**

**Why historical data showed nothing:**
- The layer was being added and removed so fast that it never had time to fully render
- Race condition between removal and rendering

### Issue 2: Missing Data Check

```javascript
// BEFORE:
const arrayBuffer = data_url.data;  // Could be undefined initially
const parsedRaster = await georaster(arrayBuffer);  // Crash!
```

No check for whether `data_url.data` exists before processing.

## Solutions Implemented

### Fix 1: Stabilize Dependencies (GeoTiffLayer.js)

**Remove object dependencies:**
```javascript
// BEFORE:
}, [map, data_url.data, selectedDate, data_url.data_vartype, colorOptions, options]);

// AFTER:
}, [map, data_url?.url, data_url?.data_vartype, selectedDate]);
//       ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^
//       Primitive values - stable references!
```

**Move colorOptions inside useEffect:**
```javascript
// BEFORE (outside useEffect):
const colorOptions = { varType: ..., adminLevel: ..., dateType: ... };

// AFTER (inside useEffect):
useEffect(() => {
    const loadGeoTIFFData = async () => {
        // Create colorOptions here - not recreated unless effect runs
        const colorOptions = {
            varType: data_url.data_vartype,
            adminLevel: data_url.data_adminLevel,
            dateType: data_url.data_dateType
        };
        // ... use colorOptions
    };
}, [map, data_url?.url, data_url?.data_vartype, selectedDate]);
```

### Fix 2: Add Data Existence Check

```javascript
useEffect(() => {
    const loadGeoTIFFData = async () => {
        try {
            // Remove existing layer
            if (rasterLayerRef.current) {
                map.removeLayer(rasterLayerRef.current);
                rasterLayerRef.current = null;
            }

            // ✅ Check if data exists
            if (!data_url || !data_url.data) {
                console.log("No GeoTIFF data available yet");
                return;
            }

            const arrayBuffer = data_url.data;
            // ... rest of processing
        }
    };
}, [map, data_url?.url, data_url?.data_vartype, selectedDate]);
```

### Fix 3: Apply Same Fix to GeojsonLayer

Same issue existed in GeojsonLayer - fixed with same approach:

```javascript
// BEFORE:
}, [map, selectedDate, data_url.data, options, selectedFeature, ...]);

// AFTER:
}, [map, selectedDate, data_url?.url, data_url?.data_vartype, ...]);
```

## Technical Deep Dive

### Why Objects in Dependencies Cause Issues

React compares dependencies using `Object.is()` (similar to `===`):

```javascript
const obj1 = { a: 1 };
const obj2 = { a: 1 };
console.log(obj1 === obj2);  // false - different references!
```

**Every render creates new objects:**
```javascript
function Component() {
    const colorOptions = { varType: "Yield" };  // New object EVERY render

    useEffect(() => {
        // This runs on EVERY render because colorOptions is always "new"
    }, [colorOptions]);  // ❌ Unstable dependency
}
```

**Solution - Use primitive values:**
```javascript
function Component({ data_url }) {
    useEffect(() => {
        const colorOptions = { varType: data_url.data_vartype };  // Created only when effect runs
    }, [data_url?.data_vartype]);  // ✅ Stable primitive
}
```

### ArrayBuffer Transfer

**ArrayBuffer** is a JavaScript object representing binary data:
- Not a simple value type
- But passed **by reference** (not copied)
- Efficient for large binary files (GeoTIFF can be MBs)
- No performance penalty passing between components

```javascript
// Parent fetches:
const arrayBuffer = await response.arrayBuffer();  // e.g., 2MB GeoTIFF
setMapData({ data: arrayBuffer });  // Stores reference, not copy

// Child receives:
const arrayBuffer = data_url.data;  // Same reference - no copy!
```

## Files Modified

1. **`components/GeoTiffLayer/GeoTiffLayer.js`**
   - Moved `colorOptions` inside useEffect
   - Added data existence check
   - Fixed dependency array
   - Added console logging for debugging

2. **`components/GeojsonLayer/GeojsonLayer.js`**
   - Fixed dependency array to use primitive values

## Testing Results

**Before Fix:**
- ❌ GeoTIFF layers flash and disappear
- ❌ useEffect runs continuously (infinite loop)
- ❌ Console shows repeated "Processing GeoTIFF data" messages
- ❌ Map unusable for Grid admin level

**After Fix:**
- ✅ GeoTIFF layers render and stay visible
- ✅ useEffect runs only when data actually changes
- ✅ Console shows single "Processing GeoTIFF data" per data load
- ✅ Map stable and functional

## Key Learnings

### ⚠️ React useEffect Best Practices

1. **Avoid objects in dependency arrays**
   - Use primitive values (strings, numbers, booleans)
   - Or use `useMemo`/`useCallback` to stabilize references

2. **Create objects inside useEffect when possible**
   - Reduces dependencies
   - Prevents infinite loops

3. **Be careful with props that are objects**
   - Destructure to primitive values
   - Or compare specific properties

### 📊 Data Transfer Performance

**Passing large data between components is efficient:**
- JavaScript passes objects by reference
- ArrayBuffer (binary data) uses same reference
- No copying overhead
- Eliminates network request overhead (much larger savings)

**Cost comparison:**
- Network fetch: 100-1000ms + bandwidth
- Prop passing: <1ms (reference copy)
- **Savings: 100-1000x faster!**

## Conclusion

The GeoTIFF flashing issue was caused by **unstable useEffect dependencies** triggering continuous layer removal/re-addition. By using primitive values in the dependency array and moving object creation inside the effect, the layer now renders stably.

This fix, combined with the earlier duplicate API call fix, results in:
- ✅ 50% fewer API calls
- ✅ Stable map rendering
- ✅ Better performance
- ✅ Cleaner code architecture
