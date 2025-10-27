# DevLog 15: StatisticsTable Component Implementation

**Date**: 2025-10-14
**Status**: ✅ Complete

## Overview

Created a comprehensive, interactive StatisticsTable component for analyzing geospatial time series data from GeoJSON files. The component provides statistical analysis with sorting, filtering, and search capabilities for agricultural data across Southeast Asian provinces.

## Motivation

The dashboard needed a way to:
1. Display statistical summaries of time series data for multiple regions
2. Allow users to compare statistics across provinces
3. Filter data by time ranges
4. Search and locate specific regions quickly
5. Handle large datasets (200+ provinces) efficiently

## Implementation

### 1. Province-Country Mapping

**Created**: `scripts/extract_prov_country_mapping.js`

A script to extract and map all provinces from GeoJSON data to their respective countries. This mapping supports 6 countries across Southeast Asia:

- **Thailand**: 77 provinces
- **Vietnam**: 63 provinces
- **Myanmar**: 17 states/regions
- **Cambodia**: 25 provinces
- **Laos**: 18 provinces
- **India**: 36 states/territories (relevant regions)

**Output**: `scripts/province_country_mapping.json` - Complete mapping of 236 provinces to countries

### 2. StatisticsTable Component

**Created**: `components/StatisticsTable/StatisticsTable.js`

#### Key Features

1. **Statistical Calculations**
   - Mean, Variance, Min, Max
   - Quartiles (Q25, Median, Q75)
   - Data point count
   - Automatic handling of ensemble forecast data

2. **Interactive Table**
   - Sortable columns (ascending/descending/unsorted)
   - Global search/filter by region name or country
   - Date range filtering (YYYYMM format)
   - Fixed header with scrollable body
   - Max height: 600px (500px on mobile)

3. **Data Processing**
   - Integrates with existing `utils/timeSeriesProcessor.js`
   - Handles legacy data format (y2020, y202506_0, y202506_mean)
   - Processes both single-value and ensemble data
   - Filters by user-specified date ranges

#### Libraries Used

**@tanstack/react-table v8.21.3**
- Modern React table library
- Provides sorting, filtering, pagination
- Type-safe and performant
- Headless UI for full styling control

**simple-statistics v7.8.8**
- Pure JavaScript statistics library
- Functions: mean, variance, min, max, median, quantile
- No dependencies, lightweight (~20KB)
- Reliable and well-tested

### 3. Styling

**Created**: `styles/core/components/_statistics-table.scss`

- Clean, modern table design
- Sticky header for large datasets
- Hover effects for better UX
- Responsive design (mobile-optimized)
- Color scheme matching dashboard theme

### 4. Demo Page

**Created**: `pages/statistics-demo.js`

Standalone demo page showcasing:
- Loading GeoJSON data from `/data/ERA5/SPI3/Forecast/Prov/Monthly/`
- Default date range (202511-202604)
- Full feature demonstration
- Usage instructions and notes

## File Structure

```
components/StatisticsTable/
├── StatisticsTable.js         # Main component (380 lines)
├── index.js                   # Export
└── README.md                  # Documentation

scripts/
├── extract_prov_country_mapping.js  # Mapping generator (290 lines)
└── province_country_mapping.json    # Province→Country data (236 entries)

styles/core/components/
└── _statistics-table.scss     # Component styles (220 lines)

pages/
└── statistics-demo.js         # Demo page

devlog/
└── 15_statistics_table_component.md  # This file
```

## Usage Example

```jsx
import StatisticsTable from '../components/StatisticsTable';

function MyPage() {
  const [geojsonData, setGeojsonData] = useState(null);

  useEffect(() => {
    fetch('/data/ERA5/SPI3/Forecast/Prov/Monthly/Forecast_Prov_Monthly_SPI3_SEA.geojson')
      .then(res => res.json())
      .then(data => setGeojsonData(data));
  }, []);

  return (
    <StatisticsTable
      geojsonData={geojsonData}
      initialStartDate="202001"
      initialEndDate="202512"
    />
  );
}
```

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `geojsonData` | Object | required | GeoJSON FeatureCollection with time series |
| `initialStartDate` | String | `null` | Initial start date (YYYYMM format) |
| `initialEndDate` | String | `null` | Initial end date (YYYYMM format) |

## Column Descriptions

1. **Region Name** - Province/state from GeoJSON
2. **Country** - Auto-mapped country
3. **Start Date** - First date in time series
4. **End Date** - Last date in time series
5. **Mean** - Average value
6. **Variance** - Data variance
7. **Min** - Minimum value
8. **Q25** - 25th percentile
9. **Median** - 50th percentile
10. **Q75** - 75th percentile
11. **Max** - Maximum value
12. **Count** - Number of data points

## Performance Considerations

1. **Memoization** - Uses `useMemo` to prevent recalculations
2. **Virtual Scrolling** - Max height with overflow scrolling
3. **Efficient Filtering** - React Table's optimized filtering
4. **Small Bundle** - Only 2 dependencies, ~30KB total

## Testing

Access the demo at: `http://localhost:3000/statistics-demo`

**Test Data**: SPI3 forecast data for 236 provinces across Southeast Asia

**Expected Results**:
- Table displays all provinces with statistics
- Search filters regions in real-time
- Date range filtering updates statistics
- Sorting works on all columns
- Scrollable for datasets > 600px height

## Integration Notes

1. **No Breaking Changes** - Component is standalone
2. **Uses Existing Utilities** - Leverages `timeSeriesProcessor.js`
3. **Style Integration** - Imported in `styles/globals.scss`
4. **Dependencies Installed** - Already added to `package.json`

## Future Enhancements

Potential improvements (not implemented):

- [ ] Export to CSV/Excel functionality
- [ ] Column visibility toggle
- [ ] Pagination for very large datasets
- [ ] Chart visualization of selected row
- [ ] Multi-row selection for comparison
- [ ] Custom date pickers (calendar UI)
- [ ] Responsive mobile view (card layout)
- [ ] Statistical significance indicators
- [ ] Comparison mode (baseline vs current)
- [ ] Data export with filters applied

## Technical Details

### Data Flow

```
GeoJSON Data
    ↓
extractTimeSeries() → Time series array
    ↓
calculateStatistics() → Statistical metrics
    ↓
React Table → Sorted/Filtered display
    ↓
User Interaction → Updated display
```

### Statistical Calculation

For each feature in the GeoJSON:
1. Extract time series using existing processor
2. Filter by date range (if specified)
3. Calculate statistics using simple-statistics
4. Handle null/undefined values gracefully
5. Format numbers for display (2 decimal places)

### Province-Country Mapping

The mapping handles:
- Name variations (e.g., "Ba Ria-Vung Tau" vs "Ba Ria - Vung Tau")
- Regional subdivisions (e.g., "Bago (East)", "Shan (North)")
- Special administrative regions (e.g., "Nay Pyi Taw")
- City/province distinctions (e.g., "Ho Chi Minh city")

## Lessons Learned

1. **Library Selection** - @tanstack/react-table proved to be the right choice for flexibility
2. **Statistical Library** - simple-statistics is lightweight and reliable
3. **Data Format** - Legacy format integration worked smoothly with existing utilities
4. **Province Mapping** - Required manual verification for name variations
5. **Performance** - Memoization is crucial for large datasets

## Related DevLogs

- **DevLog 13**: Chart Component Refactor (time series processing)
- **DevLog 02**: Unified Data Schema (data format understanding)
- **DevLog 07**: Data Processing Refactor (processor utilities)

## Access Points

- **Main Dashboard**: `/rice-map` - Integrated below the time series chart
- **Demo Page**: `/statistics-demo` (standalone demo)
- **Component**: `@components/StatisticsTable`
- **Docs**: `@components/StatisticsTable/README.md`
- **Mapping Script**: `@scripts/extract_prov_country_mapping.js`

## Integration into Main Dashboard

**Location**: Added to `pages/rice-map.js` below the chart panel

**Integration Details**:
- Dynamically imported to avoid SSR issues
- Only displays for Province and Country level data (GeoJSON format)
- Shows a message for Grid-level data (GeoTIFF format)
- Uses the same `mapData` from the existing API calls
- Automatically updates when user changes variable type or region

**Conditional Display Logic**:
```javascript
{mapData && mapData.datatype === "geojson" && mapData.data ? (
    <StatisticsTable geojsonData={mapData.data} />
) : (
    <div>Statistics table is only available for Province and Country level data</div>
)}
```

**Styling**: Added `.statistics-panel` styles in `_dashboard.scss` to match the dashboard theme

## Summary

Successfully implemented a comprehensive StatisticsTable component that:
- ✅ Displays statistics for 236 provinces across 6 countries
- ✅ Provides sorting, filtering, and search capabilities
- ✅ Handles both historical and ensemble forecast data
- ✅ **Integrated into main rice-map dashboard page**
- ✅ Automatically shows/hides based on data type
- ✅ Includes complete documentation and demo page
- ✅ Uses industry-standard, lightweight libraries

The component is fully integrated into the main dashboard and ready for production use.

---

**Last Updated**: 2025-10-14
**Component Version**: 1.0.0
**Status**: ✅ Production Ready & Integrated
