/**
 * StatisticsTable Component
 *
 * A comprehensive statistics table for analyzing geospatial time series data.
 * Features:
 * - Displays statistical metrics for each region (province/country)
 * - Sortable columns
 * - Search/filter functionality
 * - Scrollable with fixed max height
 * - Time range filtering
 *
 * Recommended Libraries Used:
 * - react-table (v8) - For advanced table features
 * - simple-statistics - For statistical calculations
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import * as ss from 'simple-statistics';
import { extractTimeSeries } from '../../utils/timeSeriesProcessor';
import provinceCountryMapping from '../../scripts/province_country_mapping.json';

/**
 * Calculate statistics for a time series within a date range
 * @param {Array} timeSeries - Time series data
 * @param {string} startDate - Start date (YYYYMM format)
 * @param {string} endDate - End date (YYYYMM format)
 * @returns {Object} Statistical metrics
 */
function calculateStatistics(timeSeries, startDate, endDate) {
  if (!timeSeries || timeSeries.length === 0) {
    return {
      mean: null,
      variance: null,
      min: null,
      q25: null,
      median: null,
      q75: null,
      max: null,
      count: 0
    };
  }

  // Filter by date range
  const filtered = timeSeries.filter(entry => {
    if (!startDate && !endDate) return true;
    const entryDate = entry.date;
    if (startDate && entryDate < startDate) return false;
    if (endDate && entryDate > endDate) return false;
    return true;
  });

  // Extract values (handle ensemble data by using mean)
  const values = filtered
    .map(entry => entry.value || entry.mean)
    .filter(val => val !== null && val !== undefined && !isNaN(val));

  if (values.length === 0) {
    return {
      mean: null,
      variance: null,
      min: null,
      q25: null,
      median: null,
      q75: null,
      max: null,
      count: 0
    };
  }

  // Calculate statistics
  const sortedValues = [...values].sort((a, b) => a - b);

  return {
    mean: ss.mean(values),
    variance: ss.variance(values),
    min: ss.min(values),
    q25: ss.quantile(sortedValues, 0.25),
    median: ss.median(sortedValues),
    q75: ss.quantile(sortedValues, 0.75),
    max: ss.max(values),
    count: values.length
  };
}

/**
 * Process GeoJSON features into table data
 * @param {Array} features - GeoJSON features
 * @param {string} startDate - Start date filter
 * @param {string} endDate - End date filter
 * @returns {Array} Processed table data
 */
function processFeatures(features, startDate, endDate) {
  if (!features || features.length === 0) return [];

  return features.map((feature, index) => {
    const name = feature.properties.name || `Feature ${index + 1}`;
    const country = provinceCountryMapping[name] || 'Unknown';

    // Extract time series from properties
    const timeSeries = extractTimeSeries(feature.properties);

    // Get date range from time series
    const dates = timeSeries.map(entry => entry.date).filter(Boolean);
    const dataStartDate = dates.length > 0 ? Math.min(...dates) : null;
    const dataEndDate = dates.length > 0 ? Math.max(...dates) : null;

    // Calculate statistics
    const stats = calculateStatistics(timeSeries, startDate, endDate);

    return {
      id: index,
      name,
      country,
      startDate: dataStartDate,
      endDate: dataEndDate,
      ...stats
    };
  });
}

/**
 * Format number for display
 */
function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) return '-';
  return value.toFixed(decimals);
}

/**
 * StatisticsTable Component
 */
export default function StatisticsTable({
  geojsonData,
  initialStartDate = null,
  initialEndDate = null
}) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [globalFilter, setGlobalFilter] = useState('');

  // Process features into table data
  const data = useMemo(() => {
    if (!geojsonData || !geojsonData.features) return [];
    return processFeatures(geojsonData.features, startDate, endDate);
  }, [geojsonData, startDate, endDate]);

  // Define table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Region Name',
        cell: info => info.getValue(),
        size: 200,
      },
      {
        accessorKey: 'country',
        header: 'Country',
        cell: info => info.getValue(),
        size: 120,
      },
      {
        accessorKey: 'startDate',
        header: 'Start Date',
        cell: info => info.getValue() || '-',
        size: 100,
      },
      {
        accessorKey: 'endDate',
        header: 'End Date',
        cell: info => info.getValue() || '-',
        size: 100,
      },
      {
        accessorKey: 'mean',
        header: 'Mean',
        cell: info => formatNumber(info.getValue()),
        size: 80,
      },
      {
        accessorKey: 'variance',
        header: 'Variance',
        cell: info => formatNumber(info.getValue()),
        size: 80,
      },
      {
        accessorKey: 'min',
        header: 'Min',
        cell: info => formatNumber(info.getValue()),
        size: 80,
      },
      {
        accessorKey: 'q25',
        header: 'Q25',
        cell: info => formatNumber(info.getValue()),
        size: 80,
      },
      {
        accessorKey: 'median',
        header: 'Median',
        cell: info => formatNumber(info.getValue()),
        size: 80,
      },
      {
        accessorKey: 'q75',
        header: 'Q75',
        cell: info => formatNumber(info.getValue()),
        size: 80,
      },
      {
        accessorKey: 'max',
        header: 'Max',
        cell: info => formatNumber(info.getValue()),
        size: 80,
      },
      {
        accessorKey: 'count',
        header: 'Count',
        cell: info => info.getValue(),
        size: 80,
      },
    ],
    []
  );

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="statistics-table-container">
      {/* Controls */}
      <div className="table-controls">
        <div className="search-box">
          <label htmlFor="search">Search Regions:</label>
          <input
            id="search"
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search by region or country..."
            className="search-input"
          />
        </div>

        <div className="date-range-controls">
          <div className="date-input-group">
            <label htmlFor="startDate">Start Date (YYYYMM):</label>
            <input
              id="startDate"
              type="text"
              value={startDate || ''}
              onChange={e => setStartDate(e.target.value)}
              placeholder="e.g., 202001"
              className="date-input"
            />
          </div>

          <div className="date-input-group">
            <label htmlFor="endDate">End Date (YYYYMM):</label>
            <input
              id="endDate"
              type="text"
              value={endDate || ''}
              onChange={e => setEndDate(e.target.value)}
              placeholder="e.g., 202512"
              className="date-input"
            />
          </div>
        </div>

        <div className="table-info">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} regions
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="statistics-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'sortable' : ''}
                  >
                    <div className="header-content">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="sort-indicator">
                          {{
                            asc: ' ↑',
                            desc: ' ↓',
                          }[header.column.getIsSorted()] ?? ' ⇅'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
