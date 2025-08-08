"use client";
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
    Calendar,
    DollarSign,
    Package,
    TrendingDown,
    Factory,
} from "lucide-react";
import { OptimizationData, InventoryItem, Delivery, Product, ProductionPlanItem } from "@/lib/types";

interface OptimizationResultTabProps {
    onRefresh: () => void;
    loading: boolean;
    data: OptimizationData | null;
}

export default function OptimizationResultTab({
    data,
}: OptimizationResultTabProps) {
    // Mock data สำหรับ fallbac

    // Process inventory data to extract delivery amounts by pulp type
    const processedInventoryData =
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
        }) || [];

    if (!data) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-gray-500">ไม่มีข้อมูลแสดง</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                                        <TableCell className="text-center font-bold text-purple-600 text-sm">
                                            {product.type}
                                        </TableCell>
                                        <TableCell
                                            className="text-center font-bold text-blue-600 text-sm"
                                            title={product.name}
                                        >
                                            {product.name?.length > 30
                                                ? `${product.name.substring(
                                                      0,
                                                      30
                                                  )}...`
                                                : product.name}
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
                                <TableHead>ผลิตภัณฑ์</TableHead>
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
                                            <TableCell
                                                className="max-w-xs truncate"
                                                title={plan.product}
                                            >
                                                {plan.product?.length > 40
                                                    ? `${plan.product.substring(
                                                          0,
                                                          40
                                                      )}...`
                                                    : plan.product}
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

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Material Inventory Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5" />
                            Material Inventory Trend
                        </CardTitle>
                        <CardDescription>
                            แนวโน้มการใช้วัตถุดิบ Eucalyptus และ Pulp แต่ละวัน
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={processedInventoryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip
                                    formatter={(value: number | string, name: string) => {
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
                                                displayName = "Pulp A คงเหลือ";
                                                break;
                                            case "pulp_b":
                                                displayName = "Pulp B คงเหลือ";
                                                break;
                                            case "pulp_c":
                                                displayName = "Pulp C คงเหลือ";
                                                break;
                                            case "delivery_pulp_a":
                                                displayName = "ส่งมอบ Pulp A";
                                                break;
                                            case "delivery_pulp_b":
                                                displayName = "ส่งมอบ Pulp B";
                                                break;
                                            case "delivery_pulp_c":
                                                displayName = "ส่งมอบ Pulp C";
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
