# DevLog 01: Current Workflow Analysis

**Date**: 2025-10-03  
**Phase**: Initial Analysis and Refactoring Plan

## Current Data Processing Chain Analysis

### Problem Statement
The current agricultural dashboard has an overly complex data processing pipeline with inconsistent data formats, scattered file organization, and fragmented component architecture.

### Current Workflow for Example Request
**Options**: `varType: "Yield", region: "SEA", overview: "forecast", adminLevel: "Prov", dateType: "Monthly", selectedDate: "202504"`

#### Step 1: API Data Retrieval (`/pages/api/get_data.js`)
- **File Resolution Logic**: 500+ lines of nested if-else statements
- **Key Generation**: `forecast_Prov_Monthly` 
- **Filename Mapping**: `SEA_prov_2025_monthly.geojson`
- **Directory Mapping**: `yield_json_forecast`
- **Final Path**: `/data/yield_json_forecast/SEA_prov_2025_monthly.geojson`
- **Issues**: 
  - Hardcoded file mappings in multiple formats
  - Inconsistent naming conventions requiring special cases
  - Comments indicate data organization problems: *"data is named wrongly"*

#### Step 2: Map Visualization (`GeojsonLayer.js`)
- **Feature Rendering**: Provinces colored based on current date values
- **Color Mapping**: `colorUtils.js` applies variable-specific color scales  
- **User Interaction**: Click handler triggers `setSelectedFeature(feature)`
- **Issues**: 
  - Tight coupling between map interactions and chart updates
  - Multiple redundant state management layers

#### Step 3: Chart Data Processing (`ChartDataProcessor.js`)
- **Feature Processing**: `processSelectedFeature()` extracts time series from clicked province
- **Data Detection**: Auto-detects ensemble format from property patterns like `y202504_0, y202504_1`
- **Data Transformation**: Creates standardized array format
- **Issues**:
  - Multiple deprecated processing functions alongside active ones
  - Inconsistent data format handling (legacy vs. new format)
  - Complex detection logic for different data types

#### Step 4: Chart Rendering (`ChartRenderers.js`)
- **Chart Type Setting**: "ensemble" mode for multiple ensemble members
- **Visualization**: Multiple lines for different ensemble predictions
- **Export Options**: CSV/image download capabilities
- **Issues**:
  - Mostly commented-out code
  - Multiple backup files indicating development uncertainty

### Major Complexity Issues Identified

1. **❌ Extreme File Path Logic Complexity**
   - 500+ lines in `get_data.js` just for filename resolution
   - Multiple nested if-else chains with hardcoded mappings
   - Inconsistent naming patterns require special case handling

2. **❌ Data Format Inconsistency** 
   - Multiple data formats: GeoJSON properties, ensemble arrays, time series objects
   - Legacy vs. new format handling creates dual processing paths
   - Chart processor has deprecated functions alongside new ones

3. **❌ Overly Fragmented Architecture**
   - Data flows through 6+ separate processing stages
   - Each component has its own data transformation logic
   - Tight coupling between map clicks and chart updates

4. **❌ Massive Commented Code Blocks**
   - Entire files contain mostly commented-out code
   - Multiple backup files (`.bak`, `.bak2`) indicating uncertainty
   - Hard to distinguish active vs. deprecated functionality

### Data Types to Handle

1. **Single-Value Data**: Historical data with one value per date
   - Format: `{y2020: 2.5, y2021: 2.7}`
   - Use case: Historical yield records

2. **Ensemble Data**: Forecast data with multiple predictions per date
   - Format: `{y202504_0: 2.1, y202504_1: 2.3, y202504_2: 2.0}`
   - Statistics: `{y202504_mean: 2.13, y202504_min: 2.0, y202504_max: 2.3}`
   - Use case: Forecast predictions with uncertainty

3. **GeoTIFF Data**: Raster data for grid-level visualization
   - Format: Binary TIFF files with geospatial metadata
   - Use case: High-resolution spatial data

## Refactoring Goals

### Primary Objectives
1. **Unify Data Structure**: Single consistent format for all data types
2. **Simplify API Logic**: Reduce 500+ line file mapping to ~50 lines
3. **Clean Component Architecture**: Clear data flow, minimal coupling
4. **Maintain Leaflet Compatibility**: Preserve dynamic imports and SSR settings
5. **Improve Maintainability**: Remove dead code, add documentation

### Success Metrics
- **Code Reduction**: ~90% reduction in API logic complexity
- **Format Unification**: Single data schema handles all use cases
- **Component Clarity**: Clear boundaries and responsibilities
- **Documentation**: Comprehensive guides for future development

## Next Steps
1. Design unified data schema
2. Create Python preprocessing script
3. Generate test datasets
4. Implement simplified API
5. Clean up components while preserving Leaflet dynamic imports
6. Remove deprecated code
7. Create comprehensive documentation

---
*This analysis provides the foundation for the upcoming refactoring phases.*