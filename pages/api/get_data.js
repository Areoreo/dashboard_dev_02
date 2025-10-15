import path from "path";
import fs from "fs";

export default function handler(req, res) {
    const {
        region = "SEA",
        varType = "Yield",
        adminLevel = "Country",
        dateType = "Yearly",
        overview = "hist",
        selectedDate = "2010"
    } = req.query;

    console.log("\n=== get_data API Request ===");
    console.log("Query parameters:", req.query);
    console.log("Parsed:", {
        region,
        varType,
        adminLevel,
        dateType,
        overview,
        selectedDate
    });

    let fileName;
    const overviewDir = overview === "hist" ? "Hist" : "Forecast"; // 映射小写 -> 首字母大写
    console.log("Overview directory:", overviewDir);

    function getFileName(
        overview,
        adminLevel,
        dateType,
        varType,
        region,
        selectedDate
    ) {
        // 处理 SPI 变量
        if (varType.startsWith("SPI")) {
            if (overview === "hist") {
                if (adminLevel === "Grid") {
                    if (dateType === "Yearly") {
                        // return `${region}_${varType}_${selectedDate}.tif`;
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`;
                    }
                    if (dateType === "Monthly") {
                        // return `${region}_${varType}_${selectedDate}.tif`;
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`;
                    }
                }
                if (adminLevel === "Country") {
                    if (dateType === "Yearly") {
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`;
                    }
                    if (dateType === "Monthly") {
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`;
                    }
                }
                if (adminLevel === "Prov") {
                    if (dateType === "Yearly") {
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`;
                    }
                    if (dateType === "Monthly") {
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`;
                    }
                }
            }
            if (overview === "forecast") {
                if (adminLevel === "Grid") {
                    if (dateType === "Yearly") {
                        // return `${region}_${varType}_${selectedDate}_1.tif`;
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`;
                    }
                    if (dateType === "Monthly") {
                        // return `${region}_${varType}_${selectedDate}_1.tif`;
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`;
                    }
                }
                if (adminLevel === "Country") {
                    if (dateType === "Yearly") {
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`;
                        // return `${region}_country_${varType}_forecast_yearly.geojson`; // data is named wrongly, country_monthly and prov_monthly are inversed!
                    }
                    if (dateType === "Monthly") {
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`;
                        // return `${region}_country_${varType}_forecast_monthly.geojson`;
                    }
                }
                if (adminLevel === "Prov") {
                    if (dateType === "Yearly") {
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`;
                    }
                    if (dateType === "Monthly") {
                        return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`;
                    }
                }
            }
        }

        // map list from varType to fileName
        const fileMappings = {
            forecast_Grid_Yearly: {
                Yield: `${region}_yield_yearly_${selectedDate}.tif`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                // smpct1: `${varType}_${overviewDir}_${adminLevel}_${dateType}_${region}_${selectedDate}_1.tif`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`
            },
            forecast_Grid_Monthly: {
                Yield: `${region}_yield_monthly_${selectedDate}.tif`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                // smpct1: `${varType}_${overviewDir}_${adminLevel}_${dateType}_${region}_${selectedDate}_1.tif`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`
            },
            forecast_Country_Yearly: {
                Yield: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`
            },
            forecast_Country_Monthly: {
                Yield: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`
            },
            forecast_Prov_Yearly: {
                Yield: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`
            },
            forecast_Prov_Monthly: {
                Yield: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`
            },
            // -------------------- ERA5 BASED HIST DATA API -------------------- //
            hist_Grid_Yearly: {
                Yield: `${region}_yield_yearly_${selectedDate}.tif`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`
            },
            hist_Grid_Monthly: {
                Yield: `${region}_yield_monthly_${selectedDate}.tif`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`
            },
            hist_Country_Yearly: {
                Yield: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`
            },
            hist_Country_Monthly: {
                Yield: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`
            },
            hist_Prov_Yearly: {
                Yield: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`
            },
            hist_Prov_Monthly: {
                Yield: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Prcp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                Temp: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                smpct1: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
                yieldAnom: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`
            }
            // -------------------- ERA5 BASED HIST DATA API -------------------- //

            //---------------------------BACKUP FOR HIST DATA -------------------------------//
            // hist_Grid_Yearly: {
            //     Yield: `${region}_yield_yearly_${selectedDate}.tif`,
            //     Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
            //     Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
            //     Prcp: `${region}_precipitation_${selectedDate}.tif`,
            //     Temp: `${region}_temperature_${selectedDate}.tif`
            // },
            // hist_Grid_Monthly: {
            //     Yield: `${region}_yield_monthly_${selectedDate}.tif`,
            //     Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
            //     Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`,
            //     Prcp: `${region}_precipitation_${selectedDate}.tif`,
            //     Temp: `${region}_temperature_${selectedDate}.tif`
            // },
            // hist_Country_Yearly: {
            //     Yield: `${region}_yield_country.geojson`,
            //     Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
            //     Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
            //     Prcp: `${region}_country_Precipitation_annual.geojson`,
            //     Temp: `${region}_country_Temperature_annual.geojson`
            // },
            // hist_Country_Monthly: {
            //     Yield: `${region}_monthly_yield_country.geojson`,
            //     Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
            //     Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
            //     Prcp: `${region}_country_Precipitation_monthly.geojson`,
            //     Temp: `${region}_country_Temperature_monthly.geojson`
            // },
            // hist_Prov_Yearly: {
            //     Yield: `${region}_yield_prov.geojson`,
            //     Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
            //     Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
            //     Prcp: `${region}_Precipitation_annual.geojson`,
            //     Temp: `${region}_Temperature_annual.geojson`
            // },
            // hist_Prov_Monthly: {
            //     Yield: `${region}_monthly_yield_province.geojson`,
            //     Area: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
            //     Production: `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`,
            //     Prcp: `${region}_precipitation_monthly.geojson`,
            //     Temp: `${region}_Temperature_monthly.geojson`
            // }
            //---------------------------BACKUP FOR HIST DATA -------------------------------//
        };

        // 生成 key 并查询文件名
        const key = `${overview}_${adminLevel}_${dateType}`;
        return fileMappings[key]?.[varType] || `no_data.json`;
    }

    // 调用 getFileName 获取文件名
    fileName = getFileName(
        overview,
        adminLevel,
        dateType,
        varType,
        region,
        selectedDate
    );
    console.log("📁 Generated filename:", fileName);

    let directory;

    // function getDirectory({
    //     region,
    //     varType,
    //     adminLevel,
    //     dateType,
    //     overview,
    //     overviewDir
    // }) {
    //     // hist SPI in ERA5/
    //     if (varType.startsWith("SPI") && overview === "hist") {
    //         directory = path.join(
    //             "ERA5",
    //             varType,
    //             overviewDir,
    //             adminLevel,
    //             dateType
    //         );
    //     } else if (varType.startsWith("SPI") && overview === "forecast") {
    //         directory = path.join(
    //             varType,
    //             overviewDir,
    //             adminLevel,
    //             dateType
    //         );
    //     }

    //     // Prcp
    //     if (varType === "Prcp" && overview === "hist") {
    //         directory = path.join(
    //             "ERA5",
    //             varType,
    //             overviewDir,
    //             adminLevel,
    //             dateType
    //         );
    //     }

    //     //Prcp raster forecast has its own directory
    //     else if (varType === "Prcp" && adminLevel === "Grid") {
    //         directory = "weatherGrid";
    //     }

    //     // Temp
    //     if (varType === "Temp" && overview === "hist") {
    //         directory = path.join(
    //             "ERA5",
    //             varType,
    //             overviewDir,
    //             adminLevel,
    //             dateType
    //         );
    //     }

    //     //Temp raster forecast has its own directory
    //     else if (varType === "Temp" && adminLevel === "Grid") {
    //         directory = "weatherGrid";
    //     }

    //     // SMPCT
    //     if (varType.startsWith("smpct")) {
    //         directory = path.join(
    //             "ERA5",
    //             varType,
    //             overviewDir,
    //             adminLevel,
    //             dateType
    //         );
    //     }

    //     // Yield handle
    //     if (varType === "Yield" && adminLevel === "Grid") {
    //         directory = "yield_grid"; //Yield raster forecast has its own directory
    //     } else if (
    //         varType === "Yield" &&
    //         overview === "forecast" &&
    //         adminLevel !== "Grid"
    //     ) {
    //         directory = "yield_json_forecast"; //yield prov/country forecast
    //     }

    //     // Production
    //     if (varType === "Production") {
    //         directory = path.join(varType, overviewDir, adminLevel, dateType);
    //     }

    //     // Area
    //     if (varType === "Area") {
    //         directory = path.join(varType, overviewDir, adminLevel, dateType);
    //     }

    //     return directory;
    // }
    // directory = getDirectory({
    //     region,
    //     varType,
    //     adminLevel,
    //     dateType,
    //     overview,
    //     overviewDir
    // });
    // no data for yield anomaly grid, add a text saying not available.
    // if (varType === "yieldAnom" && adminLevel === "Grid") {
    //      return res.status(200).json({
    //     status: "unavailable",
    //     message: "Yield anomaly data is not available at the grid level."
    //   });
    // }

    // ******************* SIMPLIFIED DIRECTORY LOGIC FOR ERA5 TEST DATA ***************************//
    // Unified directory structure: ERA5/{varType}/{Overview}/{AdminLevel}/{TimeType}/
    // This matches the actual test data structure in data/ERA5/SPI1/{Forecast|Hist}/{Country|Prov|Grid}/{Monthly|Yearly}/

    console.log("🔍 Determining directory path...");

    // For ERA5 test data (SPI indices), use simplified structure
    if (
        varType.startsWith("SPI") ||
        varType === "Prcp" ||
        varType === "Temp" ||
        varType === "smpct1"
    ) {
        directory = path.join(
            "ERA5",
            varType,
            overviewDir,
            adminLevel,
            dateType
        );
        console.log("  → Using ERA5 structure:", directory);
    }
    // For other variable types (Yield, Production, Area, etc.), keep legacy structure
    else if (varType === "Yield" && adminLevel === "Grid") {
        directory = "yield_grid";
        console.log("  → Using legacy Yield Grid directory:", directory);
    } else if (
        varType === "Yield" &&
        overview === "forecast" &&
        adminLevel !== "Grid"
    ) {
        // directory = "yield_json_forecast";
        // console.log("  → Using legacy Yield Forecast directory:", directory);
        directory = path.join(
            "ERA5",
            varType,
            overviewDir,
            adminLevel,
            dateType
        );
        console.log("  → Using ERA5 structure:", directory);
    } else if (
        varType === "Production" ||
        varType === "Area" ||
        varType === "yieldAnom"
    ) {
        // directory = path.join(varType, overviewDir, adminLevel, dateType);
        // console.log("  → Using standard structure:", directory);
        directory = path.join(
            "ERA5",
            varType,
            overviewDir,
            adminLevel,
            dateType
        );
        console.log("  → Using ERA5 structure:", directory);
    } else {
        // Default fallback
        // directory = path.join(varType, overviewDir, adminLevel, dateType);
        // console.log("  → Using default structure:", directory);
        directory = path.join(
            "ERA5",
            varType,
            overviewDir,
            adminLevel,
            dateType
        );
        console.log("  → Using ERA5 structure:", directory);
    }
    // ******************* END SIMPLIFIED DIRECTORY LOGIC ***************************//
    console.log("📂 Determined directory:", directory);

    // **security check**：防止路径遍历攻击

    const safeFileName = path.basename(fileName); // 仅保留文件名
    // const safeDirectory = directory ? path.basename(directory) : ""; // 可选的目录

    // determine final data file path
    const basePath = path.join(process.cwd(), "data");

    // 组合路径：/data/{varType}/{overviewDir}/{adminLevel}/{dateType}/{fileName}
    // 当overview=“hist”时，对应目录名“Hist”；当overview=“forecast”时，对应目录名“Forecast”

    const filePath = directory
        ? path.join(basePath, directory, safeFileName) // `/data/dir1/data.json`
        : path.join(basePath, safeFileName); // `/data/data.json`

    console.log("🔍 Full file path:", filePath);
    console.log("📍 Base path:", basePath);

    // **security check**：ensure safe directory access
    if (!filePath.startsWith(basePath)) {
        console.error("❌ Security check failed: Path traversal attempt");
        return res.status(403).json({ error: "Forbidden access" });
    }
    console.log("✅ Security check passed");

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        console.error("❌ File not found:", filePath);
        return res
            .status(400)
            .json({ error: `Data file not found: ${filePath}` });
    }
    console.log("✅ File exists");

    // 读取文件内容

    if (adminLevel === "Grid") {
        console.log("📤 Serving GeoTIFF file (binary stream)");
        try {
            // Serve the file as raw binary data
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${path.basename(filePath)}"`
            );
            const stream = fs.createReadStream(filePath);
            stream.pipe(res); // Stream the raw binary file to the frontend
            console.log("✅ GeoTIFF stream started");
        } catch (error) {
            console.error("❌ Error streaming GeoTIFF:", error);
            res.status(500).json({ error: "Failed to serve the GeoTIFF file" });
        }
    } else {
        console.log("📤 Serving GeoJSON file");
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                console.error("❌ Error reading GeoJSON file:", err);
                return res.status(500).json({
                    error: "Failed to read file",
                    details: err.message
                });
            }
            console.log("✅ GeoJSON file read successfully");
            try {
                const jsonData = JSON.parse(data);
                console.log("✅ JSON parsed successfully");
                console.log(
                    "📊 Features count:",
                    jsonData.features ? jsonData.features.length : "N/A"
                );
                console.log("=== End of get_data API Request ===\n");
                res.status(200).json(jsonData); // 返回 JSON 数据
            } catch (parseError) {
                console.error("❌ JSON parse error:", parseError);
                res.status(500).json({
                    error: "Failed to parse JSON",
                    details: parseError.message
                });
            }
        });
    }
}

//----- Use this if all data is well organized and prepared -----//

// function getFileName(
//     overview,
//     adminLevel,
//     dateType,
//     varType,
//     region,
//     selectedDate
// ) {
//     if (adminLevel === "Grid") {
//         return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}_${selectedDate}.tif`;
//     } else if (adminLevel === "Prov") {
//         return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`;
//     }else if (adminLevel === "Country") {
//         return `${overviewDir}_${adminLevel}_${dateType}_${varType}_${region}.geojson`;
//     }
// }

// let fileName
// fileName = getFileName(
//     overview,
//     adminLevel,
//     dateType,
//     varType,
//     region,
//     selectedDate
// )

// let directory
// directory = path.join(
//                 "ERA5",
//                 varType,
//                 overviewDir,
//                 adminLevel,
//                 dateType
//             );
