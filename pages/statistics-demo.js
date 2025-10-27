/**
 * Statistics Table Demo Page
 *
 * Demonstrates the StatisticsTable component with real GeoJSON data
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import StatisticsTable from '../components/StatisticsTable';

export default function StatisticsDemo() {
  const [geojsonData, setGeojsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load GeoJSON data using the API
    const options = {
      dataSource: 'ERA5',
      varType: 'SPI3',
      overview: 'Forecast',
      adminLevel: 'Prov',
      dateType: 'Monthly',
      region: 'SEA'
    };

    fetch('/api/get_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Loaded data:', data);
        setGeojsonData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading GeoJSON:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Head>
        <title>Statistics Table Demo - Agricultural Dashboard</title>
        <meta name="description" content="Interactive statistics table for agricultural data analysis" />
      </Head>

      <div style={{
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: '#1f2937'
          }}>
            Statistics Table Demo
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '1rem'
          }}>
            Interactive table showing statistical analysis of SPI3 data across Southeast Asian provinces
          </p>
        </header>

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            Loading data...
          </div>
        )}

        {error && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && geojsonData && (
          <>
            <div style={{
              backgroundColor: '#e0f2fe',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#0c4a6e'
            }}>
              <strong>Data loaded:</strong> {geojsonData?.features?.length || 0} provinces found
            </div>

            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: '#374151'
              }}>
                Features
              </h2>
              <ul style={{
                listStyle: 'disc',
                paddingLeft: '1.5rem',
                color: '#4b5563',
                lineHeight: '1.8'
              }}>
                <li><strong>Sortable Columns:</strong> Click on any column header to sort (ascending/descending)</li>
                <li><strong>Search:</strong> Filter regions by name or country</li>
                <li><strong>Date Range Filter:</strong> Specify start/end dates (YYYYMM format, e.g., 202501)</li>
                <li><strong>Statistics:</strong> Mean, Variance, Min, Q25, Median, Q75, Max, and Count</li>
                <li><strong>Scrollable:</strong> Fixed header with max height for easy browsing of large datasets</li>
              </ul>
            </div>

            <StatisticsTable
              geojsonData={geojsonData}
              initialStartDate="202511"
              initialEndDate="202604"
            />

            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e40af'
            }}>
              <strong>Note:</strong> This demo uses SPI3 (3-month Standardized Precipitation Index) forecast data.
              The data includes historical values and ensemble forecast predictions for provinces across
              Thailand, Vietnam, Myanmar, Cambodia, Laos, and India.
            </div>
          </>
        )}
      </div>
    </>
  );
}
