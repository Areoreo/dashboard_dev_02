# StatisticsTable Component

A comprehensive, interactive statistics table for analyzing geospatial time series data from GeoJSON files.

## Features

- **Statistical Analysis**: Automatically calculates mean, variance, min, Q25, median, Q75, max, and count for each region
- **Sortable Columns**: Click any column header to sort data in ascending/descending order
- **Search & Filter**: Search regions by name or country in real-time
- **Date Range Filtering**: Filter statistics by custom date ranges (YYYYMM format)
- **Responsive Design**: Scrollable table with fixed header, optimized for large datasets
- **Province-Country Mapping**: Automatically maps provinces to their respective countries

## Installation

The component uses the following libraries (already installed):

```bash
npm install @tanstack/react-table simple-statistics
```

## Usage

### Basic Example

```jsx
import StatisticsTable from '../components/StatisticsTable';

function MyPage() {
  const [geojsonData, setGeojsonData] = useState(null);

  useEffect(() => {
    fetch('/path/to/your/data.geojson')
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

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `geojsonData` | Object | required | GeoJSON FeatureCollection with time series properties |
| `initialStartDate` | String | `null` | Initial start date filter (YYYYMM format) |
| `initialEndDate` | String | `null` | Initial end date filter (YYYYMM format) |

## Data Format

The component expects GeoJSON data with time series properties in the legacy format:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Bangkok",
        "y202001": 1.5,
        "y202002": 1.8,
        "y202501_0": 2.1,
        "y202501_1": 2.3,
        "y202501_mean": 2.2,
        "y202501_min": 2.0,
        "y202501_max": 2.4
      },
      "geometry": {...}
    }
  ]
}
```

The component automatically:
1. Extracts time series using `utils/timeSeriesProcessor.js`
2. Maps provinces to countries using `scripts/province_country_mapping.json`
3. Calculates statistics for the specified date range

## Column Descriptions

| Column | Description |
|--------|-------------|
| **Region Name** | Province/state name from GeoJSON |
| **Country** | Automatically mapped country |
| **Start Date** | First date in the time series |
| **End Date** | Last date in the time series |
| **Mean** | Average value in the date range |
| **Variance** | Variance of values |
| **Min** | Minimum value |
| **Q25** | 25th percentile |
| **Median** | 50th percentile (Q50) |
| **Q75** | 75th percentile |
| **Max** | Maximum value |
| **Count** | Number of data points |

## Keyboard Shortcuts

- **Click column header**: Toggle sort (ascending → descending → unsorted)
- **Type in search**: Live filter by region or country name

## Demo Page

Visit `/statistics-demo` to see a live demonstration with SPI3 data.

## Technical Details

### Libraries Used

1. **@tanstack/react-table (v8)** - Modern React table library
   - Provides sorting, filtering, and table state management
   - Type-safe with excellent performance
   - Headless UI approach for full styling control

2. **simple-statistics (v7)** - Statistical calculations
   - Pure JavaScript statistics library
   - Functions: mean, variance, min, max, median, quantile
   - No dependencies, lightweight (~20KB)

### File Structure

```
components/StatisticsTable/
├── StatisticsTable.js    # Main component
├── index.js              # Export
└── README.md             # This file

styles/core/components/
└── _statistics-table.scss # Component styles

scripts/
├── extract_prov_country_mapping.js  # Mapping generator
└── province_country_mapping.json    # Province→Country data

pages/
└── statistics-demo.js    # Demo page
```

## Performance

- **Large datasets**: Handles 200+ provinces efficiently
- **Virtual scrolling**: Max height with scrollable tbody
- **Memoization**: Uses `useMemo` to prevent unnecessary recalculations
- **Debounced search**: Real-time filtering without lag

## Customization

### Styling

The component uses SCSS classes defined in `styles/core/components/_statistics-table.scss`:

- `.statistics-table-container` - Main wrapper
- `.table-controls` - Search and filter controls
- `.statistics-table` - Table element
- `.sortable` - Sortable column headers

You can override these in your own stylesheets.

### Adding Custom Columns

Edit the `columns` array in `StatisticsTable.js`:

```javascript
const columns = useMemo(
  () => [
    // ... existing columns ...
    {
      accessorKey: 'customField',
      header: 'Custom Field',
      cell: info => info.getValue(),
      size: 100,
    },
  ],
  []
);
```

### Custom Statistics

Modify the `calculateStatistics` function to add more metrics:

```javascript
function calculateStatistics(timeSeries, startDate, endDate) {
  // ... existing code ...

  return {
    // ... existing stats ...
    standardDeviation: ss.standardDeviation(values),
    range: ss.max(values) - ss.min(values),
  };
}
```

## Troubleshooting

### "Cannot read property 'features' of undefined"
- Ensure `geojsonData` is loaded before rendering
- Add loading state: `{!geojsonData ? <Loading /> : <StatisticsTable ... />}`

### Statistics show as "-"
- Check that your GeoJSON properties contain time series data (y2020, y202501, etc.)
- Verify date range format is YYYYMM (6 digits) or YYYY (4 digits)
- Ensure values are numeric (not strings)

### Province not mapped to country
- Check if the province name exists in `scripts/province_country_mapping.json`
- Run `node scripts/extract_prov_country_mapping.js` to regenerate mapping
- Add missing provinces manually to the mapping file

## Future Enhancements

- [ ] Export to CSV/Excel
- [ ] Column visibility toggle
- [ ] Pagination for very large datasets
- [ ] Chart visualization of selected row
- [ ] Multi-row selection for comparison
- [ ] Custom date pickers instead of text inputs
- [ ] Responsive mobile view (card layout)

## License

Part of the Agricultural Dashboard project.
