import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Use dynamic import to avoid SSR issues with Leaflet
const DashMapTif = dynamic(
  () => import("@components/DashMapTif/DashMapTif"),
  {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center">Loading map...</div>
  }
);

export const ResponsiveMapContainer = ({
  mapData,
  options,
  selectedDate,
  selectedFeature,
  setSelectedFeature,
  setSelectedProvince,
  setTimeSeries,
  mapLoading,
  errorMessage
}) => {
  console.log("\n=== ResponsiveMapContainer Render ===");
  console.log("[ResponsiveMapContainer] Props:");
  console.log("  - mapData:", mapData);
  console.log("  - options:", options);
  console.log("  - selectedDate:", selectedDate);
  console.log("  - mapLoading:", mapLoading);
  console.log("  - errorMessage:", errorMessage);

  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on component mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      console.log("[ResponsiveMapContainer] Device type:", mobile ? "📱 Mobile" : "💻 Desktop");
    };

    // Set initial value
    checkMobile();

    // Add event listener
    window.addEventListener("resize", checkMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Format date for display
  const formatDateDisplay = (date) => {
    if (!date) return "Unknown Date";

    const year = date.slice(0, 4);
    const month = date.length >= 6 ? date.slice(4, 6) : null;
    const day = date.length === 8 ? date.slice(6, 8) : null;

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    const monthFormatted = month ? monthNames[parseInt(month, 10) - 1] : "";

    if (date.length === 4) {
      return `${year}`;
    } else if (date.length === 6) {
      return `${monthFormatted}, ${year}`;
    } else if (date.length === 8) {
      return `${monthFormatted} ${parseInt(day, 10)}, ${year}`;
    }

    return "Invalid Date";
  };

  return (
    <div className="map-container relative">
      {/* Date display - different positioning for mobile vs desktop */}
      <div className={`date-mainshow-container ${isMobile ? 'top-0 right-0 transform-none' : 'bottom-0 right-50 transform-translate-x-50'}`}>
        <p>{formatDateDisplay(selectedDate)}</p>
      </div>

      {/* Error message - centered on mobile, more prominent */}
      {/* {errorMessage && (
        <div className={`error-message ${isMobile ? 'top-16 w-5/6 left-1/2 transform-translate-x-50' : ''}`}>
          <p>{errorMessage}</p>
        </div>
      )} */}

      {/* Map loading overlay */}
      {mapLoading && (
        <>
          {console.log("[ResponsiveMapContainer] ⏳ Showing loading overlay")}
          <div className="map-loading-overlay">
            <div className="map-loading-spinner"></div>
          </div>
        </>
      )}

      {/* The map itself */}
      {console.log("[ResponsiveMapContainer] 🗺️ Rendering DashMapTif")}
      <DashMapTif
        data={mapData}
        options={options}
        selectedDate={selectedDate}
        selectedFeature={selectedFeature}
        setSelectedFeature={setSelectedFeature}
        setSelectedProvince={setSelectedProvince}
        setTimeSeries={setTimeSeries}
      />
      {console.log("=== End ResponsiveMapContainer Render ===\n")}

      {/* Responsive scroll button - more prominent on mobile */}
      ${isMobile && (
      <button
        className={`scroll-to-details-btn ${isMobile ? 'w-4/5 py-3' : ''}`}
        onClick={() => document.getElementById('details-section').scrollIntoView({ behavior: 'smooth' })}
      >
        View Details ↓
      </button>)}
    </div>
  );
};

export default ResponsiveMapContainer;