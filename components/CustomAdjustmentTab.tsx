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
    DollarSign,
    Package,
    TrendingDown,
    Factory,
    Settings,
    Play,
    ArrowRight,
} from "lucide-react";
import axios from "axios";
import { apiEndpoints } from "@/lib/api";
import { 
    OptimizationData, 
    Product,
    safeCalculation,
    safePercentageChange,
    getSafeSummaryValue,
    FormulaData,
    InventoryItem,
    Delivery
} from "@/lib/types";
interface CustomAdjustmentTabProps {
    onRefresh: () => void;
    loading: boolean;
}

export default function CustomAdjustmentTab({
    onRefresh,
}: CustomAdjustmentTabProps) {
    const [customRatios, setCustomRatios] = useState<Product[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalResults, setOriginalResults] = useState<OptimizationData | null>(null);
    const [customResults, setCustomResults] = useState<OptimizationData | null>(null);
    const [newScenarioName, setNewScenarioName] = useState<string>("");

    // Scenario states
    const [scenarios, setScenarios] = useState<string[]>([]);
    const [selectedScenario, setSelectedScenario] = useState<string>("");
    const [loadingScenarios, setLoadingScenarios] = useState(false);

    // Formula states
    const [formulaData, setFormulaData] = useState<FormulaData>({});
    const [loadingFormulas, setLoadingFormulas] = useState(false);

    // Create percentage options for dropdowns
    const createPercentageOptions = (max: number) => {
        const options = [];
        for (let i = 0; i <= max; i += 5) {
            options.push(i);
        }
        return options;
    };

    // Create options for each pulp type
    const pulpAOptions = createPercentageOptions(100); // 0-100
    const pulpBOptions = createPercentageOptions(50);  // 0-50
    const pulpCOptions = createPercentageOptions(75);  // 0-75

    // Fetch scenarios from API
    const fetchScenarios = async () => {
        setLoadingScenarios(true);
        try {
            const response = await axios.get(apiEndpoints.getScenarios());
            if (response.data && Array.isArray(response.data)) {
                setScenarios(response.data);
                // Let user manually select scenario
            }
        } catch (error) {
            console.error('Error fetching scenarios:', error);
            setScenarios([]);
        } finally {
            setLoadingScenarios(false);
        }
    };

    // Fetch formula data from API
    const fetchFormulaData = async () => {
        setLoadingFormulas(true);
        try {
            const response = await axios.get(apiEndpoints.getFormula());
            if (response.data?.success && response.data?.data) {
                setFormulaData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching formula data:', error);
            setFormulaData({});
        } finally {
            setLoadingFormulas(false);
        }
    };

    // Load scenarios on component mount
    useEffect(() => {
        fetchScenarios();
        fetchFormulaData();
    }, []);

    // Fetch scenario data from API
    const fetchScenarioData = async (scenarioName: string) => {
        if (!scenarioName) return;
        
        try {
            const response = await axios.get(apiEndpoints.getScenario(scenarioName));
            console.log('Full API Response:', response.data);
            console.log('Products in response:', response.data?.products);
            setOriginalResults(response.data);
            setCustomRatios(response.data.products);
        } catch (error) {
            console.error("Error fetching scenario data:", error);
            setOriginalResults(null);
        }
    };

    // Auto load scenario data when selected scenario changes
    useEffect(() => {
        if (selectedScenario) {
            fetchScenarioData(selectedScenario);
        }
    }, [selectedScenario]);

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

    // Handle formula change
    const handleFormulaChange = (productId: number, newFormula: string) => {
        setCustomRatios((prev) =>
            prev.map((product, index) =>
                index === productId
                    ? {
                          ...product,
                          formula: newFormula,
                      }
                    : product
            )
        );
    };

    // Process optimization with custom ratios
    const processOptimization = async () => {
        if (!newScenarioName.trim()) {
            alert("กรุณาใส่ชื่อ Scenario ใหม่");
            return;
        }

        // ตรวจสอบว่าทุก product มี status เป็น valid
        const hasInvalidRatios = customRatios.some(product => !validateRatios(product));
        
        if (hasInvalidRatios) {
            // สร้างรายการ products ที่ไม่ valid
            const invalidProducts = customRatios.filter(product => !validateRatios(product));
            const invalidList = invalidProducts.map(product => {
                const sum = ((product.ratios?.Pulp_A || 0) + (product.ratios?.Pulp_B || 0) + (product.ratios?.Pulp_C || 0)) * 100;
                return `- ${product.name}: ${sum.toFixed(1)}% (ต้องเป็น 100%)`;
            }).join('\n');
            
            alert(`❌ ไม่สามารถประมวลผลได้ เนื่องจากมีผลิตภัณฑ์ที่อัตราส่วน Pulp A + B + C ไม่เท่ากับ 100%\n\nรายการที่ต้องแก้ไข:\n${invalidList}\n\nกรุณาแก้ไขอัตราส่วนให้ถูกต้องก่อนประมวลผล`);
            return;
        }

        setIsProcessing(true);
        try {
            // Prepare data for API call with custom structure
            const settings: { [key: string]: { formula: string; pulp_ratios: { Pulp_A: number; Pulp_B: number; Pulp_C: number; Eucalyptus: number } } } = {};
            
            customRatios.forEach((product) => {
                // สร้าง key ที่รวม brand|product_group|thickness|channel หรือใช้แค่ product_group|name สำหรับ backward compatibility
                const productKey = product.brand && product.thickness && product.channel 
                    ? `${product.brand}|${product.product_group}|${product.thickness}|${product.channel}`
                    : `${product.product_group}|${product.name}`;
                
                settings[productKey] = {
                    formula: product.formula,
                    pulp_ratios: {
                        Pulp_A: product.ratios?.Pulp_A || 0,
                        Pulp_B: product.ratios?.Pulp_B || 0,
                        Pulp_C: product.ratios?.Pulp_C || 0,
                        Eucalyptus: product.ratios?.Eucalyptus || 0
                    }
                };
            });

            const optimizationData = {
                settings: settings,
                scenario_name: newScenarioName.trim(),
                description: `Custom adjustment from ${selectedScenario}`
            };

            // Call the evaluate_custom_individual API endpoint
            const response = await axios.post(apiEndpoints.evaluateCustomIndividual(), optimizationData);
            
            if (response.data.success) {
                setCustomResults(response.data.json_result);
                // รีเฟรช scenarios list
                await fetchScenarios();
                // alert(`✅ สร้าง Scenario "${newScenarioName}" สำเร็จ!`);
                // เคลียร์ชื่อ scenario
                setNewScenarioName("");
                onRefresh();
            } else {
                alert(`❌ เกิดข้อผิดพลาด: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Error processing optimization:", error);
            alert("เกิดข้อผิดพลาดในการประมวลผล");
        } finally {
            setIsProcessing(false);
        }
    };

    // Validate ratios (should sum to 100% excluding eucalyptus)
    const validateRatios = (product: Product) => {
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
    const getOriginalRatios = (product: Product) => {
        if (!originalResults?.products) {
            // Fallback to static data if no originalResults
            return {
                Pulp_A: 0,
                Pulp_B: 0,
                Pulp_C: 0,
                Eucalyptus: 0,
            };
        }

        // Find matching product in original results by name (not formula, since formula can change)
        const matchingProduct = originalResults.products.find(
            (p: Product) => p.name === product.name
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

    // Get original formula from API results
    const getOriginalFormula = (product: Product) => {
        if (!originalResults?.products) {
            return product.formula; // Fallback to current formula
        }

        // Find matching product in original results by name
        const matchingProduct = originalResults.products.find(
            (p: Product) => p.name === product.name
        );

        return matchingProduct?.formula || product.formula;
    };

    // Process inventory data for both original and custom results
    const processInventoryData = (data: OptimizationData | null) => {
        return (
            data?.inventoryData?.map((item: InventoryItem) => {
                let delivery_pulp_a = 0;
                let delivery_pulp_b = 0;
                let delivery_pulp_c = 0;

                if (item.deliveries && item.deliveries.length > 0) {
                    item.deliveries.forEach((delivery: Delivery) => {
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
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium">
                                เลือก Scenario:
                            </label>
                            <select
                                value={selectedScenario}
                                onChange={(e) => setSelectedScenario(e.target.value)}
                                disabled={loadingScenarios}
                                className="max-w-[30%] h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {loadingScenarios ? "กำลังโหลด..." : "-- เลือก Scenario --"}
                                </option>
                                {scenarios.map((scenario, index) => (
                                    <option key={`custom-scenario-${index}-${scenario}`} value={scenario}>
                                        {scenario}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Row 2: New Scenario Name and Process Button */}
                        {selectedScenario && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium">
                                        ชื่อ Scenario ใหม่:
                                    </label>
                                    <input
                                        type="text"
                                        value={newScenarioName}
                                        onChange={(e) => setNewScenarioName(e.target.value)}
                                        placeholder="ใส่ชื่อ scenario ใหม่..."
                                        className="w-64 h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isProcessing}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={processOptimization}
                                        disabled={isProcessing || !newScenarioName.trim()}
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
                                                ประมวลผลและบันทึก
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Show message when no scenario is selected */}
            {!selectedScenario && !loadingScenarios && (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">เลือก Scenario เพื่อดูข้อมูล</h3>
                            <p className="text-gray-600">กรุณาเลือก scenario จาก dropdown ด้านบนเพื่อแสดงข้อมูลการวิเคราะห์</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Custom Ratios Input Table - Only show when scenario is selected */}
            {selectedScenario && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Factory className="h-6 w-6" />
                            Adjust Material Ratios - ปรับแต่งอัตราส่วนวัตถุดิบ
                        </CardTitle>
                        <CardDescription>
                            แก้ไขสูตรและอัตราส่วนวัตถุดิบของแต่ละผลิตภัณฑ์ (Pulp A + Pulp B + Pulp C ต้องรวมเป็น 100%)
                            <br />
                            <strong>แถวที่ 1:</strong> ค่าเดิมจาก scenario ที่เลือก | <strong>แถวที่ 2:</strong> ปรับแต่งสูตรและอัตราส่วน
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center font-semibold">
                                    Brand
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Product Type
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Thickness
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Channel
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
                                                className="text-center font-bold text-blue-600 text-sm"
                                                style={{ borderBottom: "none" }}
                                                rowSpan={2}
                                            >
                                                {product.brand}
                                            </TableCell>
                                            <TableCell
                                                className="text-center font-bold text-purple-600 text-sm"
                                                style={{ borderBottom: "none" }}
                                                rowSpan={2}
                                            >
                                                {product.product_group}
                                            </TableCell>
                                            <TableCell
                                                className="text-center font-semibold text-sm"
                                                style={{ borderBottom: "none" }}
                                                rowSpan={2}
                                            >
                                                {product.thickness}
                                            </TableCell>
                                            <TableCell
                                                className="text-center font-semibold text-sm"
                                                style={{ borderBottom: "none" }}
                                                rowSpan={2}
                                            >
                                                {product.channel}
                                            </TableCell>
                                            <TableCell
                                                className="text-center"
                                                style={{ borderBottom: "none" }}
                                            >
                                                <Badge
                                                    variant="outline"
                                                    className="bg-blue-50 text-blue-700 border-blue-200"
                                                >
                                                    {getOriginalFormula(product)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell
                                                className="text-center text-gray-600 text-sm"
                                                style={{ borderBottom: "none" }}
                                            >
                                                {(
                                                    (originalRatios.Pulp_A ||
                                                        0) * 100
                                                )?.toFixed(1) || "N/A"}
                                                %
                                            </TableCell>
                                            <TableCell
                                                className="text-center text-gray-600 text-sm"
                                                style={{ borderBottom: "none" }}
                                            >
                                                {(
                                                    (originalRatios.Pulp_B ||
                                                        0) * 100
                                                )?.toFixed(1) || "N/A"}
                                                %
                                            </TableCell>
                                            <TableCell
                                                className="text-center text-gray-600 text-sm"
                                                style={{ borderBottom: "none" }}
                                            >
                                                {(
                                                    (originalRatios.Pulp_C ||
                                                        0) * 100
                                                )?.toFixed(1) || "N/A"}
                                                %
                                            </TableCell>
                                            <TableCell
                                                className="text-center text-gray-600 text-sm"
                                                style={{ borderBottom: "none" }}
                                                rowSpan={2}
                                            >
                                                {(
                                                    (originalRatios.Eucalyptus ||
                                                        0) * 100
                                                )?.toFixed(1) || "N/A"}
                                                %
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

                                        {/* Custom Input Row */}
                                        <TableRow
                                            key={`${index}-input`}
                                            className="hover:bg-gray-50"
                                        >
                                            <TableCell className="text-center">
                                                <select
                                                    value={product.formula}
                                                    onChange={(e) => handleFormulaChange(index, e.target.value)}
                                                    disabled={loadingFormulas}
                                                    className="w-24 h-8 text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {product.brand && formulaData[product.brand] && formulaData[product.brand][product.product_group+"|"+product.thickness+"|"+product.channel] ? 
                                                        formulaData[product.brand][product.product_group+"|"+product.thickness+"|"+product.channel].map((formula: string, formulaIndex: number) => (
                                                            <option key={`${index}|${formulaIndex}-${formula}`} value={formula}>
                                                                {formula}
                                                            </option>
                                                        )) : (
                                                            <option value="no-data" disabled>
                                                                ไม่มีข้อมูล
                                                            </option>
                                                        )
                                                    }
                                                </select>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <select
                                                    value={((product.ratios?.Pulp_A || 0) * 100).toString()}
                                                    onChange={(e) => handleRatioChange(index, "Pulp_A", e.target.value)}
                                                    className="w-20 h-8 text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    {pulpAOptions.map((option) => (
                                                        <option key={`pulp-a-${index}-${option}`} value={option.toString()}>
                                                            {option}%
                                                        </option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <select
                                                    value={((product.ratios?.Pulp_B || 0) * 100).toString()}
                                                    onChange={(e) => handleRatioChange(index, "Pulp_B", e.target.value)}
                                                    className="w-20 h-8 text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    {pulpBOptions.map((option) => (
                                                        <option key={`pulp-b-${index}-${option}`} value={option.toString()}>
                                                            {option}%
                                                        </option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <select
                                                    value={((product.ratios?.Pulp_C || 0) * 100).toString()}
                                                    onChange={(e) => handleRatioChange(index, "Pulp_C", e.target.value)}
                                                    className="w-20 h-8 text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    {pulpCOptions.map((option) => (
                                                        <option key={`pulp-c-${index}-${option}`} value={option.toString()}>
                                                            {option}%
                                                        </option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            )}

            {/* Results Comparison */}
            {originalResults && customResults && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Original Results */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5" />
                                Original Optimization
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
                                            ) || 0} วัน
                                        </div>
                                        <div className="text-xs text-blue-600">
                                            จาก {originalResults.summary?.maxPossibleDays?.toFixed(0) || 0} วัน
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
                                            ผลิตจริง (ตัน) จาก {originalResults.summary?.targetProduction?.toFixed(1) || 0} ตัน
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
                                            ) || 0} วัน
                                        </div>
                                        <div className="text-xs text-blue-600">
                                            จาก {customResults.summary?.maxPossibleDays?.toFixed(0) || 0} วัน
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
                                            ผลิตจริง (ตัน) จาก {customResults.summary?.targetProduction?.toFixed(1) || 0} ตัน
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
                                            value: number | string,
                                            name: string
                                        ) => {
                                            if (
                                                (name.includes("delivery_") ||
                                                    name.includes("ส่งมอบ")) &&
                                                parseFloat(String(value)) === 0
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
                                                `${parseFloat(String(value)).toFixed(
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
                                            value: number | string,
                                            name: string
                                        ) => {
                                            if (
                                                (name.includes("delivery_") ||
                                                    name.includes("ส่งมอบ")) &&
                                                parseFloat(String(value)) === 0
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
                                                `${parseFloat(String(value)).toFixed(
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
                                        formatter={(value: number | string) => [
                                            `฿${parseFloat(
                                                String(value)
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
                                        formatter={(value: number | string) => [
                                            `฿${parseFloat(
                                                String(value)
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
                                        formatter={(value: number | string) => [
                                            `฿${parseFloat(
                                                String(value)
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
                                        formatter={(value: number | string) => [
                                            `฿${parseFloat(
                                                String(value)
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
                                        formatter={(value: number | string) => [
                                            `${parseFloat(String(value)).toFixed(
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
                                        formatter={(value: number | string) => [
                                            `${parseFloat(String(value)).toFixed(
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
                                    {safeCalculation(
                                        originalResults.summary?.totalDays,
                                        customResults.summary?.totalDays,
                                        'subtract'
                                    ).toFixed(2)}
                                </div>
                                <div className="text-sm text-blue-600">
                                    วันที่ลดลง
                                </div>
                                <div className="text-xs text-gray-500">
                                    ({safePercentageChange(
                                        originalResults.summary?.totalDays,
                                        customResults.summary?.totalDays
                                    ).toFixed(1)}%)
                                </div>
                            </div>

                            {/* Cost Improvement */}
                            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    ฿{safeCalculation(
                                        getSafeSummaryValue(originalResults, 'avgCostPerTon'),
                                        getSafeSummaryValue(customResults, 'avgCostPerTon'),
                                        'subtract'
                                    ).toLocaleString()}
                                </div>
                                <div className="text-sm text-green-600">
                                    ต้นทุนที่ประหยัด/ตัน
                                </div>
                                <div className="text-xs text-gray-500">
                                    ({safePercentageChange(
                                        getSafeSummaryValue(originalResults, 'avgCostPerTon'),
                                        getSafeSummaryValue(customResults, 'avgCostPerTon')
                                    ).toFixed(1)}%)
                                </div>
                            </div>

                            {/* Production Improvement */}
                            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    +{safeCalculation(
                                        getSafeSummaryValue(customResults, 'actualProduction'),
                                        getSafeSummaryValue(originalResults, 'actualProduction'),
                                        'subtract'
                                    ).toFixed(1)}
                                </div>
                                <div className="text-sm text-purple-600">
                                    ผลผลิตที่เพิ่มขึ้น (ตัน)
                                </div>
                                <div className="text-xs text-gray-500">
                                    ({safePercentageChange(
                                        getSafeSummaryValue(originalResults, 'actualProduction'),
                                        getSafeSummaryValue(customResults, 'actualProduction')
                                    ).toFixed(1)}%)
                                </div>
                            </div>

                            {/* Success Rate Improvement */}
                            <div className="text-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">
                                    {safeCalculation(
                                        getSafeSummaryValue(customResults, 'totalCost'),
                                        getSafeSummaryValue(originalResults, 'totalCost'),
                                        'subtract'
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
