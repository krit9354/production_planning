"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    ArrowRight,
    Play
} from "lucide-react";

interface ScenarioCompareTabProps {
    onRefresh: () => void;
    loading: boolean;
}

export default function ScenarioCompareTab({
    onRefresh,
    loading,
}: ScenarioCompareTabProps) {
    const [selectedScenario1, setSelectedScenario1] = useState<string>("");
    const [selectedScenario2, setSelectedScenario2] = useState<string>("");
    const [scenario1Data, setScenario1Data] = useState<any>(null);
    const [scenario2Data, setScenario2Data] = useState<any>(null);
    const [comparing, setComparing] = useState<boolean>(false);
    
    // API states
    const [scenarios, setScenarios] = useState<string[]>([]);
    const [loadingScenarios, setLoadingScenarios] = useState(false);

    // Fetch scenarios from API
    const fetchScenarios = async () => {
        setLoadingScenarios(true);
        try {
            const response = await axios.get('http://localhost:8000/get_scenarios');
            if (response.data && Array.isArray(response.data)) {
                setScenarios(response.data);
            }
        } catch (error) {
            console.error('Error fetching scenarios:', error);
            setScenarios([]);
        } finally {
            setLoadingScenarios(false);
        }
    };

    // Load scenarios on component mount
    useEffect(() => {
        fetchScenarios();
    }, []);

    // Fetch scenario data from API
    const fetchScenarioData = async (scenarioName: string) => {
        if (!scenarioName) return null;
        
        try {
            const response = await axios.get(`http://localhost:8000/get_scenario/${scenarioName}`);
            console.log('Scenario API Response for', scenarioName, ':', response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching scenario data:", error);
            return null;
        }
    };

    // Generate comparison when scenarios change
    const handleCompare = async () => {
        if (!selectedScenario1 || !selectedScenario2 || selectedScenario1 === selectedScenario2) {
            return;
        }

        setComparing(true);
        try {
            // Fetch both scenarios from API
            const [data1, data2] = await Promise.all([
                fetchScenarioData(selectedScenario1),
                fetchScenarioData(selectedScenario2)
            ]);

            setScenario1Data(data1);
            setScenario2Data(data2);
        } catch (error) {
            console.error('Error comparing scenarios:', error);
        } finally {
            setComparing(false);
        }
    };

    // Process inventory data
    const processInventoryData = (data: any) => {
        return data?.inventoryData?.map((item: any) => {
            let delivery_pulp_a = 0;
            let delivery_pulp_b = 0;
            let delivery_pulp_c = 0;

            if (item.deliveries && item.deliveries.length > 0) {
                item.deliveries.forEach((delivery: any) => {
                    switch (delivery.pulp_type) {
                        case 'Pulp_A':
                            delivery_pulp_a += delivery.amount || 0;
                            break;
                        case 'Pulp_B':
                            delivery_pulp_b += delivery.amount || 0;
                            break;
                        case 'Pulp_C':
                            delivery_pulp_c += delivery.amount || 0;
                            break;
                    }
                });
            }

            return {
                ...item,
                delivery_pulp_a,
                delivery_pulp_b,
                delivery_pulp_c
            };
        }) || [];
    };

    const scenario1ProcessedInventoryData = processInventoryData(scenario1Data);
    const scenario2ProcessedInventoryData = processInventoryData(scenario2Data);

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Factory className="h-6 w-6" />
                        Scenario Comparison - เปรียบเทียบสถานการณ์
                    </CardTitle>
                    <CardDescription>
                        เลือก 2 สถานการณ์เพื่อเปรียบเทียบผลลัพธ์การปรับปรุงประสิทธิภาพ
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                        {/* Scenario 1 Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Scenario 1
                            </label>
                            <Select
                                value={selectedScenario1}
                                onValueChange={setSelectedScenario1}
                                disabled={loadingScenarios}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="-- เลือก Scenario 1 --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {scenarios.map((scenario, index) => (
                                        <SelectItem key={`scenario1-${index}-${scenario}`} value={scenario}>
                                            {scenario}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Scenario 2 Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Scenario 2
                            </label>
                            <Select
                                value={selectedScenario2}
                                onValueChange={setSelectedScenario2}
                                disabled={loadingScenarios}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="-- เลือก Scenario 2 --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {scenarios.map((scenario, index) => (
                                        <SelectItem key={`scenario2-${index}-${scenario}`} value={scenario}>
                                            {scenario}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Compare Button */}
                        <div className="space-y-2">
                            {selectedScenario1 === selectedScenario2 && selectedScenario1 && (
                                <p className="text-sm text-red-500 mt-1">
                                    กรุณาเลือก scenario ที่ต่างกัน
                                </p>
                            )}
                            <Button
                                onClick={handleCompare}
                                disabled={comparing || !selectedScenario1 || !selectedScenario2 || selectedScenario1 === selectedScenario2}
                                className="w-full flex items-center gap-2"
                            >
                                <Play className="h-4 w-4" />
                                {comparing ? 'กำลังเปรียบเทียบ...' : 'เปรียบเทียบ'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Comparison */}
            {scenario1Data && scenario2Data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Scenario 1 Results */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5" />
                                {selectedScenario1}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-lg font-bold text-blue-600">
                                            {scenario1Data.summary?.totalDays?.toFixed(2) || 0}
                                        </div>
                                        <div className="text-xs text-blue-600">วัน</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-lg font-bold text-green-600">
                                            ฿{scenario1Data.summary?.avgCostPerTon?.toLocaleString() || 0}
                                        </div>
                                        <div className="text-xs text-green-600">ต้นทุน/ตัน</div>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                        <div className="text-lg font-bold text-purple-600">
                                            {scenario1Data.summary?.actualProduction?.toFixed(1) || 0}
                                        </div>
                                        <div className="text-xs text-purple-600">ผลิตจริง (ตัน)</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-lg font-bold text-red-600">
                                            ฿{scenario1Data.summary?.totalCost?.toLocaleString() || 0}
                                        </div>
                                        <div className="text-xs text-red-600">ต้นทุนรวม</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Scenario 2 Results */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                {selectedScenario2}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-lg font-bold text-blue-600">
                                            {scenario2Data.summary?.totalDays?.toFixed(2) || 0}
                                        </div>
                                        <div className="text-xs text-blue-600">วัน</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-lg font-bold text-green-600">
                                            ฿{scenario2Data.summary?.avgCostPerTon?.toLocaleString() || 0}
                                        </div>
                                        <div className="text-xs text-green-600">ต้นทุน/ตัน</div>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                        <div className="text-lg font-bold text-purple-600">
                                            {scenario2Data.summary?.actualProduction?.toFixed(1) || 0}
                                        </div>
                                        <div className="text-xs text-purple-600">ผลิตจริง (ตัน)</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-lg font-bold text-red-600">
                                            ฿{scenario2Data.summary?.totalCost?.toLocaleString() || 0}
                                        </div>
                                        <div className="text-xs text-red-600">ต้นทุนรวม</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Material Inventory Charts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5" />
                                {selectedScenario1} - Material Inventory Trend
                            </CardTitle>
                            <CardDescription>
                                แนวโน้มการใช้วัตถุดิบ Eucalyptus และ Pulp แต่ละวัน
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={scenario1ProcessedInventoryData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip
                                        formatter={(value: any, name: string) => {
                                            let displayName = name;
                                            switch (name) {
                                                case "eucalyptus": displayName = "Eucalyptus คงเหลือ"; break;
                                                case "pulp_a": displayName = "Pulp A คงเหลือ"; break;
                                                case "pulp_b": displayName = "Pulp B คงเหลือ"; break;
                                                case "pulp_c": displayName = "Pulp C คงเหลือ"; break;
                                                default: displayName = name;
                                            }
                                            return [`${parseFloat(value).toFixed(2)} ตัน`, displayName];
                                        }}
                                        labelFormatter={(label) => `วันที่ ${label}`}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="eucalyptus"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        name="Eucalyptus คงเหลือ"
                                        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_a"
                                        stroke="#82ca9d"
                                        strokeWidth={3}
                                        name="Pulp A คงเหลือ"
                                        dot={{ fill: "#82ca9d", strokeWidth: 2, r: 4 }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_b"
                                        stroke="#ffc658"
                                        strokeWidth={3}
                                        name="Pulp B คงเหลือ"
                                        dot={{ fill: "#ffc658", strokeWidth: 2, r: 4 }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_c"
                                        stroke="#ff7300"
                                        strokeWidth={3}
                                        name="Pulp C คงเหลือ"
                                        dot={{ fill: "#ff7300", strokeWidth: 2, r: 4 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5" />
                                {selectedScenario2} - Material Inventory Trend
                            </CardTitle>
                            <CardDescription>
                                แนวโน้มการใช้วัตถุดิบ Eucalyptus และ Pulp แต่ละวัน
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={scenario2ProcessedInventoryData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip
                                        formatter={(value: any, name: string) => {
                                            let displayName = name;
                                            switch (name) {
                                                case "eucalyptus": displayName = "Eucalyptus คงเหลือ"; break;
                                                case "pulp_a": displayName = "Pulp A คงเหลือ"; break;
                                                case "pulp_b": displayName = "Pulp B คงเหลือ"; break;
                                                case "pulp_c": displayName = "Pulp C คงเหลือ"; break;
                                                default: displayName = name;
                                            }
                                            return [`${parseFloat(value).toFixed(2)} ตัน`, displayName];
                                        }}
                                        labelFormatter={(label) => `วันที่ ${label}`}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="eucalyptus"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        name="Eucalyptus คงเหลือ"
                                        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_a"
                                        stroke="#82ca9d"
                                        strokeWidth={3}
                                        name="Pulp A คงเหลือ"
                                        dot={{ fill: "#82ca9d", strokeWidth: 2, r: 4 }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_b"
                                        stroke="#ffc658"
                                        strokeWidth={3}
                                        name="Pulp B คงเหลือ"
                                        dot={{ fill: "#ffc658", strokeWidth: 2, r: 4 }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="pulp_c"
                                        stroke="#ff7300"
                                        strokeWidth={3}
                                        name="Pulp C คงเหลือ"
                                        dot={{ fill: "#ff7300", strokeWidth: 2, r: 4 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Cost per Ton Charts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                {selectedScenario1} - Cost per Ton Daily
                            </CardTitle>
                            <CardDescription>ต้นทุนต่อตันรายวัน</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={scenario1Data.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [`฿${parseFloat(value).toLocaleString()}`, "ต้นทุนต่อตัน"]}
                                        labelFormatter={(label) => `วันที่ ${label}`}
                                    />
                                    <Bar dataKey="cost_per_ton" fill="#8884d8" name="Cost per Ton" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                {selectedScenario2} - Cost per Ton Daily
                            </CardTitle>
                            <CardDescription>ต้นทุนต่อตันรายวัน</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={scenario2Data.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [`฿${parseFloat(value).toLocaleString()}`, "ต้นทุนต่อตัน"]}
                                        labelFormatter={(label) => `วันที่ ${label}`}
                                    />
                                    <Bar dataKey="cost_per_ton" fill="#8884d8" name="Cost per Ton" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Daily Cost Charts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                {selectedScenario1} - Daily Cost
                            </CardTitle>
                            <CardDescription>ต้นทุนรายวัน</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={scenario1Data.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [`฿${parseFloat(value).toLocaleString()}`, "ต้นทุนรายวัน"]}
                                        labelFormatter={(label) => `วันที่ ${label}`}
                                    />
                                    <Bar dataKey="cost" fill="#82ca9d" name="Daily Cost" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                {selectedScenario2} - Daily Cost
                            </CardTitle>
                            <CardDescription>ต้นทุนรายวัน</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={scenario2Data.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [`฿${parseFloat(value).toLocaleString()}`, "ต้นทุนรายวัน"]}
                                        labelFormatter={(label) => `วันที่ ${label}`}
                                    />
                                    <Bar dataKey="cost" fill="#82ca9d" name="Daily Cost" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Production Quantity Charts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {selectedScenario1} - Daily Production Quantity
                            </CardTitle>
                            <CardDescription>ปริมาณการผลิตรายวัน</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={scenario1Data.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [`${parseFloat(value).toFixed(2)} ตัน`, "ปริมาณการผลิต"]}
                                        labelFormatter={(label) => `วันที่ ${label}`}
                                    />
                                    <Bar dataKey="production_quantity" fill="#ffc658" name="Production Quantity" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {selectedScenario2} - Daily Production Quantity
                            </CardTitle>
                            <CardDescription>ปริมาณการผลิตรายวัน</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={scenario2Data.dataPerDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => [`${parseFloat(value).toFixed(2)} ตัน`, "ปริมาณการผลิต"]}
                                        labelFormatter={(label) => `วันที่ ${label}`}
                                    />
                                    <Bar dataKey="production_quantity" fill="#ffc658" name="Production Quantity" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Comparison Summary */}
            {scenario1Data && scenario2Data && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowRight className="h-5 w-5" />
                            Comparison Summary - สรุปการเปรียบเทียบ
                        </CardTitle>
                        <CardDescription>
                            เปรียบเทียบผลลัพธ์ระหว่าง {selectedScenario1} และ {selectedScenario2}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Days Comparison */}
                            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {(scenario1Data.summary?.totalDays - scenario2Data.summary?.totalDays).toFixed(2)}
                                </div>
                                <div className="text-sm text-blue-600">วันที่แตกต่าง</div>
                                <div className="text-xs text-gray-500">
                                    ({scenario1Data.summary?.totalDays > scenario2Data.summary?.totalDays ? 'S1 > S2' : 'S2 > S1'})
                                </div>
                            </div>

                            {/* Cost per Ton Comparison */}
                            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    ฿{Math.abs(scenario1Data.summary?.avgCostPerTon - scenario2Data.summary?.avgCostPerTon).toLocaleString()}
                                </div>
                                <div className="text-sm text-green-600">ต้นทุน/ตัน ที่แตกต่าง</div>
                                <div className="text-xs text-gray-500">
                                    ({scenario1Data.summary?.avgCostPerTon > scenario2Data.summary?.avgCostPerTon ? 'S1 > S2' : 'S2 > S1'})
                                </div>
                            </div>

                            {/* Production Comparison */}
                            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    {Math.abs(scenario1Data.summary?.actualProduction - scenario2Data.summary?.actualProduction).toFixed(2)}
                                </div>
                                <div className="text-sm text-purple-600">ผลิตจริงที่แตกต่าง (ตัน)</div>
                                <div className="text-xs text-gray-500">
                                    ({scenario1Data.summary?.actualProduction > scenario2Data.summary?.actualProduction ? 'S1 > S2' : 'S2 > S1'})
                                </div>
                            </div>

                            {/* Total Cost Comparison */}
                            <div className="text-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">
                                    ฿{Math.abs(scenario1Data.summary?.totalCost - scenario2Data.summary?.totalCost).toLocaleString()}
                                </div>
                                <div className="text-sm text-red-600">ต้นทุนรวมที่แตกต่าง</div>
                                <div className="text-xs text-gray-500">
                                    ({scenario1Data.summary?.totalCost > scenario2Data.summary?.totalCost ? 'S1 > S2' : 'S2 > S1'})
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
