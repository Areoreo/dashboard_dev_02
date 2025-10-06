import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "chartjs-adapter-date-fns";

/**
 * Unified Chart Component
 * Handles all chart types: single values, time series, and ensemble data
 * Replaces the fragmented chart processing system
 */
export const UnifiedChart = ({ selectedFeature, options = {} }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [chartData, setChartData] = useState(null);
    const [chartType, setChartType] = useState("line");
    const [isLoading, setIsLoading] = useState(false);

    // Process selected feature data
    useEffect(() => {
        console.log("\n=== UnifiedChart Processing ===");
        console.log("[UnifiedChart] Selected feature:", selectedFeature?.properties?.name || "None");

        if (!selectedFeature?.properties?.timeSeries) {
            console.log("[UnifiedChart] No time series data available");
            setChartData(null);
            return;
        }

        console.log("[UnifiedChart] Time series entries:", selectedFeature.properties.timeSeries.length);
        setIsLoading(true);
        processTimeSeries(selectedFeature.properties.timeSeries);
        setIsLoading(false);
        console.log("=== End UnifiedChart Processing ===\n");
    }, [selectedFeature]);

    // Create or update chart
    useEffect(() => {
        if (!chartData || !chartRef.current) return;

        // Destroy existing chart
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        // Create new chart
        const ctx = chartRef.current.getContext('2d');
        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: getChartOptions()
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [chartData]);

    const processTimeSeries = (timeSeries) => {
        console.log("[UnifiedChart] Processing time series data...");

        if (!timeSeries || timeSeries.length === 0) {
            console.log("[UnifiedChart] ⚠️  Empty time series");
            setChartData(null);
            return;
        }

        // Detect data type and create appropriate chart data
        const hasEnsembles = timeSeries.some(entry => entry.ensembleValues?.length > 0);
        const hasStatistics = timeSeries.some(entry => entry.statistics?.mean !== undefined);

        console.log("[UnifiedChart] Data type detection:");
        console.log("  - Has ensembles:", hasEnsembles);
        console.log("  - Has statistics:", hasStatistics);

        if (hasEnsembles || hasStatistics) {
            console.log("[UnifiedChart] Creating ensemble chart");
            createEnsembleChart(timeSeries);
        } else {
            console.log("[UnifiedChart] Creating simple line chart");
            createSimpleChart(timeSeries);
        }
    };

    const createSimpleChart = (timeSeries) => {
        const labels = timeSeries.map(entry => new Date(entry.date));
        const values = timeSeries.map(entry => entry.value);

        console.log("[UnifiedChart] Simple chart data:", {
            dataPoints: values.length,
            firstValue: values[0],
            lastValue: values[values.length - 1]
        });

        setChartData({
            labels,
            datasets: [{
                label: getDatasetLabel(),
                data: values,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        });
        setChartType("line");
        console.log("[UnifiedChart] ✅ Simple chart created");
    };

    const createEnsembleChart = (timeSeries) => {
        console.log("[UnifiedChart] Creating ensemble chart...");
        const labels = timeSeries.map(entry => new Date(entry.date));
        const datasets = [];

        // Mean line (primary)
        if (timeSeries.every(entry => entry.statistics?.mean !== undefined)) {
            console.log("[UnifiedChart] Adding mean line dataset");
            datasets.push({
                label: 'Mean',
                data: timeSeries.map(entry => entry.statistics.mean),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderWidth: 3,
                fill: false,
                tension: 0.3,
                pointRadius: 4
            });

            // Confidence band (min-max)
            if (timeSeries.every(entry => entry.statistics?.min !== undefined && entry.statistics?.max !== undefined)) {
                datasets.push({
                    label: 'Maximum',
                    data: timeSeries.map(entry => entry.statistics.max),
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 1,
                    fill: '+1',
                    tension: 0.3,
                    pointRadius: 0
                });

                datasets.push({
                    label: 'Minimum',
                    data: timeSeries.map(entry => entry.statistics.min),
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 1,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0
                });
            }
        }

        // Individual ensemble members (if available and not too many)
        const maxEnsembleLines = 5;
        if (timeSeries[0]?.ensembleValues?.length > 0 && timeSeries[0].ensembleValues.length <= maxEnsembleLines) {
            const numEnsembles = timeSeries[0].ensembleValues.length;
            
            for (let i = 0; i < numEnsembles; i++) {
                datasets.push({
                    label: `Ensemble ${i + 1}`,
                    data: timeSeries.map(entry => entry.ensembleValues?.[i] || null),
                    borderColor: `hsla(${i * 60}, 70%, 50%, 0.6)`,
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 1
                });
            }
        }

        console.log("[UnifiedChart] Ensemble chart datasets:", datasets.length);
        setChartData({ labels, datasets });
        setChartType("ensemble");
        console.log("[UnifiedChart] ✅ Ensemble chart created");
    };

    const getDatasetLabel = () => {
        const variable = options.variable || selectedFeature?.properties?.variable || "Value";
        const units = getUnits(variable);
        return units ? `${variable} (${units})` : variable;
    };

    const getUnits = (variable) => {
        const unitsMap = {
            'Yield': 'tons/ha',
            'Production': 'tons',
            'Area': 'hectares',
            'Prcp': 'mm',
            'Temp': '°C',
            'SPI1': 'index',
            'SPI3': 'index',
            'SPI6': 'index',
            'SPI12': 'index'
        };
        return unitsMap[variable] || '';
    };

    const getChartOptions = () => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: getChartTitle(),
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: (context) => {
                            const date = new Date(context[0].label);
                            return date.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short',
                                day: 'numeric'
                            });
                        },
                        label: (context) => {
                            const value = parseFloat(context.parsed.y).toFixed(2);
                            const units = getUnits(options.variable || "");
                            return `${context.dataset.label}: ${value}${units ? ' ' + units : ''}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: {
                            month: 'MMM yyyy',
                            year: 'yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: getDatasetLabel()
                    },
                    beginAtZero: false
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        };
    };

    const getChartTitle = () => {
        const regionName = selectedFeature?.properties?.name || "Selected Region";
        const variable = options.variable || "Data";
        return `${variable} Time Series - ${regionName}`;
    };

    const downloadCSV = () => {
        if (!selectedFeature?.properties?.timeSeries) return;

        const timeSeries = selectedFeature.properties.timeSeries;
        const regionName = selectedFeature.properties.name || "region";
        
        let csvContent = "Date,Value,Type\n";
        
        timeSeries.forEach(entry => {
            if (entry.value !== undefined) {
                csvContent += `${entry.date},${entry.value},Single Value\n`;
            }
            
            if (entry.statistics?.mean !== undefined) {
                csvContent += `${entry.date},${entry.statistics.mean},Mean\n`;
                csvContent += `${entry.date},${entry.statistics.min},Minimum\n`;
                csvContent += `${entry.date},${entry.statistics.max},Maximum\n`;
            }
            
            if (entry.ensembleValues?.length > 0) {
                entry.ensembleValues.forEach((value, index) => {
                    csvContent += `${entry.date},${value},Ensemble ${index + 1}\n`;
                });
            }
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${regionName}_${options.variable || 'data'}_timeseries.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const downloadPNG = () => {
        if (!chartInstanceRef.current) return;
        
        const url = chartInstanceRef.current.toBase64Image();
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedFeature?.properties?.name || 'chart'}_${options.variable || 'data'}.png`;
        a.click();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading chart...</span>
            </div>
        );
    }

    if (!selectedFeature) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Select a region on the map to view time series data</p>
            </div>
        );
    }

    if (!chartData) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No time series data available for selected region</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                    {getChartTitle()}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={downloadCSV}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                        Download CSV
                    </button>
                    <button
                        onClick={downloadPNG}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                        Download PNG
                    </button>
                </div>
            </div>
            
            <div className="relative h-96">
                <canvas ref={chartRef}></canvas>
            </div>
            
            {chartType === "ensemble" && (
                <div className="mt-2 text-sm text-gray-600">
                    <p>
                        Chart shows ensemble forecast data with uncertainty bands. 
                        The bold line represents the mean prediction.
                    </p>
                </div>
            )}
        </div>
    );
};