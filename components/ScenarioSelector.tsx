"use client";

import React from "react";
import { Database, Play } from "lucide-react";
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

interface ScenarioSelectorProps {
    scenarios: string[];
    selectedScenario: string;
    onSelectedScenarioChange: (scenario: string) => void;
    loadingScenarios: boolean;
    onDeleteScenario: (scenarioName: string) => void;
}

export default function ScenarioSelector({
    scenarios,
    selectedScenario,
    onSelectedScenarioChange,
    loadingScenarios,
    onDeleteScenario,
}: ScenarioSelectorProps) {
    const handleSubmit = () => {};
    return (
        <>
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
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <Play className="h-4 w-4" /> ยืนยัน Scenario
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
        </>
    );
}
