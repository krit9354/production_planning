"use client";
import { useState, useEffect } from "react";
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
import ReactECharts from 'echarts-for-react';
import {
    Calendar,
    DollarSign,
    Package,
    TrendingDown,
    Factory,
} from "lucide-react";
import { OptimizationData, InventoryItem, Delivery, Product, ProductionPlanItem } from "@/lib/types";
import { apiEndpoints } from "@/lib/api";

interface OptimizationResultTabProps {
    onRefresh: () => void;
    loading: boolean;
    data: OptimizationData | null;
}

export default function OptimizationResultTab({
    data,
}: OptimizationResultTabProps) {
    const [actualInventoryData, setActualInventoryData] = useState<any[]>([]);
    const [loadingActualData, setLoadingActualData] = useState(false);
    const [priceData, setPriceData] = useState<any[]>([]);
    const [loadingPrice, setLoadingPrice] = useState(false);

    // Fetch actual inventory data when component mounts or data changes
    useEffect(() => {
        const fetchActualInventoryData = async () => {
            if (!data?.inventoryData || data.inventoryData.length === 0) return;
            
            setLoadingActualData(true);
            try {
                // Get date range from optimization data
                const dates = data.inventoryData.map(item => item.date).filter(Boolean);
                const startDate = dates.length > 0 ? Math.min(...dates.map(d => new Date(d).getTime())) : null;
                const endDate = dates.length > 0 ? Math.max(...dates.map(d => new Date(d).getTime())) : null;
                
                const startDateStr = startDate ? new Date(startDate).toISOString().split('T')[0] : undefined;
                const endDateStr = endDate ? new Date(endDate).toISOString().split('T')[0] : undefined;
                
                const response = await fetch(apiEndpoints.getActualInventory(startDateStr, endDateStr));
                const result = await response.json();
                
                if (result.success && result.data) {
                    setActualInventoryData(result.data);
                    console.log("✅ Actual inventory data loaded:", result.data.length, "records");
                } else {
                    console.warn("⚠️ No actual inventory data found:", result.message);
                    setActualInventoryData([]);
                }
            } catch (error) {
                console.error("❌ Error fetching actual inventory data:", error);
                setActualInventoryData([]);
            } finally {
                setLoadingActualData(false);
            }
        };

        fetchActualInventoryData();
    }, [data?.inventoryData]);

    // Fetch material price data for the same date range
    useEffect(() => {
        const fetchPriceData = async () => {
            if (!data?.inventoryData || data.inventoryData.length === 0) return;

            setLoadingPrice(true);
            try {
                const dates = data.inventoryData.map(item => item.date).filter(Boolean);
                const startDate = dates.length > 0 ? Math.min(...dates.map(d => new Date(d).getTime())) : null;
                const endDate = dates.length > 0 ? Math.max(...dates.map(d => new Date(d).getTime())) : null;

                const startDateStr = startDate ? new Date(startDate).toISOString().split('T')[0] : undefined;
                const endDateStr = endDate ? new Date(endDate).toISOString().split('T')[0] : undefined;

                const response = await fetch(apiEndpoints.getPrice(startDateStr, endDateStr));
                const result = await response.json();

                if (result.success && result.data) {
                    setPriceData(result.data);
                    console.log("✅ Price data loaded:", result.data.length, "records");
                } else {
                    console.warn("⚠️ No price data found:", result.message);
                    setPriceData([]);
                }
            } catch (error) {
                console.error("❌ Error fetching price data:", error);
                setPriceData([]);
            } finally {
                setLoadingPrice(false);
            }
        };

        fetchPriceData();
    }, [data?.inventoryData]);

    // Process inventory data to extract delivery amounts by pulp type
    const processedInventoryData =
        data?.inventoryData?.map((item: InventoryItem) => {
            let delivery_pulp_a = 0;
            let delivery_pulp_b = 0;
            let delivery_pulp_c = 0;
            let delivery_eucalyptus = 0;

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
                        case "Eucalyptus":
                            delivery_eucalyptus += delivery.amount || 0;
                    }
                });
            }

            return {
                ...item,
                delivery_pulp_a,
                delivery_pulp_b,
                delivery_pulp_c,
                delivery_eucalyptus,
            };
        }) || [];

    // Helper function to get actual inventory value by date
    const getActualInventoryByDate = (date: string, pulpType: string) => {
        const actualItem = actualInventoryData.find(item => item.date === date);
        if (!actualItem) return null;
        
        switch (pulpType) {
            case 'eucalyptus':
                return actualItem.actual_eucalyptus;
            case 'pulp_a':
                return actualItem.actual_pulp_a;
            case 'pulp_b':
                return actualItem.actual_pulp_b;
            case 'pulp_c':
                return actualItem.actual_pulp_c;
            default:
                return null;
        }
    };

    // Prepare data for ECharts
    const prepareChartData = () => {
        if (!processedInventoryData || processedInventoryData.length === 0) return { dates: [], series: [] };

        const dates = processedInventoryData.map(item => item?.date || '');
        
        const series = [
            // Predicted lines
            {
                name: 'Eucalyptus (Predicted)',
                type: 'line',
                data: processedInventoryData.map(item => item?.eucalyptus || 0),
                lineStyle: { color: '#8b5cf6', width: 3 },
                symbol: 'circle',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            {
                name: 'Pulp A (Predicted)',
                type: 'line',
                data: processedInventoryData.map(item => item?.pulp_a || 0),
                lineStyle: { color: '#82ca9d', width: 3 },
                symbol: 'circle',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            {
                name: 'Pulp B (Predicted)',
                type: 'line',
                data: processedInventoryData.map(item => item?.pulp_b || 0),
                lineStyle: { color: '#ffc658', width: 3 },
                symbol: 'circle',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            {
                name: 'Pulp C (Predicted)',
                type: 'line',
                data: processedInventoryData.map(item => item?.pulp_c || 0),
                lineStyle: { color: '#ff7300', width: 3 },
                symbol: 'circle',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            // Actual lines (dashed)
            {
                name: 'Eucalyptus (Actual)',
                type: 'line',
                data: processedInventoryData.map((item) => {
                    return getActualInventoryByDate(item?.date || '', 'eucalyptus');
                }),
                lineStyle: { 
                    color: '#976df7ff', 
                    width: 3, 
                    type: 'dashed',
                    opacity: 0.8 
                },
                itemStyle: {
                    color: '#7540f1ff',
                    borderColor: '#8b5cf6',
                    opacity: 0.95,
                },
                symbol: 'diamond',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            {
                name: 'Pulp A (Actual)',
                type: 'line',
                data: processedInventoryData.map((item) => {
                    return getActualInventoryByDate(item?.date || '', 'pulp_a');
                }),
                lineStyle: { 
                    color: '#82ca9d', 
                    width: 3, 
                    type: 'dashed',
                    opacity: 0.8 
                },
                itemStyle: {
                    color: '#28a745',
                    borderColor: '#28a745',
                    opacity: 0.95,
                },
                symbol: 'diamond',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            {
                name: 'Pulp B (Actual)',
                type: 'line',
                data: processedInventoryData.map((item) => {
                    return getActualInventoryByDate(item?.date || '', 'pulp_b');
                }),
                lineStyle: { 
                    color: '#ffc658', 
                    width: 3, 
                    type: 'dashed',
                    opacity: 0.8 
                },
                itemStyle: {
                    color: '#ffb31cff',
                    borderColor: '#ffbb33ff',
                    opacity: 0.95,
                },
                symbol: 'diamond',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            {
                name: 'Pulp C (Actual)',
                type: 'line',
                data: processedInventoryData.map((item) => {
                    return getActualInventoryByDate(item?.date || '', 'pulp_c');
                }),
                lineStyle: { 
                    color: '#ffa65dff', 
                    width: 3, 
                    type: 'dashed',
                    opacity: 0.8 
                },
                itemStyle: {
                    color: '#ff7300',
                    borderColor: '#ff7300',
                    opacity: 0.95,
                },
                symbol: 'diamond',
                symbolSize: 6,
                yAxisIndex: 0,
            },
            // Delivery bars
            {
                name: 'ส่งมอบ Eucalyptus',
                type: 'bar',
                data: processedInventoryData.map(item => item?.delivery_eucalyptus || 0),
                itemStyle: { color: '#976df7ff', opacity: 0.8 },
                yAxisIndex: 1,
            },
            {
                name: 'ส่งมอบ Pulp A',
                type: 'bar',
                data: processedInventoryData.map(item => item?.delivery_pulp_a || 0),
                itemStyle: { color: '#82ca9d', opacity: 0.8 },
                yAxisIndex: 1,
            },
            {
                name: 'ส่งมอบ Pulp B',
                type: 'bar',
                data: processedInventoryData.map(item => item?.delivery_pulp_b || 0),
                itemStyle: { color: '#ffc658', opacity: 0.8 },
                yAxisIndex: 1,
            },
            {
                name: 'ส่งมอบ Pulp C',
                type: 'bar',
                data: processedInventoryData.map(item => item?.delivery_pulp_c || 0),
                itemStyle: { color: '#ff7300', opacity: 0.8 },
                yAxisIndex: 1,
            },
        ];

        return { dates, series };
    };

    const chartData = prepareChartData();

    // Helper: get price by date and pulp key
    const getPriceByDate = (date: string, pulpKey: 'eucalyptus'|'pulp_a'|'pulp_b'|'pulp_c') => {
        const item = priceData.find(d => d.date === date);
        if (!item) return null;
        switch (pulpKey) {
            case 'eucalyptus': return item.price_eucalyptus;
            case 'pulp_a': return item.price_pulp_a;
            case 'pulp_b': return item.price_pulp_b;
            case 'pulp_c': return item.price_pulp_c;
            default: return null;
        }
    };

    const getPriceEChartsOption = () => {
        const dates = (processedInventoryData || []).map(item => item?.date || '');
        if (!dates || dates.length === 0) {
            return {
                title: { text: 'ไม่มีข้อมูลราคา', left: 'center' }
            };
        }

        return {
            title: { text: '', left: 'center' },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: function(params: any) {
                    if (!params || !Array.isArray(params) || params.length === 0) return '';
                    let result = `วันที่ ${params[0]?.axisValue || ''}<br/>`;
                    params.forEach((param: any) => {
                        if (param && param.value !== null && param.value !== undefined && param.value !== 0) {
                            const value = typeof param.value === 'number' ? param.value : parseFloat(param.value);
                            if (!isNaN(value)) {
                                result += `${param.marker || ''} ${param.seriesName || ''}: ฿${value.toFixed(2)}/กิโลกรัม<br/>`;
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
                selected: {
                    'Eucalyptus Price': true,
                    'Pulp A Price': true,
                    'Pulp B Price': true,
                    'Pulp C Price': true,
                }
            },
            grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: { type: 'category', boundaryGap: false, data: dates, axisPointer: { type: 'shadow' } },
            yAxis: [{ type: 'value', name: 'Price (฿/กิโลกรัม)', position: 'left', axisLabel: { formatter: '฿{value}/กก.' } }],
            series: [
                { name: 'Eucalyptus Price', type: 'line', data: dates.map(d => getPriceByDate(d, 'eucalyptus')), lineStyle: { color: '#8b5cf6', width: 2 }, symbol: 'circle', symbolSize: 5 },
                { name: 'Pulp A Price', type: 'line', data: dates.map(d => getPriceByDate(d, 'pulp_a')), lineStyle: { color: '#28a745', width: 2 }, symbol: 'circle', symbolSize: 5 },
                { name: 'Pulp B Price', type: 'line', data: dates.map(d => getPriceByDate(d, 'pulp_b')), lineStyle: { color: '#ffc658', width: 2 }, symbol: 'circle', symbolSize: 5 },
                { name: 'Pulp C Price', type: 'line', data: dates.map(d => getPriceByDate(d, 'pulp_c')), lineStyle: { color: '#ff7300', width: 2 }, symbol: 'circle', symbolSize: 5 },
            ],
            animationDuration: 800,
            animationEasing: 'cubicOut'
        };
    };

    // Derive scenario date range (prefer inventoryData; fallback to productionPlan)
    const inventoryDates = (data?.inventoryData || [])
        .map((item: any) => item?.date)
        .filter((d: any): d is string => typeof d === 'string' && d.length > 0);
    const planDates = (data?.productionPlan || [])
        .map((item: any) => item?.date)
        .filter((d: any): d is string => typeof d === 'string' && d.length > 0);
    const dateSource = inventoryDates.length > 0 ? inventoryDates : planDates;
    const startDateMs = dateSource.length > 0 ? Math.min(...dateSource.map(d => new Date(d).getTime())) : null;
    const endDateMs = dateSource.length > 0 ? Math.max(...dateSource.map(d => new Date(d).getTime())) : null;
    const formatDate = (ms: number | null) => (ms ? new Date(ms).toISOString().split('T')[0] : '');
    const scenarioStart = formatDate(startDateMs);
    const scenarioEnd = formatDate(endDateMs);

    const getEChartsOption = () => {
        const chartData = prepareChartData();
        
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
                selected: {
                    // เริ่มต้นแสดงทั้ง predicted และ actual lines พร้อม delivery bars
                    'Eucalyptus (Predicted)': true,
                    'Pulp A (Predicted)': true,
                    'Pulp B (Predicted)': true,
                    'Pulp C (Predicted)': true,
                    'Eucalyptus  (Actual)': true,
                    'Pulp A (Actual)': true,
                    'Pulp B (Actual)': true,
                    'Pulp C (Actual)': true,
                    'ส่งมอบ Pulp A': true,
                    'ส่งมอบ Pulp B': true,
                    'ส่งมอบ Pulp C': true,
                }
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

    if (!data) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-gray-500">ไม่มีข้อมูลแสดง</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Scenario Date Range Label */}
            {(scenarioStart && scenarioEnd) ? (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                        ช่วงวันที่: <span className="font-medium">{scenarioStart}</span> ถึง <span className="font-medium">{scenarioEnd}</span>
                    </span>
                </div>
            ) : null}
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            ผลิตได้
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.summary?.totalDays?.toFixed(3) || 0} วัน
                        </div>
                        <p className="text-xs text-muted-foreground">จาก {data.summary?.maxPossibleDays?.toFixed(0) || 0} วัน</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Cost
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ฿
                            {data.summary?.totalCost?.toLocaleString() ||
                                0}
                        </div>
                        <p className="text-xs text-muted-foreground">บาท</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Cost per Ton
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ฿
                                {data.summary?.avgCostPerTon?.toLocaleString() ||
                                    0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            บาท/ตัน
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Actual Production
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.summary?.actualProduction?.toFixed(
                                2
                            ) || 0} ตัน
                        </div>
                        <p className="text-xs text-muted-foreground">จาก {data.summary?.targetProduction?.toFixed(2) || 0} ตัน</p>
                    </CardContent>
                </Card>
            </div>

            {/* Material Ratios Table */}
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Factory className="h-6 w-6" />
                        Product Formulas & Material Ratios -
                        สูตรและอัตราส่วนวัตถุดิบ
                    </CardTitle>
                    <CardDescription>
                        แสดงสูตรและอัตราส่วนวัตถุดิบของแต่ละผลิตภัณฑ์
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
                                    เยื่อกระดาษ (%)
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Eucalyptus (%)
                                </TableHead>
                                <TableHead className="text-center font-semibold">
                                    Target (tons)
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.products
                                ?.filter((product: Product) => (product.target_quantity || 0) > 0)
                                ?.map(
                                (product: Product, index: number) => (
                                    <TableRow
                                        key={product.name || index}
                                        className="hover:bg-gray-50"
                                    >
                                        <TableCell className="text-center font-bold text-blue-600 text-sm">
                                            {product.brand}
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-purple-600 text-sm">
                                            {product.product_group}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-sm">
                                            {product.thickness}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-sm">
                                            {product.channel}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant="outline"
                                                className="bg-blue-50 text-blue-700 border-blue-200"
                                            >
                                                {product.formula}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {(
                                                (product.ratios?.Pulp_A || 0) *
                                                100
                                            ).toFixed(1)}
                                            %
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {(
                                                (product.ratios?.Pulp_B || 0) *
                                                100
                                            ).toFixed(1)}
                                            %
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {(
                                                (product.ratios?.Pulp_C || 0) *
                                                100
                                            ).toFixed(1)}
                                            %
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {(
                                                (product.ratios?.เยื่อกระดาษ ||
                                                    0) * 100
                                            ).toFixed(1)}
                                            %
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {(
                                                (product.ratios?.Eucalyptus ||
                                                    0) * 100
                                            ).toFixed(1)}
                                            %
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-green-600">
                                            {product.target_quantity?.toFixed(
                                                2
                                            ) || 0}
                                        </TableCell>
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Production Plan Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Production Plan - แผนการผลิต
                    </CardTitle>
                    <CardDescription>
                        ตารางแสดงแผนการผลิตและการใช้วัตถุดิบในแต่ละวัน
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>วัน</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Product Type</TableHead>
                                <TableHead>Thickness</TableHead>
                                <TableHead>Channel</TableHead>
                                <TableHead>Formula</TableHead>
                                <TableHead>ปริมาณเป้าหมาย (ตัน)</TableHead>
                                <TableHead>ปริมาณที่ผลิตได้ (ตัน)</TableHead>
                                <TableHead>สัดส่วนการผลิต (%)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.productionPlan?.map(
                                (plan: ProductionPlanItem, index: number) => {
                                    const achievementPercent = 
                                        (plan.quantity / plan.target_quantity) *
                                        100
                                    
                                    return (
                                        <TableRow key={`${plan.date}-${index}`}>
                                            <TableCell className="font-medium">
                                                {plan.date}
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-blue-600 text-sm">
                                                {plan.product_group?.[0] || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-purple-600 text-sm">
                                                {plan.product_group?.[1] || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold text-sm">
                                                {plan.product_group?.[2] || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold text-sm">
                                                {plan.product_group?.[3] || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {plan.formula}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold text-blue-600">
                                                {plan.target_quantity?.toFixed(
                                                    2
                                                )}
                                            </TableCell>
                                            <TableCell
                                                className={`font-semibold ${
                                                    plan.quantity ===
                                                    plan.target_quantity
                                                        ? "text-green-600"
                                                        : plan.quantity <= 0
                                                        ? "text-red-600"
                                                        : "text-yellow-600"
                                                }`}
                                            >
                                                {plan.quantity > 0 ? plan.quantity?.toFixed(2): 0}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`flex-1 rounded-full h-2 ${
                                                            plan.quantity <= 0
                                                                ? "bg-red-500"
                                                                : "bg-gray-200"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                plan.quantity ===
                                                                plan.target_quantity
                                                                    ? "bg-green-500"
                                                                    : plan.quantity <= 0
                                                                    ? "bg-red-500"
                                                                    : "bg-yellow-500"
                                                            }`}
                                                            style={{
                                                                width: `${Math.min(
                                                                    parseFloat(
                                                                        achievementPercent.toFixed(1)
                                                                    ),
                                                                    100
                                                                )}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-medium">
                                                        {achievementPercent <= 0 ? 0 : achievementPercent.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Material Inventory Chart - Full Width */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" />
                        Material Inventory Trend
                    </CardTitle>
                    <CardDescription>
                        แนวโน้มการใช้วัตถุดิบ Eucalyptus และ Pulp แต่ละวัน (สีเส้นทึบ = Predicted, เส้นประ = Actual)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div style={{ width: '100%', height: '500px' }}>
                        <ReactECharts 
                            option={getEChartsOption()} 
                            style={{ height: '100%', width: '100%' }}
                            theme="default"
                        />
                    </div>
                </CardContent>
            </Card>

            
            {/* Other Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Cost per Ton Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Cost per Ton Daily
                        </CardTitle>
                        <CardDescription>ต้นทุนต่อตันรายวัน</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.dataPerDay}>
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
                            Daily Cost
                        </CardTitle>
                        <CardDescription>ต้นทุนรายวัน</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.dataPerDay}>
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
                        <CardDescription>ปริมาณการผลิตรายวัน</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.dataPerDay}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value: number | string) => [
                                        `${parseFloat(String(value)).toFixed(2)} ตัน`,
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

                {/* Material Price Chart - Full Width */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Material Price Trend
                    </CardTitle>
                    <CardDescription>
                        แนวโน้มราคาวัตถุดิบรายวัน (฿/กิโลกรัม)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div style={{ width: '100%', height: '400px' }}>
                        <ReactECharts
                            option={getPriceEChartsOption()}
                            style={{ height: '100%', width: '100%' }}
                            theme="default"
                        />
                    </div>
                </CardContent>
            </Card>

            </div>

            {/* Summary Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle>Summary - สรุปผล</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className=" grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700">
                                Optimization Details
                            </h4>
                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                                <p>
                                    Algorithm:{" "}
                                    {data.summary?.optimizationType ||
                                        "N/A"}
                                </p>
                                <p>
                                    Max Possible Days:{" "}
                                    {data.summary?.maxPossibleDays ||
                                        "N/A"}
                                </p>
                                <p>
                                    Fitness Score:{" "}
                                    {data.summary?.fitness?.toFixed(4) ||
                                        "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700">
                                Final Pulp Inventory
                            </h4>
                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                                <p>
                                    Pulp A:{" "}
                                    {data.pulpInventoryFinal?.pulp_a?.toFixed(
                                        2
                                    ) || 0}{" "}
                                    ตัน
                                </p>
                                <p>
                                    Pulp B:{" "}
                                    {data.pulpInventoryFinal?.pulp_b?.toFixed(
                                        2
                                    ) || 0}{" "}
                                    ตัน
                                </p>
                                <p>
                                    Pulp C:{" "}
                                    {data.pulpInventoryFinal?.pulp_c?.toFixed(
                                        2
                                    ) || 0}{" "}
                                    ตัน
                                </p>
                                <p>
                                    Eucalyptus:{" "}
                                    {data.pulpInventoryFinal?.eucalyptus?.toFixed(
                                        2
                                    ) || 0}{" "}
                                    ตัน
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
