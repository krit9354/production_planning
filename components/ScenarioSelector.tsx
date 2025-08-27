"use client";

import React from "react";
import { Database, Play, X } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiEndpoints } from "@/lib/api";
import OptimizationResultTab from "./OptimizationResultTab";

interface ScenarioSelectorProps {
    scenarios: string[];
    selectedScenario: string;
    onSelectedScenarioChange: (scenario: string) => void;
    loadingScenarios: boolean;
    onDeleteScenario: (scenarioName: string) => void;
    scenarioData?: any; // ข้อมูล scenario ที่เลือก
    loading?: boolean; // loading สำหรับ OptimizationResultTab
    onRefresh?: () => void; // callback สำหรับ refresh data
    onSaveScenario?: (scenarioName: string, data: any) => void; // callback สำหรับ save
}

export default function ScenarioSelector({
    scenarios,
    selectedScenario,
    onSelectedScenarioChange,
    loadingScenarios,
    onDeleteScenario,
    scenarioData,
    loading = false,
    onRefresh,
    onSaveScenario,
}: ScenarioSelectorProps) {
    const [isSaving, setIsSaving] = React.useState(false);
    const [showConfirmModal, setShowConfirmModal] = React.useState(false);

    const handleConfirmSave = () => {
        setShowConfirmModal(true);
    };

    const handleCancelSave = () => {
        setShowConfirmModal(false);
    };

    const handleSubmit = async () => {
        if (!selectedScenario || !scenarioData) {
            alert('กรุณาเลือก scenario ก่อน');
            return;
        }

        // ปิด modal
        setShowConfirmModal(false);

        try {
            setIsSaving(true);

            // เตรียมข้อมูลตามรูปแบบที่กำหนด
            const saveData = {
                scenario: {
                    total_days: scenarioData.total_days || 30,
                    max_possible_days: scenarioData.max_possible_days || 35,
                    success_rate: scenarioData.success_rate || 0.85,
                    total_cost: scenarioData.total_cost || 0,
                    avg_cost_per_day: scenarioData.avg_cost_per_day || 0,
                    avg_cost_per_ton: scenarioData.avg_cost_per_ton || 0,
                    actual_production: scenarioData.actual_production || 0,
                    target_production: scenarioData.target_production || 0,
                    fitness: scenarioData.fitness || 0,
                    start_date: scenarioData.productionPlan[0].date || null,
                    end_date: scenarioData.productionPlan[scenarioData.productionPlan.length - 1].date || null,
                    scenario_name: selectedScenario
                },
                products: scenarioData.products || [],
                inventoryData: scenarioData.inventoryData || []
            };
            console.log("Saving scenario data:", saveData);
            const response = await fetch(apiEndpoints.saveScenario(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(saveData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                alert(`บันทึก scenario "${selectedScenario}" สำเร็จแล้ว`);
                
                // เรียก callback ถ้ามี
                if (onSaveScenario) {
                    onSaveScenario(selectedScenario, saveData);
                }
            } else {
                throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึก');
            }

        } catch (error) {
            console.error('Save scenario error:', error);
            alert(`เกิดข้อผิดพลาดในการบันทึก scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Confirmation Modal Component
    const ConfirmationModal = () => {
        if (!showConfirmModal) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <div 
                    className="fixed inset-0"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={handleCancelSave}
                />
                
                {/* Modal */}
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            ยืนยันการบันทึก Scenario
                        </h3>
                        <button
                            onClick={handleCancelSave}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="mb-6">
                        <p className="text-gray-600 mb-4">
                            คุณต้องการบันทึก scenario นี้ลงในฐานข้อมูลหรือไม่?
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                <strong>Scenario:</strong> {selectedScenario}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                ข้อมูลจะถูกบันทึกลงในตาราง scenario และ products
                            </p>
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-3 justify-end">
                        <Button
                            onClick={handleCancelSave}
                            variant="outline"
                            disabled={isSaving}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    ยืนยันการบันทึก
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Confirmation Modal */}
            <ConfirmationModal />
            {/* Scenario Selection Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-6 w-6" />
                        Scenario Results - ผลลัพธ์ Scenario
                    </CardTitle>
                    <CardDescription>
                        เลือก scenario เพื่อดูผลลัพธ์การวิเคราะห์
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 w-[50%]">
                            <label className="text-sm font-medium w-[50%]">
                                เลือก Scenario:
                            </label>
                            <Select
                                value={selectedScenario}
                                onValueChange={onSelectedScenarioChange}
                                disabled={loadingScenarios}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="-- เลือก Scenario --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {scenarios.map((scenario, index) => (
                                        <SelectItem
                                            key={`scenario-${index}-${scenario}`}
                                            value={scenario}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span>{scenario}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedScenario !== "main_standard_ga" &&
                                selectedScenario && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onDeleteScenario(selectedScenario);
                                        }}
                                        className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                        title={`ลบ scenario: ${selectedScenario}`}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                )}
                        </div>
                        <button
                            onClick={handleConfirmSave}
                            disabled={!selectedScenario || !scenarioData || isSaving}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4" /> ยืนยัน Scenario
                                </>
                            )}
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Show message when no scenario is selected */}
            {!selectedScenario && !loadingScenarios && (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                เลือก Scenario เพื่อดูข้อมูล
                            </h3>
                            <p className="text-gray-600">
                                กรุณาเลือก scenario จาก dropdown
                                ด้านบนเพื่อแสดงข้อมูลการวิเคราะห์
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Show OptimizationResultTab when scenario is selected */}
            {selectedScenario && (
                <OptimizationResultTab 
                    data={scenarioData} 
                    loading={loading} 
                    onRefresh={onRefresh || (() => {})}
                />
            )}
        </>
    );
}
