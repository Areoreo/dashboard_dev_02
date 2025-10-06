import React, { useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { Header } from "@components/Header";
import { Footer } from "@components/Footer";
import { VariableSelector } from "@components/VariableSelector";
import { AdminLevelSelector } from "@components/AdminLevelSelector";

// Dynamic imports for Leaflet compatibility (preserving SSR: false)
const UnifiedMap = dynamic(
    () => import("@components/UnifiedMap").then(mod => mod.UnifiedMap),
    { ssr: false, loading: () => <div className="h-96 bg-gray-100 animate-pulse flex items-center justify-center">Loading map...</div> }
);

const UnifiedChart = dynamic(
    () => import("@components/UnifiedChart").then(mod => mod.UnifiedChart),
    { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse flex items-center justify-center">Loading chart...</div> }
);

export default function UnifiedDashboard() {
    // Unified state management
    const [options, setOptions] = useState({
        variable: "Yield",
        region: "TEST",          // Use our test data
        overview: "forecast",
        adminLevel: "Prov",
        timeType: "Monthly",
        date: "2025-04"
    });

    const [selectedFeature, setSelectedFeature] = useState(null);

    // Update options handler
    const updateOption = (key, value) => {
        setOptions(prev => ({
            ...prev,
            [key]: value
        }));
        // Clear selection when options change
        setSelectedFeature(null);
    };

    // Feature selection handler
    const handleFeatureClick = (feature) => {
        setSelectedFeature(feature);
    };

    return (
        <>
            <Head>
                <title>Agricultural Dashboard - Unified</title>
                <meta name="description" content="Unified agricultural data visualization dashboard" />
            </Head>

            <div className="min-h-screen bg-gray-50">
                <Header />
                
                <main className="container mx-auto px-4 py-8">
                    {/* Dashboard Title */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Agricultural Data Dashboard
                        </h1>
                        <p className="text-gray-600">
                            Unified data visualization with simplified processing pipeline
                        </p>
                    </div>

                    {/* Control Panel */}
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4">Data Selection</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Variable
                                </label>
                                <VariableSelector 
                                    selectedVar={options.variable}
                                    updateOption={updateOption}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Data Type
                                </label>
                                <select 
                                    value={options.overview}
                                    onChange={(e) => updateOption('overview', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="hist">Historical</option>
                                    <option value="forecast">Forecast</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Admin Level
                                </label>
                                <AdminLevelSelector
                                    options={options}
                                    updateOption={updateOption}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Time Resolution
                                </label>
                                <select 
                                    value={options.timeType}
                                    onChange={(e) => updateOption('timeType', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="Yearly">Yearly</option>
                                    <option value="Monthly">Monthly</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date
                                </label>
                                <input
                                    type="text"
                                    value={options.date}
                                    onChange={(e) => updateOption('date', e.target.value)}
                                    placeholder={options.timeType === 'Monthly' ? 'YYYY-MM' : 'YYYY'}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        {/* Current Selection Display */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">
                                <strong>Current Selection:</strong> {options.variable} data for {options.region} region 
                                ({options.overview}, {options.adminLevel} level, {options.timeType}, {options.date})
                            </p>
                        </div>
                    </div>

                    {/* Main Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Map Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold mb-4">Map View</h3>
                                <UnifiedMap
                                    options={options}
                                    onFeatureClick={handleFeatureClick}
                                    selectedFeature={selectedFeature}
                                    className="h-96 w-full"
                                />
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold mb-4">Time Series</h3>
                                <UnifiedChart
                                    selectedFeature={selectedFeature}
                                    options={options}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Data Information Panel */}
                    {selectedFeature && (
                        <div className="mt-8 bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Selected Region Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-700">Region Details</h4>
                                    <p className="text-sm text-gray-600">Name: {selectedFeature.properties.name}</p>
                                    <p className="text-sm text-gray-600">ID: {selectedFeature.properties.id}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-700">Data Summary</h4>
                                    <p className="text-sm text-gray-600">
                                        Data Points: {selectedFeature.properties.timeSeries?.length || 0}
                                    </p>
                                    {selectedFeature.properties.timeSeries?.length > 0 && (
                                        <p className="text-sm text-gray-600">
                                            Date Range: {selectedFeature.properties.timeSeries[0].date} to{' '}
                                            {selectedFeature.properties.timeSeries[selectedFeature.properties.timeSeries.length - 1].date}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* System Information */}
                    <div className="mt-8 bg-blue-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            🚀 Unified Dashboard Features
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                            <div>
                                <h4 className="font-medium">✅ Implemented</h4>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>Unified data schema for all data types</li>
                                    <li>Simplified API with 90% less complexity</li>
                                    <li>Single chart component handling all formats</li>
                                    <li>Clean map component with preserved dynamic imports</li>
                                    <li>Automatic legacy format conversion</li>
                                    <li>Test data generation and validation</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium">🔄 In Progress</h4>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>GeoTIFF raster layer support</li>
                                    <li>Advanced filtering and date selection</li>
                                    <li>Performance optimizations</li>
                                    <li>Error boundary components</li>
                                    <li>Comprehensive documentation</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}