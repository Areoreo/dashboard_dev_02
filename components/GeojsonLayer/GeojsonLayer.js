import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import { AlertMarker } from "@components/AlertMarker";
import { getColor, getThresholds, getFeatureCenter } from "@utils/colorUtils";

export const GeojsonLayer = ({
    data_url,
    options,
    selectedDate,
    selectedFeature,
    setSelectedProvince,
    setTimeSeries,
    setSelectedFeature,
    showWarnings
}) => {
    const map = useMap();
    const infoRef = useRef(null);
    const highlightRef = useRef(null);
    const geoJsonLayerRef = useRef(null);
    const [alerts, setAlerts] = useState([]);

    // Remove bounding box
    const removeBoundingBox = () => {
        map.eachLayer((layer) => {
            if (layer instanceof L.Rectangle) {
                map.removeLayer(layer);
            }
        });
    };

    // Handle feature click
    const handleFeatureClick = (feature, layer) => {
        removeBoundingBox();
        setSelectedFeature(feature);

        layer.setStyle({
            color: "#EB5A3C", // Red border
            weight: 4,
            opacity: 1
        });

        // Ensure the layer is brought to the front
        if (layer.bringToFront && layer.bringToBack) {
            const isAtFront =
                map.hasLayer(layer) &&
                layer === map._layers[Object.keys(map._layers).pop()];
            if (isAtFront) {
                layer.bringToBack();
                layer.bringToFront();
            } else {
                layer.bringToFront();
            }
        }
    };

    // Generate time series data from feature properties
    const handleProvClickToGenerateTimeSeries = (feature) => {
        const { properties } = feature;
        setSelectedProvince(properties.name);

        const timeSeriesData = Object.keys(properties)
            .filter((key) => key.startsWith("y"))
            .map((key) => ({
                year: parseInt(key.replace("y", ""), 10),
                value: properties[key]
            }));

        setTimeSeries(timeSeriesData);
    };

    // Function to process features and identify those that exceed thresholds
    const processAlerts = (features, date) => {
        // Get thresholds based on current options
        const thresholds = getThresholds({
            varType: data_url.data_vartype,
            adminLevel: data_url.data_adminLevel,
            dateType: data_url.data_dateType,
            region: options.region
        });

        // If no thresholds defined, clear alerts and return
        if (!thresholds.high && !thresholds.low) {
            setAlerts([]);
            return;
        }

        // Filter features to find those exceeding thresholds
        const newAlerts = features
            .filter((feature) => {
                const baseKey = `y${date}`;
                const value =
                    feature.properties[`${baseKey}_0`] ??
                    feature.properties[baseKey] ??
                    null;

                return (
                    value !== null &&
                    (value > thresholds.high || value < thresholds.low)
                );
            })
            .map((feature) => {
                const baseKey = `y${date}`;
                const value =
                    feature.properties[`${baseKey}_0`] ??
                    feature.properties[baseKey];
                const name = feature.properties.name;
                const center = getFeatureCenter(feature);

                // Determine if this is a high or low alert
                const isHigh = value > thresholds.high;

                return {
                    position: center,
                    type: isHigh ? "high" : "low",
                    message: isHigh
                        ? `${thresholds.highMessage}: ${value.toFixed(2)}${
                              thresholds.unit
                          }`
                        : `${thresholds.lowMessage}: ${value.toFixed(2)}${
                              thresholds.unit
                          }`,
                    name: name,
                    value: value
                };
            });

        setAlerts(newAlerts);
    };

    useEffect(() => {
        // Initialize info control
        const info = L.control({ position: "topright" });

        info.onAdd = function () {
            this._div = L.DomUtil.create("div", "info");
            this.update();
            return this._div;
        };

        info.update = function (content) {
            // Optional: Update info content
        };

        info.addTo(map);
        infoRef.current = info;

        // Highlight style
        const highlightStyle = {
            weight: 3,
            color: "#ff0000",
            dashArray: "-",
            fillOpacity: 0.7
        };

        // Style function using the color utilities
        const styleGeoJSON = (feature) => {
            const baseKey = `y${selectedDate}`;
            const value =
                feature.properties[`${baseKey}_0`] ??
                feature.properties[baseKey] ??
                0;

            // Create a data options object for the color utility
            const colorOptions = {
                varType: data_url.data_vartype,
                adminLevel: data_url.data_adminLevel,
                dateType: data_url.data_dateType
            };

            return {
                fillColor: getColor(value, colorOptions),
                color: "#666",
                weight: 2,
                dashArray: "3",
                fillOpacity: 0.7
            };
        };

        // Reset feature style
        const resetFeatureStyle = (layer, feature) => {
            layer.setStyle({
                color: "#666",
                weight: 2,
                dashArray: "3"
            });
        };

        // Use passed GeoJSON data directly (no fetch needed - data already loaded by parent)
        const processGeoJSONData = () => {
            const data = data_url.data;

            if (!data || !data.features) {
                console.error("Invalid GeoJSON data received:", data);
                return;
            }
            console.log("Processing GeoJSON data (no fetch - using passed data):", data);

                // Process features to identify alerts based on thresholds
                processAlerts(data.features, selectedDate);

                // Remove existing GeoJSON layer
                if (geoJsonLayerRef.current) {
                    map.removeLayer(geoJsonLayerRef.current);
                }

                const geojsonLayer = L.geoJSON(data, {
                    style: styleGeoJSON,
                    onEachFeature: function (feature, layer) {
                        // Get current feature value and name
                        const value =
                            feature.properties[`y${selectedDate}_0`] ??
                            feature.properties[`y${selectedDate}`] ??
                            0;
                        const name = feature.properties.name;

                        // Create color options for tooltips
                        const colorOptions = {
                            varType: data_url.data_vartype,
                            adminLevel: data_url.data_adminLevel,
                            dateType: data_url.data_dateType
                        };

                        // Bind tooltip
                        layer.bindTooltip(
                            `<b>${name}</b><br>${options.varType}: ${
                                value !== undefined ? value.toFixed(2) : "N/A"
                            }`,
                            { direction: "top", sticky: true }
                        );

                        // Default style
                        layer.setStyle({
                            fillColor: getColor(value, colorOptions),
                            color: "#666",
                            weight: 2,
                            fillOpacity: 0.7,
                            dashArray: "3"
                        });

                        // Hover highlight
                        layer.on("mouseover", () => {
                            layer.setStyle({
                                color: "#EB5A3C",
                                weight: 4
                            });
                        });

                        // Mouse out event
                        layer.on("mouseout", () => {
                            if (selectedFeature !== feature) {
                                layer.setStyle(styleGeoJSON(feature));
                            }
                        });

                        // Click event
                        layer.on("click", () => {
                            removeBoundingBox();
                            if (
                                selectedFeature &&
                                selectedFeature !== feature
                            ) {
                                resetFeatureStyle(layer, selectedFeature);
                            }
                            handleFeatureClick(feature, layer);
                            handleProvClickToGenerateTimeSeries(feature);
                        });

                        // Update info control on mouseover
                        layer.on("mouseover", function (e) {
                            infoRef.current.update(
                                "<b>" +
                                    feature.properties.name +
                                    "</b><br>" +
                                    feature.properties.region
                            );

                            // Highlight the feature
                            layer.setStyle(highlightStyle);
                            highlightRef.current = layer;
                        });

                        // Reset info control on mouseout
                        layer.on("mouseout", function (e) {
                            if (infoRef.current) {
                                infoRef.current.update();
                            }

                            // Reset the feature style
                            if (
                                highlightRef.current &&
                                selectedFeature !== feature
                            ) {
                                highlightRef.current.setStyle(
                                    styleGeoJSON(feature)
                                );
                                highlightRef.current = null;
                            }
                        });
                    }
                });

            geojsonLayer.addTo(map);
            geoJsonLayerRef.current = geojsonLayer; // Store the new layer
        };

        // Execute data processing
        processGeoJSONData();

        // Clean up on unmount
        return () => {
            if (infoRef.current) {
                infoRef.current.remove();
            }
            if (geoJsonLayerRef.current) {
                map.removeLayer(geoJsonLayerRef.current);
            }
        };
    }, [
        map,
        selectedDate,
        data_url?.url,  // Use URL as stable identifier instead of data object
        data_url?.data_vartype,  // Use primitive values for stable comparison
        setSelectedFeature,
        setSelectedProvince,
        setTimeSeries
    ]);

    // Update alerts when relevant data changes
    useEffect(() => {
        // If no geoJsonLayer yet, don't try to process alerts
        if (!geoJsonLayerRef.current) return;

        // Get the current GeoJSON data from the layer
        const features = [];
        geoJsonLayerRef.current.eachLayer((layer) => {
            if (layer.feature) {
                features.push(layer.feature);
            }
        });

        // Process alerts with the current features
        if (features.length > 0) {
            processAlerts(features, selectedDate);
        }
    }, [
        selectedDate,
        data_url.data_vartype,
        data_url.data_adminLevel,
        data_url.data_dateType,
        options.region
    ]);

    // Render alert markers if showWarnings is true
    return (
        <>
            {showWarnings &&
                alerts.map((alert, index) => (
                    // <AlertMarker
                    //     key={`alert-${index}`}
                    //     position={alert.position}
                    //     type={alert.type}
                    //     message={alert.message}
                    //     name={alert.name}
                    // />
                    <div></div>
                ))}
        </>
    );
};
