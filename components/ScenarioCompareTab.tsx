"use client";

import React, { useState } from "react";
import axios from "axios";
import { apiEndpoints } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import ReactECharts from 'echarts-for-react';
import {
    DollarSign,
    Package,
    TrendingDown,
    Factory,
    Settings,
    ArrowRight,
    Play
} from "lucide-react";
import { OptimizationData, safeCalculation, InventoryItem, Delivery } from "@/lib/types";

interface ScenarioCompareTabProps {
    onRefresh: () => void;
    loading: boolean;
    scenarios: string[];
    loadingScenarios: boolean;
}

export default function ScenarioCompareTab({
    scenarios,
    loadingScenarios,
}: ScenarioCompareTabProps) {
    const [selectedScenario1, setSelectedScenario1] = useState<string>("");
    const [selectedScenario2, setSelectedScenario2] = useState<string>("");
    const [scenario1Data, setScenario1Data] = useState<OptimizationData | null>(null);
    const [scenario2Data, setScenario2Data] = useState<OptimizationData | null>(null);
    const [comparing, setComparing] = useState<boolean>(false);

    // Fetch scenario data from API
    const fetchScenarioData = async (scenarioName: string) => {
        if (!scenarioName) return null;
        
        try {
            const response = await axios.get(apiEndpoints.getScenario(scenarioName));
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
    const processInventoryData = (data: OptimizationData | null) => {
        return data?.inventoryData?.map((item: InventoryItem) => {
            let delivery_pulp_a = 0;
            let delivery_pulp_b = 0;
            let delivery_pulp_c = 0;

            if (item.deliveries && item.deliveries.length > 0) {
                item.deliveries.forEach((delivery: Delivery) => {
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

    // Prepare data for ECharts
    const prepareChartData = (processedData: any[]) => {
        if (!processedData || processedData.length === 0) return { dates: [], series: [] };

        const dates = processedData.map(item => item?.date || '');
        
        const series = [
            // Stock lines
            {
                name: 'Eucalyptus',
                type: 'line',
                data: processedData.map(item => item?.eucalyptus || 0),
                lineStyle: { color: '#8b5cf6', width: 3 },
                symbol: 'circle',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            {
                name: 'Pulp A',
                type: 'line',
                data: processedData.map(item => item?.pulp_a || 0),
                lineStyle: { color: '#82ca9d', width: 3 },
                symbol: 'circle',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            {
                name: 'Pulp B',
                type: 'line',
                data: processedData.map(item => item?.pulp_b || 0),
                lineStyle: { color: '#ffc658', width: 3 },
                symbol: 'circle',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            {
                name: 'Pulp C',
                type: 'line',
                data: processedData.map(item => item?.pulp_c || 0),
                lineStyle: { color: '#ff7300', width: 3 },
                symbol: 'circle',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            // Delivery bars
            {
                name: 'ส่งมอบ Pulp A',
                type: 'bar',
                data: processedData.map(item => item?.delivery_pulp_a || 0),
                itemStyle: { color: '#82ca9d', opacity: 0.8 },
                yAxisIndex: 1,
            },
            {
                name: 'ส่งมอบ Pulp B',
                type: 'bar',
                data: processedData.map(item => item?.delivery_pulp_b || 0),
                itemStyle: { color: '#ffc658', opacity: 0.8 },
                yAxisIndex: 1,
            },
            {
                name: 'ส่งมอบ Pulp C',
                type: 'bar',
                data: processedData.map(item => item?.delivery_pulp_c || 0),
                itemStyle: { color: '#ff7300', opacity: 0.8 },
                yAxisIndex: 1,
            },
        ];

        return { dates, series };
    };

    const getEChartsOption = (processedData: any[], title: string) => {
        const chartData = prepareChartData(processedData);
        
        if (!chartData.dates || chartData.dates.length === 0) {
            return {
                title: {
                    text: 'ไม่มีข้อมูลแสดง',
                    left: 'center'
                }
            };
        }
        
        return {
            title: {
                text: '',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                formatter: function(params: any) {
                    if (!params || !Array.isArray(params) || params.length === 0) {
                        return '';
                    }
                    
                    let result = `วันที่ ${params[0]?.axisValue || ''}<br/>`;
                    params.forEach((param: any) => {
                        if (param && param.value !== null && param.value !== undefined && param.value !== 0) {
                            const value = typeof param.value === 'number' ? param.value : parseFloat(param.value);
                            if (!isNaN(value)) {
                                result += `${param.marker || ''} ${param.seriesName || ''}: ${value.toFixed(2)} ตัน<br/>`;
                            }
                        }
                    });
                    return result;
                }
            },
            legend: {
                type: 'scroll',
                orient: 'horizontal',
                left: 'center',
                top: 'bottom',
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: chartData.dates,
                axisPointer: {
                    type: 'shadow'
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Stock (ตัน)',
                    position: 'left',
                    axisLabel: {
                        formatter: '{value} ตัน'
                    }
                },
                {
                    type: 'value',
                    name: 'Delivery (ตัน)',
                    position: 'right',
                    axisLabel: {
                        formatter: '{value} ตัน'
                    }
                }
            ],
            series: chartData.series || [],
            animationDuration: 1000,
            animationEasing: 'cubicOut'
        };
    };

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

                    {/* Material Inventory Charts - Full Width */}
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
                            <div style={{ width: '100%', height: '400px' }}>
                                <ReactECharts 
                                    option={getEChartsOption(scenario1ProcessedInventoryData, selectedScenario1)} 
                                    style={{ height: '100%', width: '100%' }}
                                    theme="default"
                                />
                            </div>
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
                            <div style={{ width: '100%', height: '400px' }}>
                                <ReactECharts 
                                    option={getEChartsOption(scenario2ProcessedInventoryData, selectedScenario2)} 
                                    style={{ height: '100%', width: '100%' }}
                                    theme="default"
                                />
                            </div>
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
                                        formatter={(value: number | string) => [`฿${parseFloat(String(value)).toLocaleString()}`, "ต้นทุนต่อตัน"]}
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
                                        formatter={(value: number | string) => [`฿${parseFloat(String(value)).toLocaleString()}`, "ต้นทุนต่อตัน"]}
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
                                        formatter={(value: number | string) => [`฿${parseFloat(String(value)).toLocaleString()}`, "ต้นทุนรายวัน"]}
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
                                        formatter={(value: number | string) => [`฿${parseFloat(String(value)).toLocaleString()}`, "ต้นทุนรายวัน"]}
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
                                        formatter={(value: number | string) => [`${parseFloat(String(value)).toFixed(2)} ตัน`, "ปริมาณการผลิต"]}
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
                                        formatter={(value: number | string) => [`${parseFloat(String(value)).toFixed(2)} ตัน`, "ปริมาณการผลิต"]}
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
                                    {safeCalculation(
                                        scenario1Data.summary?.totalDays,
                                        scenario2Data.summary?.totalDays,
                                        'subtract'
                                    ).toFixed(2)}
                                </div>
                                <div className="text-sm text-blue-600">วันที่แตกต่าง</div>
                                <div className="text-xs text-gray-500">
                                    ({(scenario1Data.summary?.totalDays ?? 0) > (scenario2Data.summary?.totalDays ?? 0) ? 'S1 > S2' : 'S2 > S1'})
                                </div>
                            </div>

                            {/* Cost per Ton Comparison */}
                            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    ฿{Math.abs(safeCalculation(
                                        scenario1Data.summary?.avgCostPerTon,
                                        scenario2Data.summary?.avgCostPerTon,
                                        'subtract'
                                    )).toLocaleString()}
                                </div>
                                <div className="text-sm text-green-600">ต้นทุน/ตัน ที่แตกต่าง</div>
                                <div className="text-xs text-gray-500">
                                    ({(scenario1Data.summary?.avgCostPerTon ?? 0) > (scenario2Data.summary?.avgCostPerTon ?? 0) ? 'S1 > S2' : 'S2 > S1'})
                                </div>
                            </div>

                            {/* Production Comparison */}
                            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    {Math.abs(safeCalculation(
                                        scenario1Data.summary?.actualProduction,
                                        scenario2Data.summary?.actualProduction,
                                        'subtract'
                                    )).toFixed(2)}
                                </div>
                                <div className="text-sm text-purple-600">ผลิตจริงที่แตกต่าง (ตัน)</div>
                                <div className="text-xs text-gray-500">
                                    ({(scenario1Data.summary?.actualProduction ?? 0) > (scenario2Data.summary?.actualProduction ?? 0) ? 'S1 > S2' : 'S2 > S1'})
                                </div>
                            </div>

                            {/* Total Cost Comparison */}
                            <div className="text-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">
                                    ฿{Math.abs(safeCalculation(
                                        scenario1Data.summary?.totalCost,
                                        scenario2Data.summary?.totalCost,
                                        'subtract'
                                    )).toLocaleString()}
                                </div>
                                <div className="text-sm text-red-600">ต้นทุนรวมที่แตกต่าง</div>
                                <div className="text-xs text-gray-500">
                                    ({(scenario1Data.summary?.totalCost ?? 0) > (scenario2Data.summary?.totalCost ?? 0) ? 'S1 > S2' : 'S2 > S1'})
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
