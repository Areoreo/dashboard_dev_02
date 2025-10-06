import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import { MapLegend } from "@components/MapLegend";
import { getColor } from "@utils/colorUtils";

// Custom hook for map data loading
const useMapData = (apiUrl, options) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!apiUrl) {
            console.log("[UnifiedMap] No API URL provided");
            return;
        }

        console.log("\n=== UnifiedMap Data Loading ===");
        console.log("[UnifiedMap] Options:", options);

        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams(options);
        const url = `${apiUrl}?${params.toString()}`;
        console.log("[UnifiedMap] Fetching from URL:", url);

        fetch(url)
            .then(response => {
                console.log("[UnifiedMap] Response status:", response.status, response.statusText);
                if (!response.ok) {
                    return response.json().then(errorData => {
                        console.error("[UnifiedMap] Error response data:", errorData);
                        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
                    }).catch(jsonError => {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log("[UnifiedMap] ✅ Data loaded successfully");
                console.log("[UnifiedMap] Data type:", data.dataType);
                console.log("[UnifiedMap] Features count:", data.features?.length || 0);
                console.log("[UnifiedMap] Metadata:", data.metadata);
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('[UnifiedMap] ❌ Map data loading error:', err);
                console.error('[UnifiedMap] Error details:', err.message);
                setError(err.message);
                setLoading(false);
            });

        console.log("=== End UnifiedMap Data Loading ===\n");
    }, [apiUrl, JSON.stringify(options)]);

    return { data, loading, error };
};

// GeoJSON Layer Component
const GeoJSONLayer = ({ data, options, onFeatureClick, selectedFeature, map }) => {
    const layerGroupRef = useRef();

    useEffect(() => {
        console.log("[GeoJSONLayer] Rendering layer...");
        console.log("[GeoJSONLayer] Map instance:", !!map);
        console.log("[GeoJSONLayer] Data features:", data?.features?.length || 0);

        if (!map || !data?.features) {
            console.log("[GeoJSONLayer] Missing map or data features, skipping render");
            return;
        }

        // Clear existing layers
        if (layerGroupRef.current) {
            console.log("[GeoJSONLayer] Removing existing layer");
            map.removeLayer(layerGroupRef.current);
        }

        // Create new layer group
        console.log("[GeoJSONLayer] Creating new layer group");
        layerGroupRef.current = L.layerGroup().addTo(map);

        // Add GeoJSON features
        console.log("[GeoJSONLayer] Adding", data.features.length, "features to map");
        const geoJsonLayer = L.geoJSON(data.features, {
            style: (feature) => getFeatureStyle(feature, options, selectedFeature),
            onEachFeature: (feature, layer) => {
                // Click handler
                layer.on('click', () => {
                    console.log("[GeoJSONLayer] Feature clicked:", feature.properties?.name || feature.properties?.id);
                    onFeatureClick?.(feature);

                    // Update visual selection
                    layerGroupRef.current.eachLayer(l => {
                        if (l.setStyle) {
                            l.setStyle(getFeatureStyle(l.feature, options, feature));
                        }
                    });
                });

                // Hover effects
                layer.on('mouseover', () => {
                    layer.setStyle({
                        weight: 3,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                });

                layer.on('mouseout', () => {
                    layer.setStyle(getFeatureStyle(feature, options, selectedFeature));
                });

                // Tooltip
                if (feature.properties?.name) {
                    layer.bindTooltip(feature.properties.name, {
                        permanent: false,
                        direction: 'auto'
                    });
                }
            }
        });

        layerGroupRef.current.addLayer(geoJsonLayer);
        console.log("[GeoJSONLayer] ✅ Layer added to map");

        // Fit bounds to data
        try {
            const bounds = geoJsonLayer.getBounds();
            console.log("[GeoJSONLayer] Fitting map to bounds:", bounds);
            map.fitBounds(bounds);
        } catch (e) {
            console.warn('[GeoJSONLayer] ⚠️  Could not fit bounds to data:', e.message);
        }

        return () => {
            console.log("[GeoJSONLayer] Cleanup: removing layer");
            if (layerGroupRef.current && map) {
                map.removeLayer(layerGroupRef.current);
            }
        };
    }, [data, selectedFeature, JSON.stringify(options)]);

    return null;
};

// Get current data value for styling
const getCurrentValue = (feature, options) => {
    const timeSeries = feature.properties?.timeSeries;
    if (!timeSeries || timeSeries.length === 0) return null;

    // For now, use the latest available data point
    // TODO: Use selectedDate from options to find specific value
    const latestEntry = timeSeries[timeSeries.length - 1];
    
    return latestEntry.value ?? latestEntry.statistics?.mean ?? null;
};

// Get feature styling
const getFeatureStyle = (feature, options, selectedFeature) => {
    const isSelected = selectedFeature && feature.properties?.id === selectedFeature.properties?.id;
    const value = getCurrentValue(feature, options);
    
    const fillColor = value !== null ? getColor(value, options) : "#CCCCCC";
    
    return {
        fillColor: fillColor,
        weight: isSelected ? 4 : 2,
        opacity: 1,
        color: isSelected ? "#EB5A3C" : "#FFFFFF",
        fillOpacity: 0.7
    };
};

// Main Unified Map Component
export const UnifiedMap = ({ 
    options = {}, 
    onFeatureClick,
    selectedFeature,
    className = "h-96 w-full"
}) => {
    const mapRef = useRef();
    const [mapInstance, setMapInstance] = useState(null);

    // Load data using unified API
    const { data, loading, error } = useMapData('/api/unified_data', options);

    const handleMapReady = (map) => {
        mapRef.current = map;
        setMapInstance(map);
    };

    if (loading) {
        return (
            <div className={`${className} flex items-center justify-center bg-gray-100`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading map data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${className} flex items-center justify-center bg-gray-100`}>
                <div className="text-center text-red-600">
                    <p className="font-semibold">Error loading map data</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={`${className} flex items-center justify-center bg-gray-100`}>
                <p className="text-gray-500">No map data available</p>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <MapContainer
                center={[14.0, 108.0]}  // SEA region center
                zoom={5}
                className="h-full w-full"
                whenReady={(e) => handleMapReady(e.target)}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {mapInstance && data.dataType === 'geojson' && (
                    <GeoJSONLayer
                        data={data}
                        options={options}
                        onFeatureClick={onFeatureClick}
                        selectedFeature={selectedFeature}
                        map={mapInstance}
                    />
                )}
                
                {/* TODO: Add GeoTIFF raster layer support */}
                {mapInstance && data.dataType === 'geotiff' && (
                    <div className="absolute top-4 left-4 bg-yellow-100 p-2 rounded text-sm">
                        GeoTIFF raster support coming soon
                    </div>
                )}
            </MapContainer>

            {/* Map Legend */}
            {data && (
                <div className="absolute bottom-4 right-4">
                    <MapLegend 
                        variable={options.variable || data.metadata?.variable}
                        colorScale={data.rasterInfo?.colorScale}
                    />
                </div>
            )}

            {/* Data Info Panel */}
            {data?.metadata && (
                <div className="absolute top-4 left-4 bg-white p-3 rounded shadow-lg max-w-xs">
                    <h4 className="font-semibold text-sm">{data.metadata.description}</h4>
                    <div className="text-xs text-gray-600 mt-1">
                        <p>Region: {data.metadata.region}</p>
                        <p>Period: {data.metadata.dateRange.start} to {data.metadata.dateRange.end}</p>
                        <p>Resolution: {data.metadata.adminLevel}</p>
                    </div>
                </div>
            )}
        </div>
    );
};