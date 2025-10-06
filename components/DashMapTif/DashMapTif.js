import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import { MapLegend } from "@components/MapLegend";
import { WarningControls } from "@components/WarningControls";
import { GeojsonLayer } from "@components/GeojsonLayer";
import { GeoTiffLayer } from "@components/GeoTiffLayer";
import { getColor } from "@utils/colorUtils";

export default function DashMapTif({
    data,
    options,
    selectedDate,
    selectedFeature,
    setSelectedProvince,
    setTimeSeries,
    setSelectedFeature
}) {
    console.log("\n=== DashMapTif Render ===");
    console.log("[DashMapTif] Props received:");
    console.log("  - data:", data);
    console.log("  - options:", options);
    console.log("  - selectedDate:", selectedDate);
    console.log("  - selectedFeature:", selectedFeature);

    // State for controlling warning visibility
    const [showWarnings, setShowWarnings] = useState(true);

    // Check if data is null, if so, set the default URL
    // if (data === null) {
    //     data = {
    //         url: "/api/get_Yield_Yearly_Country_SEA",
    //         datatype: "geojson",
    //         data_vartype: "Yield",
    //         data_adminLevel: "Country"
    //     };
    // }
    if (data === null) {
        console.log("[DashMapTif] ⚠️ Data is null, using fallback");
        data = {
            url: "no_data",
            datatype: "geojson",
            data_vartype: "no_data",
            data_adminLevel: "Country"
        };
    }

    useEffect(() => {
        console.log("\n=== DashMapTif Data Update ===");
        console.log("[DashMapTif] Data changed:", data);
        console.log("[DashMapTif] Data type:", data?.datatype);
        console.log("[DashMapTif] Selected date:", selectedDate);
        console.log("=== End DashMapTif Data Update ===\n");
    }, [data, selectedDate]);

    // Style function for GeoJSON features
    const styleGeoJSON = (feature) => {
        const baseKey = `y${selectedDate}`;
        const value =
            feature.properties[`${baseKey}_0`] ??
            feature.properties[baseKey] ??
            -99999; // Try ensemble 0 value first, then non-ensemble value

        // Create color options object
        const colorOptions = {
            varType: data.data_vartype,
            adminLevel: data.data_adminLevel,
            dateType: data.data_dateType
        };

        return {
            fillColor: getColor(value, colorOptions),
            color: "#666", // Border color
            weight: 2, // Border width
            dashArray: "3",
            fillOpacity: 0.7 // Fill opacity
        };
    };

    const [countryBoundaries, setCountryBoundaries] = useState(null);

    // Only load country boundaries when adminLevel is "Grid"
    useEffect(() => {
        if (options.adminLevel !== "Grid") return;

        fetch("/data/SEA_boundary.geojson")
            .then((res) => res.json())
            .then((data) => setCountryBoundaries(data))
            .catch((error) =>
                console.error("Error loading country boundaries:", error)
            );
    }, [options.adminLevel]);

    // Filter boundaries based on selected region
    const filteredBoundaries = countryBoundaries
        ? {
              ...countryBoundaries,
              features: countryBoundaries.features.filter(
                  (feature) =>
                      options.region === "SEA" ||
                      feature.properties.name === options.region
              )
          }
        : null;

    // Country boundary style
    const countryBoundaryStyle = (color) => ({
        color: color,
        weight: 2,
        opacity: 1,
        fillOpacity: 0
    });

    return (
        <MapContainer
            key={`map-${data.url}`}
            center={[18, 85]}
            zoom={4.5}
            zoomSnap={0.1}
            zoomDelta={0.25}
            minZoom={4}
            maxZoom={10}
            maxBounds={[
                [-5, 55],
                [40, 125]
            ]}
            scrollWheelZoom={false}
            className="map-container"
        >
            <MapLegend data={data} selectedDate={selectedDate} />
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>;'
            />
            
            {/* Add Warning Controls */}
            {/* Still testing it. Turn off when we want to use a stable version. */}
            {/* <WarningControls showWarnings={showWarnings} setShowWarnings={setShowWarnings} /> */}
            
            {options.adminLevel === "Grid" && filteredBoundaries && (
                <GeoJSON
                    data={filteredBoundaries}
                    style={countryBoundaryStyle("#333")}
                />
            )}
            
            {/* Render the appropriate layer based on data type */}
            {data.datatype === "geojson" && (
                <>
                    {console.log("[DashMapTif] 🗺️ Rendering GeoJSON layer")}
                    <GeojsonLayer
                        data_url={data}
                        options={options}
                        selectedDate={selectedDate}
                        selectedFeature={selectedFeature}
                        setSelectedProvince={setSelectedProvince}
                        setTimeSeries={setTimeSeries}
                        setSelectedFeature={setSelectedFeature}
                        showWarnings={showWarnings}
                    />
                </>
            )}

            {data.datatype === "geotiff" && (
                <>
                    {console.log("[DashMapTif] 🗺️ Rendering GeoTIFF layer")}
                    <GeoTiffLayer
                        data_url={data}
                        selectedDate={selectedDate}
                        options={options}
                        showWarnings={showWarnings}
                    />
                </>
            )}
            
            {/* Info Control for displaying details */}
            <InfoControl />
        </MapContainer>
    );
}

// Info Control Component
function InfoControl() {
    const map = useMap();
    const infoRef = useRef(null);

    useEffect(() => {
        const info = L.control();

        info.onAdd = function () {
            this._div = L.DomUtil.create("div", "info");
            this.update();
            return this._div;
        };

        info.update = function (content) {
            // Empty update method - implemented in GeojsonLayer
        };

        info.addTo(map);
        infoRef.current = info;
        
        return () => {
            if (infoRef.current) {
                infoRef.current.remove();
            }
        };
    }, [map]);

    return null;
}