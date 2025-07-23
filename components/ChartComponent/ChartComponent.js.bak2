import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

// export const ChartComponent = ({ data }) => {
//     // console.log("data:", data);
//     const chartRef = useRef(null);
//     const chartInstanceRef = useRef(null);

//     const [startYear, setStartYear] = useState(data[0].year); // 起始年份
//     const [endYear, setEndYear] = useState(data[data.length - 1].year); // 结束年份
//     const [filteredData, setFilteredData] = useState(data); // 过滤后的数据

//     useEffect(() => {
//         if (!chartRef.current) return;

//         // 销毁现有的图表实例以避免重复渲染
//         if (chartInstanceRef.current) {
//             chartInstanceRef.current.destroy();
//         }

//         // 处理输入数据
//         const labels = filteredData.map((item) => item.year);
//         const values = filteredData.map((item) => item.value);

//         // 创建图表实例
//         chartInstanceRef.current = new Chart(chartRef.current, {
//             type: "line",
//             data: {
//                 labels,
//                 datasets: [
//                     {
//                         label: "Time Series Data",
//                         data: values,
//                         borderColor: "rgba(75, 192, 192, 1)",
//                         backgroundColor: "rgba(75, 192, 192, 0.2)",
//                         borderWidth: 2
//                     }
//                 ]
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 plugins: {
//                     legend: {
//                         display: true,
//                         position: "top"
//                     }
//                 },
//                 scales: {
//                     x: {
//                         title: {
//                             display: true,
//                             text: "Year"
//                         }
//                     },
//                     y: {
//                         title: {
//                             display: true,
//                             text: "Value"
//                         }
//                     }
//                 }
//             }
//         });

//         // After the chart is created, update it if needed
//         if (chartInstanceRef.current) {
//             chartInstanceRef.current.update(); // Ensure the chart updates with new data
//         }

//         return () => {
//             if (chartInstanceRef.current) {
//                 chartInstanceRef.current.destroy();
//             }
//         };
//     }, [filteredData]);

//     // 更新图表数据范围
//     const handleRangeChange = () => {
//         const newFilteredData = data.filter(
//             (item) => item.year >= startYear && item.year <= endYear
//         );
//         setFilteredData(newFilteredData);
//     };

//     // export CSV file
//     const downloadCSV = () => {
//         const csvRows = [["Year", "Value"]];
//         filteredData.forEach(({ year, value }) => {
//             csvRows.push([year, value]);
//         });

//         const csvContent = csvRows.map((row) => row.join(",")).join("\n");
//         const blob = new Blob([csvContent], { type: "text/csv" });
//         const url = URL.createObjectURL(blob);

//         const link = document.createElement("a");
//         link.href = url;
//         link.download = `time_series_${startYear}-${endYear}.csv`;
//         link.click();
//         URL.revokeObjectURL(url);
//     };

//     return (
//         <div>
//             {/* time range select */}
//             <div style={{ marginBottom: "20px" }}>
//                 <label>
//                     Start Year:
//                     <select
//                         value={startYear}
//                         onChange={(e) => setStartYear(Number(e.target.value))}
//                     >
//                         {data.map((item) => (
//                             <option key={item.year} value={item.year}>
//                                 {item.year}
//                             </option>
//                         ))}
//                     </select>
//                 </label>
//                 <label style={{ marginLeft: "20px" }}>
//                     End Year:
//                     <select
//                         value={endYear}
//                         onChange={(e) => setEndYear(Number(e.target.value))}
//                     >
//                         {data.map((item) => (
//                             <option key={item.year} value={item.year}>
//                                 {item.year}
//                             </option>
//                         ))}
//                     </select>
//                 </label>
//                 <button
//                     onClick={handleRangeChange}
//                     style={{
//                         marginLeft: "20px",
//                         backgroundColor: "#4CAF50", // Green background
//                         color: "white", // Text color
//                         border: "none", // Remove default border
//                         padding: "10px 20px", // Padding for better click area
//                         fontSize: "16px", // Font size for readability
//                         borderRadius: "5px", // Rounded corners
//                         cursor: "pointer", // Pointer cursor on hover
//                         transition: "background-color 0.3s ease" // Smooth background transition
//                     }}
//                     onMouseEnter={(e) =>
//                         (e.target.style.backgroundColor = "#45a049")
//                     } // Darker green on hover
//                     onMouseLeave={(e) =>
//                         (e.target.style.backgroundColor = "#4CAF50")
//                     } // Revert back to original color
//                 >
//                     Update Chart
//                 </button>
//             </div>

//             {/* download button */}
//             <button
//                 onClick={downloadCSV}
//                 style={{
//                     margin: "10px",
//                     padding: "10px 20px",
//                     backgroundColor: "white",
//                     color: "rgba(75, 192, 192, 1)",
//                     border: "2px solid",
//                     borderRadius: "5px",
//                     cursor: "pointer"
//                 }}
//             >
//                 Download Selected Data
//             </button>

//             {/* the chart */}
//             <div
//                 style={{ position: "relative", height: "400px", width: "100%" }}
//             >
//                 <canvas ref={chartRef}></canvas>
//             </div>
//         </div>
//     );
// };

export const ChartComponent = ({ data, options }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });

    useEffect(() => {
        if (!data || data.length === 0 || !chartRef.current) return;

        console.log("Updating chart with options:", options);
        console.log("Updating chart with received data:", data);

        const labels = [...new Set(data.map((d) => d.year))].sort(); // 确保 X 轴按时间排序
        const ensembleMembers = [...new Set(data.map((d) => d.ensemble))]; // 获取所有 ensemble 成员

        const datasets = ensembleMembers.map((member) => ({
            label: `Ensemble Member ${member}`,
            data: labels.map((year) => {
                const entry = data.find(
                    (d) => d.year === year && d.ensemble === member
                );
                return entry ? entry.value : null;
            }),
            borderColor: `rgba(${Math.random() * 255}, ${
                Math.random() * 255
            }, ${Math.random() * 255}, 1)`,
            backgroundColor: `rgba(${Math.random() * 255}, ${
                Math.random() * 255
            }, ${Math.random() * 255}, 0.2)`,
            borderWidth: 2,
            fill: false,
            spanGaps: true
        }));

        setChartData({ labels, datasets });
    }, [data, options]);

    useEffect(() => {
        if (!chartRef.current || !chartData.labels.length) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new Chart(chartRef.current, {
            type: "line",
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "top"
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Year"
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: "Value"
                        }
                    }
                }
            }
        });
    }, [chartData]);

    return (
        <div style={{ position: "relative", height: "400px", width: "100%" }}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

// import React, { useEffect, useRef, useState } from "react";
// import Chart from "chart.js/auto";

// export const ChartComponent = ({ data, options }) => {
//     const chartRef = useRef(null);
//     const chartInstanceRef = useRef(null);
//     const [chartData, setChartData] = useState({ labels: [], datasets: [] });

//     useEffect(() => {
//         if (!data || data.length === 0 || !chartRef.current) return;

//         console.log("Updating chart with options:", options); // 调试输出

//         const cutoffYear = parseInt(options.date) || 2020;
//         const historyData = data.filter((d) => d.year <= cutoffYear);
//         const forecastData = data.filter((d) => d.year >= cutoffYear);

//         const labels = data.map((d) => d.year); // 确保所有数据的横坐标一致

//         let datasets = [
//             {
//                 label: "Historical Data",
//                 data: labels.map((year) => {
//                     const entry = historyData.find((d) => d.year === year);
//                     return entry ? entry.value : null;
//                 }),
//                 borderColor: "rgba(75, 192, 192, 1)",
//                 backgroundColor: "rgba(75, 192, 192, 0.2)",
//                 borderWidth: 2,
//                 fill: false,
//                 spanGaps: true // 允许数据间的间隙连线
//             }
//         ];

//         if (options?.overview === "forecast") {
//             datasets.push(
//                 {
//                     label: "Forecast Data",
//                     data: labels.map((year) => {
//                         const entry = forecastData.find((d) => d.year === year);
//                         return entry ? entry.value : null;
//                     }),
//                     borderColor: "rgba(255, 99, 132, 1)",
//                     backgroundColor: "rgba(255, 99, 132, 0.2)",
//                     borderWidth: 2,
//                     fill: false,
//                     borderDash: [5, 5],
//                     spanGaps: true // 允许预测数据与历史数据相连
//                 },
//                 {
//                     label: "Confidence Interval Upper",
//                     data: labels.map((year) => {
//                         const entry = forecastData.find((d) => d.year === year);
//                         return entry ? entry.upper_bound : null;
//                     }),
//                     borderColor: "rgba(255, 99, 132, 0.3)",
//                     borderWidth: 0,
//                     fill: {
//                         target: "-1",
//                         above: "rgba(255, 99, 132, 0.1)",
//                         below: "rgba(255, 99, 132, 0.1)"
//                     },
//                     spanGaps: true
//                 },
//                 {
//                     label: "Confidence Interval Lower",
//                     data: labels.map((year) => {
//                         const entry = forecastData.find((d) => d.year === year);
//                         return entry ? entry.lower_bound : null;
//                     }),
//                     borderColor: "rgba(255, 99, 132, 0.3)",
//                     borderWidth: 0,
//                     fill: {
//                         target: "-1",
//                         above: "rgba(255, 99, 132, 0.1)",
//                         below: "rgba(255, 99, 132, 0.1)"
//                     },
//                     spanGaps: true
//                 }
//             );
//         }

//         setChartData({ labels, datasets });
//     }, [data, options]);

//     useEffect(() => {
//         if (!chartRef.current || !chartData.labels.length) return;

//         if (chartInstanceRef.current) {
//             chartInstanceRef.current.destroy();
//         }

//         chartInstanceRef.current = new Chart(chartRef.current, {
//             type: "line",
//             data: chartData,
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 plugins: {
//                     legend: {
//                         display: true,
//                         position: "top"
//                     }
//                 },
//                 scales: {
//                     x: {
//                         title: {
//                             display: true,
//                             text: "Year"
//                         }
//                     },
//                     y: {
//                         title: {
//                             display: true,
//                             text: "Value"
//                         }
//                     }
//                 }
//             }
//         });
//     }, [chartData]);

//     return (
//         <div style={{ position: "relative", height: "400px", width: "100%" }}>
//             <canvas ref={chartRef}></canvas>
//         </div>
//     );
// };
