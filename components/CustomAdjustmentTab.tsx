"use client";

import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    ComposedChart,
} from "recharts";
import {
    Calendar,
    DollarSign,
    Package,
    TrendingDown,
    Factory,
    Settings,
    Play,
    RotateCcw,
    ArrowRight,
} from "lucide-react";
import axios from "axios";

interface CustomAdjustmentTabProps {
    onRefresh: () => void;
    loading: boolean;
    timeData?: any;
    costData?: any;
}

// ข้อมูลผลิตภัณฑ์จากรูป
const productFormulas = [
    {
        type: "Dura Board",
        name: "Dura Board",
        formula: "F02G",
        originalRatios: {
            pulp_a: 90.0,
            pulp_b: 0.0,
            pulp_c: 5.0,
            eucalyptus: 7.6,
        },
        target: 1096.24,
    },
    {
        type: "SCG Board",
        name: "SB หนาต่ำกว่า 6 mm. ( < 6 mm.)...",
        formula: "F01-3G",
        originalRatios: {
            pulp_a: 80.0,
            pulp_b: 20.0,
            pulp_c: 0.0,
            eucalyptus: 7.6,
        },
        target: 132.01,
    },
    {
        type: "SCG Board",
        name: "SB หนาต่ำกว่า 6 mm. ( < 6 mm.)...",
        formula: "F13-1",
        originalRatios: {
            pulp_a: 75.0,
            pulp_b: 15.0,
            pulp_c: 10.0,
            eucalyptus: 7.6,
        },
        target: 763.48,
    },
    {
        type: "SCG Board",
        name: "SB หนาเกิน 6 mm. ( > 6 mm.) Si...",
        formula: "F01",
        originalRatios: {
            pulp_a: 85.0,
            pulp_b: 10.0,
            pulp_c: 5.0,
            eucalyptus: 8.2,
        },
        target: 603.29,
    },
    {
        type: "SCG Board",
        name: "SB หนาหกจันทรา 6 mm. ( = 6 mm.)...",
        formula: "F01G",
        originalRatios: {
            pulp_a: 90.0,
            pulp_b: 5.0,
            pulp_c: 5.0,
            eucalyptus: 8.2,
        },
        target: 899.29,
    },
    {
        type: "SCG Wood",
        name: "Wood others ไม่สังเคราะห์ ความ...",
        formula: "F11",
        originalRatios: {
            pulp_a: 90.0,
            pulp_b: 10.0,
            pulp_c: 0.0,
            eucalyptus: 7.6,
        },
        target: 744.27,
    },
    {
        type: "SCG Wood",
        name: "Wood others ไม่สังเคราะห์น...",
        formula: "F09",
        originalRatios: {
            pulp_a: 75.0,
            pulp_b: 20.0,
            pulp_c: 5.0,
            eucalyptus: 8.2,
        },
        target: 124.97,
    },
    {
        type: "SCG Wood",
        name: "ไม้ฝา ความยาวมากกว่า 310 cm....",
        formula: "F09",
        originalRatios: {
            pulp_a: 75.0,
            pulp_b: 20.0,
            pulp_c: 5.0,
            eucalyptus: 8.2,
        },
        target: 429.33,
    },
    {
        type: "SCG Board",
        name: "SB หนาหกจันทรา 6 mm. ( = 6 mm.)...",
        formula: "F13-1",
        originalRatios: {
            pulp_a: 70.0,
            pulp_b: 20.0,
            pulp_c: 10.0,
            eucalyptus: 7.6,
        },
        target: 863.11,
    },
    {
        type: "SCG Wood",
        name: "ไม้ฝา ความยาวไม่เกิน 310 cm....",
        formula: "F12G",
        originalRatios: {
            pulp_a: 80.0,
            pulp_b: 20.0,
            pulp_c: 0.0,
            eucalyptus: 5.5,
        },
        target: 228.61,
    },
];

export default function CustomAdjustmentTab({
    onRefresh,
    loading,
    timeData,
    costData,
}: CustomAdjustmentTabProps) {
    const [compareMode, setCompareMode] = useState<"time" | "cost">("time");
    const [customRatios, setCustomRatios] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalResults, setOriginalResults] = useState<any>(null);
    const [customResults, setCustomResults] = useState<any>(null);

    // Initialize custom ratios from API data or fallback to product formulas
    useEffect(() => {
        console.log("Initializing customRatios with:", {
            timeData,
            costData,
            compareMode,
        });

        // Get initial data based on current compareMode
        const initialData = compareMode === "time" ? timeData : costData;

        if (initialData?.products && Array.isArray(initialData.products)) {
            // Use API data if available
            setCustomRatios(initialData.products);
        } else {
            // Fallback to static data if no API data
            const fallbackRatios = productFormulas.map((product, index) => ({
                id: index,
                ...product,
                customRatios: { ...product.originalRatios },
            }));
            setCustomRatios(fallbackRatios);
        }
    }, [timeData, costData, compareMode]);

    // Update original results when compareMode or data changes
    useEffect(() => {
        if (compareMode === "time" && timeData) {
            setOriginalResults(timeData);
        } else if (compareMode === "cost" && costData) {
            setOriginalResults(costData);
        } else {
            console.log("No matching data found, clearing originalResults");
            setOriginalResults(null);
        }
    }, [compareMode, timeData, costData]);

    // Handle compare mode change
    const handleCompareModeChange = (newMode: "time" | "cost") => {
        console.log("Compare mode changed to:", newMode);
        setCompareMode(newMode);
        // Reset custom results when changing mode
        setCustomResults(null);

        // Set original results based on new mode
        if (newMode === "time" && timeData) {
            setOriginalResults(timeData);
        } else if (newMode === "cost" && costData) {
            setOriginalResults(costData);
        } else {
            setOriginalResults(null);
        }
    };

    // Handle ratio input change
    const handleRatioChange = (
        productId: number,
        material: string,
        value: string
    ) => {
        const numValue = parseFloat(value) || 0;
        setCustomRatios((prev) =>
            prev.map((product, index) =>
                index === productId
                    ? {
                          ...product,
                          ratios: {
                              ...product.ratios,
                              [material]: numValue / 100, // Convert percentage to decimal for API
                          },
                      }
                    : product
            )
        );
    };

    // Reset to original ratios (from API or fallback to static)
    const resetToOriginal = () => {
        console.log("Resetting to original ratios");

        // Get current data based on compareMode
        const currentData = compareMode === "time" ? timeData : costData;

        if (currentData?.products && Array.isArray(currentData.products)) {
            // Reset to API data
            setCustomRatios((prev) =>
                prev.map((product) => {
                    const apiProduct = currentData.products.find(
                        (p: any) =>
                            p.formula === product.formula ||
                            p.name === product.name
                    );

                    if (apiProduct?.ratios) {
                        return {
                            ...product,
                            customRatios: { ...apiProduct.ratios },
                        };
                    }

                    // Fallback to static original ratios
                    return {
                        ...product,
                        customRatios: { ...product.originalRatios },
                    };
                })
            );
        } else {
            // Fallback to static original ratios
            setCustomRatios((prev) =>
                prev.map((product) => ({
                    ...product,
                    customRatios: { ...product.originalRatios },
                }))
            );
        }
    };

    // Process optimization with custom ratios
    const processOptimization = async () => {
        setIsProcessing(true);
        try {
            // Prepare data for API call
            const optimizationData = {
                mode: compareMode,
                customRatios: customRatios.map((product) => ({
                    formula: product.formula,
                    ratios: product.customRatios,
                    target: product.target,
                })),
            };

            // Call API (replace with your actual endpoint)
            const response = await axios.get(`http://localhost:8000/cost`, {
                params: optimizationData,
            });
            setCustomResults(response.data);

            // Also get original results for comparison
            const originalResponse = await axios.get(
                `http://localhost:8000/${compareMode}`
            );
            setOriginalResults(originalResponse.data);
        } catch (error) {
            console.error("Error processing optimization:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Validate ratios (should sum to 100% excluding eucalyptus)
    const validateRatios = (product: any) => {
        // Handle API format - use ratios object
        const ratios = product.ratios;
        if (!ratios) return false;

        // Convert decimal to percentage and sum
        const sum =
            ((ratios.Pulp_A || 0) +
                (ratios.Pulp_B || 0) +
                (ratios.Pulp_C || 0)) *
            100;
        const isValid = Math.abs(sum - 100) < 0.1; // Allow small tolerance
        return isValid;
    };

    // Get original ratios from API results
    const getOriginalRatios = (product: any) => {
        if (!originalResults?.products) {
            // Fallback to static data if no originalResults
            return {
                Pulp_A: 0,
                Pulp_B: 0,
                Pulp_C: 0,
                Eucalyptus: 0,
            };
        }

        // Find matching product in original results by formula
        const matchingProduct = originalResults.products.find(
            (p: any) => p.formula === product.formula || p.name === product.name
        );

        if (matchingProduct?.ratios) {
            return matchingProduct.ratios; // Return API format directly
        }

        // Fallback
        return {
            Pulp_A: 0,
            Pulp_B: 0,
            Pulp_C: 0,
            Eucalyptus: 0,
        };
    };

    // Process inventory data for both original and custom results
    const processInventoryData = (data: any) => {
        return (
            data?.inventoryData?.map((item: any) => {
                let delivery_pulp_a = 0;
                let delivery_pulp_b = 0;
                let delivery_pulp_c = 0;

                if (item.deliveries && item.deliveries.length > 0) {
                    item.deliveries.forEach((delivery: any) => {
                        switch (delivery.pulp_type) {
                            case "Pulp_A":
                                delivery_pulp_a += delivery.amount || 0;
                                break;
                            case "Pulp_B":
                                delivery_pulp_b += delivery.amount || 0;
                                break;
                            case "Pulp_C":
                                delivery_pulp_c += delivery.amount || 0;
                                break;
                        }
                    });
                }

                return {
                    ...item,
                    delivery_pulp_a,
                    delivery_pulp_b,
                    delivery_pulp_c,
                };
            }) || []
        );
    };

    // Get processed inventory data for both results
    const originalProcessedInventoryData =
        processInventoryData(originalResults);
    const customProcessedInventoryData = processInventoryData(customResults);

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        Custom Ratio Adjustment - ปรับแต่งอัตราส่วนวัตถุดิบ
                    </CardTitle>
                    <CardDescription>
                        ปรับแต่งอัตราส่วนวัตถุดิบของแต่ละผลิตภัณฑ์และเปรียบเทียบผลลัพธ์
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">
                                    เปรียบเทียบกับ:
                                </label>
                                <select
                                    value={compareMode}
                                    onChange={(e) =>
                                        handleCompareModeChange(
                                            e.target.value as "time" | "cost"
                                        )
                                    }
                                    className="w-40 h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="time">
                                        Time Optimization
                                    </option>
                                    <option value="cost">
                                        Cost Optimization
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={resetToOriginal}
                                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset เป็นค่าเริ่มต้น
                            </button>
                            <button
                                onClick={processOptimization}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        กำลังประมวลผล...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4" />
                                        ประมวลผล
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Custom Ratios Input Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Factory className="h-6 w-6" />
                        Adjust Material Ratios - ปรับแต่งอัตราส่วนวัตถุดิบ
                    </CardTitle>
                    <CardDescription>
                        แก้ไขอัตราส่วนวัตถุดิบของแต่ละผลิตภัณฑ์ (Pulp A + Pulp B
                        + Pulp C ต้องรวมเป็น 100%)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center font-semibold">
                                    Product Type
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Product
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Formula
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Pulp A (%)
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Pulp B (%)
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Pulp C (%)
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Eucalyptus (%)
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Target (tons)
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Status
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customRatios.map((product, index) => {
                                const isValid = validateRatios(product);
                                const originalRatios =
                                    getOriginalRatios(product);

                                return (
                                    <React.Fragment key={`product-${index}`}>
                                        {/* Original Values Row */}
                                        <TableRow
                                            key={`${index}-original`}
                                            className="hover:bg-gray-50"
                                            style={{ borderBottom: "none" }}
                                        >
                                            <TableCell
                                                className="text-center font-bold text-purple-600 text-sm"
                                                style={{ borderBottom: "none" }}
                                                rowSpan={2}
                                            >
                                                {product.type}
                                            </TableCell>
                                            <TableCell
                                                className="text-center font-bold text-blue-600 text-sm"
                                                style={{ borderBottom: "none" }}
                                                title={product.name}
                                                rowSpan={2}
                                            >
                                                {product.name?.length > 30
                                                    ? `${product.name.substring(
                                                          0,
                                                          30
                                                      )}...`
                                                    : product.name}
                                            </TableCell>
                                            <TableCell
                                                className="text-center"
                                                style={{ borderBottom: "none" }}
                                                rowSpan={2}
                                            >
                                                <Badge
                                                    variant="outline"
                                                    className="bg-blue-50 text-blue-700 border-blue-200"
                                                >
                                                    {product.formula}
                                                </Badge>
                                            </TableCell>
                                            <TableCell
                                                className="text-center text-gray-600 text-sm bg-gray-50"
                                                style={{ borderBottom: "none" }}
                                            >
                                                {(
                                                    (originalRatios.Pulp_A ||
                                                        0) * 100
                                                )?.toFixed(1) || "N/A"}
                                                %
                                                <div className="text-xs text-gray-500">
                                                    {compareMode === "time"
                                                        ? "Time Opt"
                                                        : "Cost Opt"}
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className="text-center text-gray-600 text-sm bg-gray-50"
                                                style={{ borderBottom: "none" }}
                                            >
                                                {(
                                                    (originalRatios.Pulp_B ||
                                                        0) * 100
                                                )?.toFixed(1) || "N/A"}
                                                %
                                                <div className="text-xs text-gray-500">
                                                    {compareMode === "time"
                                                        ? "Time Opt"
                                                        : "Cost Opt"}
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className="text-center text-gray-600 text-sm bg-gray-50"
                                                style={{ borderBottom: "none" }}
                                            >
                                                {(
                                                    (originalRatios.Pulp_C ||
                                                        0) * 100
                                                )?.toFixed(1) || "N/A"}
                                                %
                                                <div className="text-xs text-gray-500">
                                                    {compareMode === "time"
                                                        ? "Time Opt"
                                                        : "Cost Opt"}
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className="text-center text-gray-600 text-sm bg-gray-50"
                                                style={{ borderBottom: "none" }}
                                            >
                                                {(
                                                    (originalRatios.Eucalyptus ||
                                                        0) * 100
                                                )?.toFixed(1) || "N/A"}
                                                %
                                                <div className="text-xs text-gray-500">
                                                    {compareMode === "time"
                                                        ? "Time Opt"
                                                        : "Cost Opt"}
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className="text-center font-bold text-green-600"
                                                style={{ borderBottom: "none" }}
                                                rowSpan={2}
                                            >
                                                {product.target_quantity.toFixed(
                                                    2
                                                )}
                                            </TableCell>
                                            <TableCell
                                                className="text-center"
                                                style={{ borderBottom: "none" }}
                                                rowSpan={2}
                                            >
                                                {isValid ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-green-50 text-green-700 border-green-200"
                                                    >
                                                        ✓ Valid
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-red-50 text-red-700 border-red-200"
                                                    >
                                                        ✗ Invalid
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>

                                        {/* Input Row */}
                                        <TableRow
                                            key={`${index}-input`}
                                            className="hover:bg-gray-50"
                                        >
                                            <TableCell className="text-center">
                                                <input
                                                    type="number"
                                                    value={(
                                                        (product.ratios
                                                            ?.Pulp_A || 0) * 100
                                                    ).toFixed(1)}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>
                                                    ) =>
                                                        handleRatioChange(
                                                            index,
                                                            "Pulp_A",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-20 text-center px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <input
                                                    type="number"
                                                    value={(
                                                        (product.ratios
                                                            ?.Pulp_B || 0) * 100
                                                    ).toFixed(1)}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>
                                                    ) =>
                                                        handleRatioChange(
                                                            index,
                                                            "Pulp_B",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-20 text-center px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <input
                                                    type="number"
                                                    value={(
                                                        (product.ratios
                                                            ?.Pulp_C || 0) * 100
                                                    ).toFixed(1)}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>
                                                    ) =>
                                                        handleRatioChange(
                                                            index,
                                                            "Pulp_C",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-20 text-center px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <input
                                                    type="number"
                                                    value={(
                                                        (product.ratios
                                                            ?.Eucalyptus || 0) *
                                                        100
                                                    ).toFixed(1)}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>
                                                    ) =>
                                                        handleRatioChange(
                                                            index,
                                                            "Eucalyptus",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-20 text-center px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    step="0.1"
                                                    min="0"
                                                    max="50"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Results Comparison */}
            {originalResults && customResults && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Original Results */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5" />
                                Original{" "}
                                {compareMode === "time" ? "Time" : "Cost"}{" "}
                                Optimization
                            </CardTitle>
                            <CardDescription>ผลลัพธ์แบบเดิม</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-lg font-bold text-blue-600">
                                            {originalResults.summary?.totalDays?.toFixed(
                                                2
                                            ) || 0}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                            วัน
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-lg font-bold text-green-600">
                                            ฿
                                            {originalResults.summary?.avgCostPerTon?.toLocaleString() ||
                                                0}
                                        </div>
                                        <div className="text-xs text-green-600">
                                            ต้นทุน/ตัน
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                        <div className="text-lg font-bold text-purple-600">
                                            {originalResults.summary?.actualProduction?.toFixed(
                                                1
                                            ) || 0}
                                        </div>
                                        <div className="text-xs text-purple-600">
                                            ผลิตจริง (ตัน)
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-lg font-bold text-red-600">
                                            {originalResults.summary?.totalCost?.toFixed(
                                                1
                                            ) || 0}
                                            บาท
                                        </div>
                                        <div className="text-xs text-red-600">
                                            ต้นทุนรวม
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Custom Results */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Custom Optimization Results
                            </CardTitle>
                            <CardDescription>
                                ผลลัพธ์หลังปรับแต่ง
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-lg font-bold text-blue-600">
                                            {customResults.summary?.totalDays?.toFixed(
                                                2
                                            ) || 0}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                            วัน
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-lg font-bold text-green-600">
                                            ฿
                                            {customResults.summary?.avgCostPerTon?.toLocaleString() ||
                                                0}
                                        </div>
                                        <div className="text-xs text-green-600">
                                            ต้นทุน/ตัน
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                        <div className="text-lg font-bold text-purple-600">
                                            {customResults.summary?.actualProduction?.toFixed(
                                                1
                                            ) || 0}
                                        </div>
                                        <div className="text-xs text-purple-600">
                                            ผลิตจริง (ตัน)
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-lg font-bold text-red-600">
                                            {customResults.summary?.totalCost?.toFixed(
                                                1
                                            ) || 0}
                                            บาท
                                        </div>
                                        <div className="text-xs text-red-600">
                                            ต้นทุนรวม
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comparison Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5" />
                                Original Material Inventory Trend
                            </CardTitle>
                            <CardDescription>
                                แนวโน้มการใช้วัตถุดิบ Eucalyptus และ Pulp
                                แต่ละวัน
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart
                                    data={originalProcessedInventoryData}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis yAxisId="left" />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                    />
                                    <Tooltip
                                        formatter={(
                                            value: any,
                                            name: string
                                        ) => {
                                            if (
                                                (name.includes("delivery_") ||
                                                    name.includes("ส่งมอบ")) &&
                                                parseFloat(value) === 0
                                            ) {
                                                return [null, null];
                                            }

                                            let displayName = name;
                                            switch (name) {
                                                case "eucalyptus":
                                                    displayName =
                                                        "Eucalyptus คงเหลือ";
                                                    break;
                                                case "pulp_a":
                                                    displayName =
                                                        "Pulp A คงเหลือ";
                                                    break;
                                                case "pulp_b":
                                                    displayName =
                                                        "Pulp B คงเหลือ";
                                                    break;
                                                case "pulp_c":
                                                    displayName =
                                                        "Pulp C คงเหลือ";
                                                    break;
                                                case "delivery_pulp_a":
                                                    displayName =
                                                        "ส่งมอบ Pulp A";
                                                    break;
                                                case "delivery_pulp_b":
                                                    displayName =
                                                        "ส่งมอบ Pulp B";
                                                    break;
                                                case "delivery_pulp_c":
                                                    displayName =
                                                        "ส่งมอบ Pulp C";
                                                    break;
                                                default:
                                                    displayName = name;
                                            }
                                            return [
                                                `${parseFloat(value).toFixed(
                                                    2
                                                )} ตัน`,
                                                displayName,
                                            ];
                                        }}
                                        labelFormatter={(label) =>
                                            `วันที่ ${label}`
                                        }
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="delivery_pulp_a"
                                        fill="#82ca9d"
                                        name="ส่งมอบ Pulp A"
                                        opacity={0.8}
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="delivery_pulp_b"
                                        fill="#ffc658"
                                        name="ส่งมอบ Pulp B"
                                        opacity={0.8}
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="delivery_pulp_c"
                                        fill="#ff7300"
                                        name="ส่งมอบ Pulp C"
                                        opacity={0.8}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="eucalyptus"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        name="Eucalyptus คงเหลือ"
                                        dot={{
                                            fill: "#8b5cf6",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_a"
                                        stroke="#82ca9d"
                                        strokeWidth={3}
                                        name="Pulp A คงเหลือ"
                                        dot={{
                                            fill: "#82ca9d",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_b"
                                        stroke="#ffc658"
                                        strokeWidth={3}
                                        name="Pulp B คงเหลือ"
                                        dot={{
                                            fill: "#ffc658",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_c"
                                        stroke="#ff7300"
                                        strokeWidth={3}
                                        name="Pulp C คงเหลือ"
                                        dot={{
                                            fill: "#ff7300",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5" />
                                Custom Material Inventory Trend
                            </CardTitle>
                            <CardDescription>
                                แนวโน้มการใช้วัตถุดิบ Eucalyptus และ Pulp
                                แต่ละวัน
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart
                                    data={customProcessedInventoryData}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis yAxisId="left" />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                    />
                                    <Tooltip
                                        formatter={(
                                            value: any,
                                            name: string
                                        ) => {
                                            if (
                                                (name.includes("delivery_") ||
                                                    name.includes("ส่งมอบ")) &&
                                                parseFloat(value) === 0
                                            ) {
                                                return [null, null];
                                            }

                                            let displayName = name;
                                            switch (name) {
                                                case "eucalyptus":
                                                    displayName =
                                                        "Eucalyptus คงเหลือ";
                                                    break;
                                                case "pulp_a":
                                                    displayName =
                                                        "Pulp A คงเหลือ";
                                                    break;
                                                case "pulp_b":
                                                    displayName =
                                                        "Pulp B คงเหลือ";
                                                    break;
                                                case "pulp_c":
                                                    displayName =
                                                        "Pulp C คงเหลือ";
                                                    break;
                                                case "delivery_pulp_a":
                                                    displayName =
                                                        "ส่งมอบ Pulp A";
                                                    break;
                                                case "delivery_pulp_b":
                                                    displayName =
                                                        "ส่งมอบ Pulp B";
                                                    break;
                                                case "delivery_pulp_c":
                                                    displayName =
                                                        "ส่งมอบ Pulp C";
                                                    break;
                                                default:
                                                    displayName = name;
                                            }
                                            return [
                                                `${parseFloat(value).toFixed(
                                                    2
                                                )} ตัน`,
                                                displayName,
                                            ];
                                        }}
                                        labelFormatter={(label) =>
                                            `วันที่ ${label}`
                                        }
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="delivery_pulp_a"
                                        fill="#82ca9d"
                                        name="ส่งมอบ Pulp A"
                                        opacity={0.8}
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="delivery_pulp_b"
                                        fill="#ffc658"
                                        name="ส่งมอบ Pulp B"
                                        opacity={0.8}
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="delivery_pulp_c"
                                        fill="#ff7300"
                                        name="ส่งมอบ Pulp C"
                                        opacity={0.8}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="eucalyptus"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        name="Eucalyptus คงเหลือ"
                                        dot={{
                                            fill: "#8b5cf6",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_a"
                                        stroke="#82ca9d"
                                        strokeWidth={3}
                                        name="Pulp A คงเหลือ"
                                        dot={{
                                            fill: "#82ca9d",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_b"
                                        stroke="#ffc658"
                                        strokeWidth={3}
                                        name="Pulp B คงเหลือ"
                                        dot={{
                                            fill: "#ffc658",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_c"
                                        stroke="#ff7300"
                                        strokeWidth={3}
                                        name="Pulp C คงเหลือ"
                                        dot={{
                                            fill: "#ff7300",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Cost per Ton Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Original Cost per Ton Daily
                            </CardTitle>
                            <CardDescription>
                                ต้นทุนต่อตันรายวัน
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={originalResults.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [
                                            `฿${parseFloat(
                                                value
                                            ).toLocaleString()}`,
                                            "ต้นทุนต่อตัน",
                                        ]}
                                        labelFormatter={(label) =>
                                            `วันที่ ${label}`
                                        }
                                    />
                                    <Bar
                                        dataKey="cost_per_ton"
                                        fill="#8884d8"
                                        name="Cost per Ton"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Custom Cost per Ton Daily
                            </CardTitle>
                            <CardDescription>
                                ต้นทุนต่อตันรายวัน
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={customResults.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [
                                            `฿${parseFloat(
                                                value
                                            ).toLocaleString()}`,
                                            "ต้นทุนต่อตัน",
                                        ]}
                                        labelFormatter={(label) =>
                                            `วันที่ ${label}`
                                        }
                                    />
                                    <Bar
                                        dataKey="cost_per_ton"
                                        fill="#8884d8"
                                        name="Cost per Ton"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Daily Cost Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Original Daily Cost
                            </CardTitle>
                            <CardDescription>ต้นทุนรายวัน</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={originalResults.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [
                                            `฿${parseFloat(
                                                value
                                            ).toLocaleString()}`,
                                            "ต้นทุนรายวัน",
                                        ]}
                                        labelFormatter={(label) =>
                                            `วันที่ ${label}`
                                        }
                                    />
                                    <Bar
                                        dataKey="cost"
                                        fill="#82ca9d"
                                        name="Daily Cost"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Custom Daily Cost
                            </CardTitle>
                            <CardDescription>ต้นทุนรายวัน</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={customResults.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [
                                            `฿${parseFloat(
                                                value
                                            ).toLocaleString()}`,
                                            "ต้นทุนรายวัน",
                                        ]}
                                        labelFormatter={(label) =>
                                            `วันที่ ${label}`
                                        }
                                    />
                                    <Bar
                                        dataKey="cost"
                                        fill="#82ca9d"
                                        name="Daily Cost"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Production Quantity Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Daily Production Quantity
                            </CardTitle>
                            <CardDescription>
                                ปริมาณการผลิตรายวัน
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={originalResults.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [
                                            `${parseFloat(value).toFixed(
                                                2
                                            )} ตัน`,
                                            "ปริมาณการผลิต",
                                        ]}
                                        labelFormatter={(label) =>
                                            `วันที่ ${label}`
                                        }
                                    />
                                    <Bar
                                        dataKey="production_quantity"
                                        fill="#ffc658"
                                        name="Production Quantity"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Daily Production Quantity
                            </CardTitle>
                            <CardDescription>
                                ปริมาณการผลิตรายวัน
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={customResults.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [
                                            `${parseFloat(value).toFixed(
                                                2
                                            )} ตัน`,
                                            "ปริมาณการผลิต",
                                        ]}
                                        labelFormatter={(label) =>
                                            `วันที่ ${label}`
                                        }
                                    />
                                    <Bar
                                        dataKey="production_quantity"
                                        fill="#ffc658"
                                        name="Production Quantity"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Improvement Summary */}
            {originalResults && customResults && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowRight className="h-5 w-5" />
                            Improvement Summary - สรุปการปรับปรุง
                        </CardTitle>
                        <CardDescription>
                            เปรียบเทียบผลลัพธ์ก่อนและหลังการปรับแต่ง
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Days Improvement */}
                            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {(
                                        originalResults.summary?.totalDays -
                                            customResults.summary?.totalDays ||
                                        0
                                    ).toFixed(2)}
                                </div>
                                <div className="text-sm text-blue-600">
                                    วันที่ลดลง
                                </div>
                                <div className="text-xs text-gray-500">
                                    (
                                    {(
                                        ((originalResults.summary?.totalDays -
                                            customResults.summary?.totalDays) /
                                            originalResults.summary
                                                ?.totalDays) *
                                            100 || 0
                                    ).toFixed(1)}
                                    %)
                                </div>
                            </div>

                            {/* Cost Improvement */}
                            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    ฿
                                    {(
                                        originalResults.summary?.avgCostPerTon -
                                            customResults.summary
                                                ?.avgCostPerTon || 0
                                    ).toLocaleString()}
                                </div>
                                <div className="text-sm text-green-600">
                                    ต้นทุนที่ประหยัด/ตัน
                                </div>
                                <div className="text-xs text-gray-500">
                                    (
                                    {(
                                        ((originalResults.summary
                                            ?.avgCostPerTon -
                                            customResults.summary
                                                ?.avgCostPerTon) /
                                            originalResults.summary
                                                ?.avgCostPerTon) *
                                            100 || 0
                                    ).toFixed(1)}
                                    %)
                                </div>
                            </div>

                            {/* Production Improvement */}
                            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    +
                                    {(
                                        customResults.summary
                                            ?.actualProduction -
                                            originalResults.summary
                                                ?.actualProduction || 0
                                    ).toFixed(1)}
                                </div>
                                <div className="text-sm text-purple-600">
                                    ผลผลิตที่เพิ่มขึ้น (ตัน)
                                </div>
                                <div className="text-xs text-gray-500">
                                    (
                                    {(
                                        ((customResults.summary
                                            ?.actualProduction -
                                            originalResults.summary
                                                ?.actualProduction) /
                                            originalResults.summary
                                                ?.actualProduction) *
                                            100 || 0
                                    ).toFixed(1)}
                                    %)
                                </div>
                            </div>

                            {/* Success Rate Improvement */}
                            <div className="text-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">
                                    {(
                                        customResults.summary?.totalCost -
                                            originalResults.summary
                                                ?.totalCost || 0
                                    ).toFixed(1)}
                                    บาท
                                </div>
                                <div className="text-sm text-red-600">
                                    ต้นทุนรวมที่เพิ่มขึ้น
                                </div>
                                <div className="text-xs text-gray-500">
                                    จาก{" "}
                                    {originalResults.summary?.totalCost?.toFixed(
                                        1
                                    )}
                                    % เป็น{" "}
                                    {customResults.summary?.totalCost?.toFixed(
                                        1
                                    )}
                                    %
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
