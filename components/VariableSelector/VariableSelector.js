import React, { useState } from "react";

export const VariableSelector = ({ selectedVar, updateOption }) => {
    const [isProductionOpen, setProductionOpen] = useState(true);
    const [isMeteorologyOpen, setMeteorologyOpen] = useState(true);

    const productionOptions = [
        { value: "Yield", label: "Rice Yield" },
        { value: "Area", label: "Rice Area" },
        { value: "Production", label: "Rice Production" },
        { value: "yieldAnom", label: "Yield Anomaly" }
    ];
    const meteorologyOptions = [
        { value: "SPI1", label: "Drought Index (1 month)" },
        { value: "SPI3", label: "Drought Index (3 months)" },
        { value: "SPI6", label: "Drought Index (6 months)" },
        { value: "SPI12", label: "Drought Index (12 months)" },
        // { value: "smpct1", label: "Soil Moisture Percentile" },
        { value: "Prcp", label: "Precipitation" },
        { value: "Temp", label: "Temperature" }
    ];

    return (
        <div className="variable-selector">
            {/* Production Section */}
            <div className="variable-section">
                <button
                    className="section-title"
                    onClick={() => setProductionOpen(!isProductionOpen)}
                >
                    Rice
                    <span
                        className={`toggle-icon ${
                            isProductionOpen ? "open" : "closed"
                        }`}
                    >
                        ▼
                    </span>
                </button>
                {isProductionOpen && (
                    <div className="variable-list">
                        {productionOptions.map((opt) => (
                            <button
                                key={opt.value}
                                className={`variable-item ${
                                    selectedVar === opt.value ? "selected" : ""
                                }`}
                                onClick={() =>
                                    updateOption("varType", opt.value)
                                }
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Meteorology Section */}
            <div className="variable-section">
                <button
                    className="section-title"
                    onClick={() => setMeteorologyOpen(!isMeteorologyOpen)}
                >
                    Meteorology
                    <span
                        className={`toggle-icon ${
                            isMeteorologyOpen ? "open" : "closed"
                        }`}
                    >
                        ▼
                    </span>
                </button>
                {isMeteorologyOpen && (
                    <div className="variable-list">
                        {meteorologyOptions.map((opt) => (
                            <button
                                key={opt.value}
                                className={`variable-item ${
                                    selectedVar === opt.value ? "selected" : ""
                                }`}
                                onClick={() =>
                                    updateOption("varType", opt.value)
                                }
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        // <div className="variable-selector">
        //     {/* Production Section */}
        //     <div className="variable-section">
        //         <h3 className="section-title">Production</h3>
        //         <div className="variable-list">
        //             {productionOptions.map((opt) => (
        //                 <button
        //                     key={opt.value}
        //                     className={`variable-item ${
        //                         selectedVar === opt.value ? "selected" : ""
        //                     }`}
        //                     onClick={() => updateOption("varType", opt.value)}
        //                 >
        //                     {opt.label}
        //                 </button>
        //             ))}
        //         </div>
        //     </div>

        //     {/* Meteorology Section */}
        //     <div className="variable-section">
        //         <h3 className="section-title">Meteorology</h3>
        //         <div className="variable-list">
        //             {meteorologyOptions.map((opt) => (
        //                 <button
        //                     key={opt.value}
        //                     className={`variable-item ${
        //                         selectedVar === opt.value ? "selected" : ""
        //                     }`}
        //                     onClick={() => updateOption("varType", opt.value)}
        //                 >
        //                     {opt.label}
        //                 </button>
        //             ))}
        //         </div>
        //     </div>
        // </div>
    );
};

// backup var selector
{
    /* <label className="flex flex-col text-sm font-medium text-gray-700">
    <span>Variables:</span>
    <select
        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={(e) => updateOption("varType", e.target.value)}
        value={options.varType}
    >
        <option value="Yield">Rice Yield</option>
        <option value="SPI1">Drought Index (1 month)</option>
        <option value="SPI3">Drought Index (3 months)</option>
        <option value="SPI6">Drought Index (6 months)</option>
        <option value="SPI12">Drought Index (12 months)</option>
        <option value="SMPct">Soil Moisture Percentile</option>
        <option value="Prcp">Precipitation</option>
        <option value="Temp">Temperature</option>
    </select>
</label>; */
}
