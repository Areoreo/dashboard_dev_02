import path from "path";
import fs from "fs";

/**
 * Unified Data API - Simplified replacement for get_data.js
 * Handles both GeoJSON and GeoTIFF data with consistent response format
 */
export default function handler(req, res) {
    const {
        variable = "Yield",
        region = "SEA",
        overview = "hist",
        adminLevel = "Prov",
        timeType = "Yearly",
        date = "2020"
    } = req.query;

    console.log("\n=== Unified Data API Request ===");
    console.log("Query parameters:", req.query);
    console.log("Parsed parameters:", { variable, region, overview, adminLevel, timeType, date });

    try {
        // Input validation
        const validVariables = ["Yield", "Production", "Area", "Prcp", "Temp", "SPI1", "SPI3", "SPI6", "SPI12", "smpct1", "yieldAnom"];
        const validOverviews = ["hist", "forecast"];
        const validAdminLevels = ["Country", "Prov", "Grid"];
        const validTimeTypes = ["Yearly", "Monthly"];

        if (!validVariables.includes(variable)) {
            console.error(`❌ Invalid variable: ${variable}. Valid options:`, validVariables);
            return res.status(400).json({ error: `Invalid variable: ${variable}` });
        }
        if (!validOverviews.includes(overview)) {
            console.error(`❌ Invalid overview: ${overview}. Valid options:`, validOverviews);
            return res.status(400).json({ error: `Invalid overview: ${overview}` });
        }
        if (!validAdminLevels.includes(adminLevel)) {
            console.error(`❌ Invalid adminLevel: ${adminLevel}. Valid options:`, validAdminLevels);
            return res.status(400).json({ error: `Invalid adminLevel: ${adminLevel}` });
        }
        if (!validTimeTypes.includes(timeType)) {
            console.error(`❌ Invalid timeType: ${timeType}. Valid options:`, validTimeTypes);
            return res.status(400).json({ error: `Invalid timeType: ${timeType}` });
        }

        console.log("✅ Input validation passed");

        // Build file path using simple, consistent structure
        const basePath = path.join(process.cwd(), "data");
        let filePath;
        let isRaster = false;

        if (adminLevel === "Grid") {
            // Raster data (GeoTIFF)
            isRaster = true;
            const filename = `${region}_${variable.toLowerCase()}_${timeType.toLowerCase()}_${date}.tif`;
            filePath = path.join(basePath, variable, overview, adminLevel, timeType, filename);
            console.log("🗺️  Building GeoTIFF raster path:", filePath);
        } else {
            // Vector data (GeoJSON)
            const filename = `${region}_${adminLevel.toLowerCase()}_${overview}_${timeType.toLowerCase()}.geojson`;
            filePath = path.join(basePath, variable, overview, adminLevel, timeType, filename);
            console.log("📍 Building GeoJSON vector path:", filePath);
        }

        // Security check: ensure path is within data directory
        const resolvedPath = path.resolve(filePath);
        const resolvedBasePath = path.resolve(basePath);
        if (!resolvedPath.startsWith(resolvedBasePath)) {
            console.error("❌ Security violation: Path outside data directory");
            console.error("Resolved path:", resolvedPath);
            console.error("Base path:", resolvedBasePath);
            return res.status(403).json({ error: "Forbidden access" });
        }
        console.log("✅ Security check passed");

        // Check if file exists
        console.log("🔍 Checking if file exists:", filePath);
        const fileExists = fs.existsSync(filePath);
        console.log(`File exists: ${fileExists}`);

        if (!fileExists) {
            // Try fallback locations for backward compatibility
            console.log("⚠️  Primary file not found, trying fallback paths...");
            const fallbackPaths = generateFallbackPaths(basePath, variable, region, overview, adminLevel, timeType, date);
            console.log(`Generated ${fallbackPaths.length} fallback paths to check`);

            let foundPath = null;
            for (let i = 0; i < fallbackPaths.length; i++) {
                const fallbackPath = fallbackPaths[i];
                if (fs.existsSync(fallbackPath)) {
                    console.log(`✅ Found file at fallback path #${i + 1}:`, fallbackPath);
                    foundPath = fallbackPath;
                    break;
                }
            }

            if (!foundPath) {
                console.error("❌ File not found in any location");
                console.error("Primary path:", filePath);
                console.error("Checked", fallbackPaths.length, "fallback paths");
                console.error("Sample fallback paths:", fallbackPaths.slice(0, 5));
                return res.status(404).json({
                    error: `Data file not found: ${path.basename(filePath)}`,
                    searchPaths: [filePath, ...fallbackPaths.slice(0, 10)].map(p => path.basename(p)),
                    primaryPath: filePath,
                    basePath: basePath
                });
            }

            filePath = foundPath;
        } else {
            console.log("✅ File found at primary path");
        }

        // Serve the file based on type
        if (isRaster) {
            // Serve GeoTIFF as binary stream
            console.log("📤 Serving GeoTIFF raster data");
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);

            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        } else {
            // Serve GeoJSON as parsed JSON
            console.log("📤 Reading and serving GeoJSON data");
            fs.readFile(filePath, "utf8", (err, data) => {
                if (err) {
                    console.error("❌ Error reading file:", err);
                    return res.status(500).json({ error: "Failed to read data file", details: err.message });
                }

                try {
                    console.log("🔄 Parsing JSON data...");
                    const jsonData = JSON.parse(data);
                    console.log(`✅ JSON parsed successfully. Keys:`, Object.keys(jsonData));

                    // Check if it's already in unified format
                    if (jsonData.metadata && jsonData.dataType) {
                        // Already in unified format
                        console.log("✅ Data is in unified format, serving as-is");
                        console.log("Metadata:", jsonData.metadata);
                        console.log("Features count:", jsonData.features?.length || 0);
                        res.status(200).json(jsonData);
                    } else {
                        // Legacy format - convert on the fly
                        console.log("🔄 Converting legacy format to unified format...");
                        console.log("Legacy data structure:", {
                            hasFeatures: !!jsonData.features,
                            featureCount: jsonData.features?.length || 0,
                            firstFeatureKeys: jsonData.features?.[0] ? Object.keys(jsonData.features[0]) : []
                        });
                        const convertedData = convertLegacyFormat(jsonData, variable, region, overview, adminLevel, timeType);
                        console.log("✅ Conversion complete");
                        console.log("Converted features count:", convertedData.features?.length || 0);
                        res.status(200).json(convertedData);
                    }
                } catch (parseError) {
                    console.error("❌ Error parsing JSON:", parseError);
                    console.error("Parse error details:", parseError.message);
                    console.error("File path:", filePath);
                    return res.status(500).json({ error: "Invalid JSON data", details: parseError.message });
                }
            });
        }

    } catch (error) {
        console.error("❌ API Error:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }

    console.log("=== End of API Request ===\n");
}

/**
 * Generate fallback file paths for backward compatibility
 */
function generateFallbackPaths(basePath, variable, region, overview, adminLevel, timeType, date) {
    const fallbackPaths = [];

    // Common legacy directory structures
    const legacyDirs = [
        path.join(basePath, "yield_json_forecast"),
        path.join(basePath, "yield_json_hist"),
        path.join(basePath, "yield_grid"),
        path.join(basePath, "SPI_json"),
        path.join(basePath, "SPI_grid"),
        path.join(basePath, variable),
        path.join(basePath)
    ];

    // Common legacy filename patterns
    const legacyFilenames = [
        `${region}_${adminLevel.toLowerCase()}_${date}.geojson`,
        `${region}_${adminLevel.toLowerCase()}_${overview}_${timeType.toLowerCase()}.geojson`,
        `${region}_${variable.toLowerCase()}_${timeType.toLowerCase()}_${date}.tif`,
        `${region}_yield_${timeType.toLowerCase()}_${date}.tif`,
        `${region}_prov_${date}_${timeType.toLowerCase()}.geojson`,
        `${overview}_${adminLevel}_${timeType}_${variable}_${region}.geojson`,
        `${overview}_${adminLevel}_${timeType}_${variable}_${region}_${date}.tif`
    ];

    // Generate all combinations
    for (const dir of legacyDirs) {
        for (const filename of legacyFilenames) {
            fallbackPaths.push(path.join(dir, filename));
        }
    }

    return fallbackPaths;
}

/**
 * Convert legacy GeoJSON format to unified format on the fly
 */
function convertLegacyFormat(legacyData, variable, region, overview, adminLevel, timeType) {
    // Extract features
    const features = legacyData.features || [legacyData];
    const convertedFeatures = [];

    for (const feature of features) {
        if (!feature.properties) continue;

        const properties = feature.properties;
        const timeSeries = [];

        // Convert legacy properties to timeSeries
        for (const [key, value] of Object.entries(properties)) {
            if (!key.startsWith('y') || value === null || value === undefined) {
                continue;
            }

            // Handle ensemble data (y202504_0, y202504_1, etc.)
            const ensembleMatch = key.match(/^y(\d{6})_(\w+)$/);
            if (ensembleMatch) {
                const dateStr = ensembleMatch[1];
                const suffix = ensembleMatch[2];
                
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const isoDate = `${year}-${month}-01`;

                // Find or create time series entry for this date
                let entry = timeSeries.find(e => e.date === isoDate);
                if (!entry) {
                    entry = { date: isoDate, ensembleValues: [], statistics: {} };
                    timeSeries.push(entry);
                }

                if (suffix.match(/^\d+$/)) {
                    // Ensemble member
                    entry.ensembleValues.push(parseFloat(value));
                } else if (['mean', 'min', 'max'].includes(suffix)) {
                    // Statistics
                    entry.statistics[suffix] = parseFloat(value);
                }
                continue;
            }

            // Handle regular time series (y2020, y202001)
            const timeMatch = key.match(/^y(\d{4,6})$/);
            if (timeMatch) {
                const dateStr = timeMatch[1];
                let isoDate;

                if (dateStr.length === 4) {
                    isoDate = `${dateStr}-01-01`;
                } else if (dateStr.length === 6) {
                    const year = dateStr.substring(0, 4);
                    const month = dateStr.substring(4, 6);
                    isoDate = `${year}-${month}-01`;
                } else {
                    continue;
                }

                timeSeries.push({
                    date: isoDate,
                    value: parseFloat(value),
                    quality: "high"
                });
            }
        }

        // Sort time series by date
        timeSeries.sort((a, b) => a.date.localeCompare(b.date));

        // Create new feature
        const newProperties = {
            id: properties.id || properties.name || "unknown",
            name: properties.name || properties.id || "Unknown",
            timeSeries: timeSeries
        };

        // Keep other non-time properties
        for (const [key, value] of Object.entries(properties)) {
            if (!key.startsWith('y') && !['id', 'name'].includes(key)) {
                newProperties[key] = value;
            }
        }

        convertedFeatures.push({
            type: "Feature",
            geometry: feature.geometry,
            properties: newProperties
        });
    }

    // Create metadata
    const dates = convertedFeatures.flatMap(f => f.properties.timeSeries.map(ts => ts.date));
    const startDate = dates.length > 0 ? Math.min(...dates.map(d => new Date(d))) : new Date("1990-01-01");
    const endDate = dates.length > 0 ? Math.max(...dates.map(d => new Date(d))) : new Date("2025-12-31");

    const unitsMap = {
        'Yield': 'tons/hectare',
        'Production': 'tons',
        'Area': 'hectares',
        'Prcp': 'mm',
        'Temp': '°C',
        'SPI1': 'index',
        'SPI3': 'index',
        'SPI6': 'index',
        'SPI12': 'index',
        'smpct1': 'percentile',
        'yieldAnom': 'anomaly'
    };

    return {
        metadata: {
            variable: variable,
            region: region,
            overview: overview,
            adminLevel: adminLevel,
            timeType: timeType,
            dateRange: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            },
            units: unitsMap[variable] || 'unknown',
            description: `${overview.charAt(0).toUpperCase() + overview.slice(1)} ${variable} data for ${region} at ${adminLevel} level`
        },
        dataType: "geojson",
        features: convertedFeatures
    };
}