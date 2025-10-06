# DevLog 02: Unified Data Schema Design

**Date**: 2025-10-03  
**Phase**: Data Structure Standardization

## Unified Data Schema Specification

### Overview
This schema handles three data types:
1. **Single-Value Data**: Historical records with one value per time period
2. **Ensemble Data**: Forecast data with multiple predictions and statistics  
3. **GeoTIFF Metadata**: References to raster files with spatial metadata

### Core Schema Structure

```typescript
interface UnifiedDataResponse {
  metadata: DataMetadata;
  dataType: 'geojson' | 'geotiff';
  features?: GeoJSONFeature[];  // For vector data
  rasterInfo?: RasterInfo;      // For raster data
}

interface DataMetadata {
  variable: string;           // "Yield", "SPI1", "Prcp", etc.
  region: string;            // "SEA", "Cambodia", etc.
  overview: 'hist' | 'forecast';
  adminLevel: 'Country' | 'Prov' | 'Grid';
  timeType: 'Yearly' | 'Monthly';
  dateRange: {
    start: string;           // ISO date "2020-01-01"
    end: string;             // ISO date "2025-12-31"
  };
  units?: string;            // "tons/hectare", "mm", "°C"
  description?: string;
}

interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: FeatureProperties;
}

interface FeatureProperties {
  id: string;                // Unique identifier
  name: string;              // Human-readable name
  timeSeries: TimeSeriesEntry[];
  [key: string]: any;        // Additional properties
}

interface TimeSeriesEntry {
  date: string;              // ISO date "2025-04-01"
  
  // For single-value data
  value?: number;
  
  // For ensemble data
  ensembleValues?: number[];
  statistics?: {
    mean: number;
    min: number;
    max: number;
    stdDev?: number;
    percentiles?: {
      p25: number;
      p50: number;   // median
      p75: number;
    };
  };
  
  // Data quality indicators
  quality?: 'high' | 'medium' | 'low';
  confidence?: number;       // 0-1 scale
}

interface RasterInfo {
  filePath: string;          // Relative path to GeoTIFF file
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  resolution: {
    x: number;               // pixel size in degrees
    y: number;
  };
  noDataValue: number;
  colorScale?: ColorScale;
}

interface ColorScale {
  type: 'linear' | 'categorical';
  domain: number[];          // data value ranges
  range: string[];           // corresponding colors
}
```

## Data Examples

### Example 1: Historical Single-Value Data
```json
{
  "metadata": {
    "variable": "Yield",
    "region": "SEA",
    "overview": "hist",
    "adminLevel": "Prov",
    "timeType": "Yearly",
    "dateRange": {
      "start": "1990-01-01",
      "end": "2020-12-31"
    },
    "units": "tons/hectare",
    "description": "Historical rice yield by province"
  },
  "dataType": "geojson",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[100.0, 10.0], [101.0, 10.0], [101.0, 11.0], [100.0, 11.0], [100.0, 10.0]]]
      },
      "properties": {
        "id": "province_001",
        "name": "Sample Province",
        "timeSeries": [
          {
            "date": "1990-01-01",
            "value": 2.5,
            "quality": "high"
          },
          {
            "date": "1991-01-01", 
            "value": 2.7,
            "quality": "high"
          }
        ]
      }
    }
  ]
}
```

### Example 2: Forecast Ensemble Data
```json
{
  "metadata": {
    "variable": "Yield",
    "region": "SEA", 
    "overview": "forecast",
    "adminLevel": "Prov",
    "timeType": "Monthly",
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-12-31"
    },
    "units": "tons/hectare"
  },
  "dataType": "geojson",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[100.0, 10.0], [101.0, 10.0], [101.0, 11.0], [100.0, 11.0], [100.0, 10.0]]]
      },
      "properties": {
        "id": "province_001",
        "name": "Sample Province",
        "timeSeries": [
          {
            "date": "2025-04-01",
            "ensembleValues": [2.1, 2.3, 2.0, 2.4, 2.2],
            "statistics": {
              "mean": 2.2,
              "min": 2.0,
              "max": 2.4,
              "stdDev": 0.15,
              "percentiles": {
                "p25": 2.1,
                "p50": 2.2,
                "p75": 2.3
              }
            },
            "confidence": 0.85
          }
        ]
      }
    }
  ]
}
```

### Example 3: GeoTIFF Raster Reference
```json
{
  "metadata": {
    "variable": "Yield",
    "region": "SEA",
    "overview": "forecast", 
    "adminLevel": "Grid",
    "timeType": "Monthly",
    "dateRange": {
      "start": "2025-04-01",
      "end": "2025-04-30"
    },
    "units": "tons/hectare"
  },
  "dataType": "geotiff",
  "rasterInfo": {
    "filePath": "/data/yield/forecast/grid/monthly/SEA_yield_202504.tif",
    "bounds": {
      "north": 25.0,
      "south": -10.0,
      "east": 140.0,
      "west": 90.0
    },
    "resolution": {
      "x": 0.1,
      "y": 0.1  
    },
    "noDataValue": -9999,
    "colorScale": {
      "type": "linear",
      "domain": [0, 1, 2, 3, 4, 5],
      "range": ["#d73027", "#f46d43", "#fdae61", "#fee08b", "#d9ef8b", "#66bd63"]
    }
  }
}
```

## Migration Strategy

### From Current Format to Unified Format

#### Current GeoJSON Properties → Unified TimeSeries
```javascript
// Old format
{
  "y2020": 2.5,
  "y2021": 2.7,
  "y202504_0": 2.1,
  "y202504_1": 2.3, 
  "y202504_mean": 2.2
}

// New unified format
{
  "timeSeries": [
    {"date": "2020-01-01", "value": 2.5},
    {"date": "2021-01-01", "value": 2.7},
    {
      "date": "2025-04-01",
      "ensembleValues": [2.1, 2.3],
      "statistics": {"mean": 2.2, "min": 2.1, "max": 2.3}
    }
  ]
}
```

## Benefits of Unified Schema

1. **Consistent Processing**: Single data interface for all components
2. **Type Safety**: Clear structure enables TypeScript support
3. **Extensibility**: Easy to add new statistics or data quality indicators
4. **API Simplification**: One endpoint, one response format
5. **Frontend Simplification**: Single data processing pipeline
6. **Backward Compatibility**: Migration path from existing formats

## Implementation Notes

- **Date Format**: ISO 8601 strings for consistency and parsing
- **Ensemble Handling**: Separate array + pre-computed statistics for performance
- **Raster Integration**: Metadata approach keeps JSON lightweight
- **Quality Indicators**: Built-in support for data confidence metrics
- **Extensible Properties**: Additional fields supported without breaking schema

---
*Next: Create Python preprocessing script to convert existing data to this format*