"use client";

import React, { useState } from "react";
import { Upload, Download, FileSpreadsheet, Database, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiEndpoints } from "@/lib/api";

interface ImportExportTabProps {
  loading?: boolean;
  onRefresh?: () => void;
}

export default function ImportExportTab({
  loading = false,
  onRefresh,
}: ImportExportTabProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportStatus('idle');

      const res = await fetch(apiEndpoints.exportExcel(), {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "production_optimization_export.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      setExportStatus('success');
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setIsImporting(true);
      setImportStatus('idle');

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(apiEndpoints.importExcel(), {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      console.log('Import result:', result);
      
      // Show success message from API
      if (result.message) {
        alert(result.message);
      }
      
      setImportStatus('success');
      
      // Refresh data if callback provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      
      // Show error message to user
      if (error instanceof Error) {
        alert(`เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ${error.message}`);
      } else {
        alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type - only .xlsx files
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx')) {
        alert('กรุณาเลือกไฟล์ Excel (.xlsx) เท่านั้น');
        // Reset input value
        event.target.value = '';
        return;
      }

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 10MB');
        // Reset input value
        event.target.value = '';
        return;
      }

      handleImport(file);
    }
    
    // Reset input value after processing to allow re-upload of same file
    event.target.value = '';
  };

  const resetStatus = () => {
    setExportStatus('idle');
    setImportStatus('idle');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Import/Export Data - นำเข้า/ส่งออกข้อมูล
          </CardTitle>
          <CardDescription>
            นำเข้าและส่งออกข้อมูลการผลิตและการวิเคราะห์ในรูปแบบ Excel
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data - ส่งออกข้อมูล
            </CardTitle>
            <CardDescription>
              ส่งออกข้อมูลการวิเคราะห์และผลลัพธ์การผลิตเป็นไฟล์ Excel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-medium">Production Optimization Data</h3>
                  <p className="text-sm text-gray-600">ข้อมูลการวิเคราะห์การผลิตและผลลัพธ์</p>
                </div>
              </div>
              <Button
                onClick={handleExport}
                disabled={isExporting || loading}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ส่งออก...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    ส่งออก Excel
                  </>
                )}
              </Button>
            </div>

            {/* Export Status */}
            {exportStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 text-sm">ส่งออกข้อมูลสำเร็จแล้ว</span>
                <button
                  onClick={resetStatus}
                  className="ml-auto text-green-600 hover:text-green-800 text-sm underline"
                >
                  ปิด
                </button>
              </div>
            )}

            {exportStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 text-sm">เกิดข้อผิดพลาดในการส่งออกข้อมูล</span>
                <button
                  onClick={resetStatus}
                  className="ml-auto text-red-600 hover:text-red-800 text-sm underline"
                >
                  ปิด
                </button>
              </div>
            )}

            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
              <strong>หมายเหตุ:</strong> ไฟล์ที่ส่งออกจะมีข้อมูลการวิเคราะห์การผลิต ผลลัพธ์การ optimization 
              และข้อมูลต่างๆ ที่เกี่ยวข้องในรูปแบบ Excel สามารถนำไปใช้งานต่อได้
            </div>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data - นำเข้าข้อมูล
            </CardTitle>
            <CardDescription>
              นำเข้าข้อมูลการผลิตและการวิเคราะห์จากไฟล์ Excel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                อัพโหลดไฟล์ Excel
              </h3>
              <p className="text-gray-600 mb-4">
                เลือกไฟล์ .xlsx ที่ต้องการนำเข้า
              </p>
              
              <label className="inline-block">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  disabled={isImporting || loading}
                  className="hidden"
                />
                <div className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      กำลังนำเข้า...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      เลือกไฟล์
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Import Status */}
            {importStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 text-sm">นำเข้าข้อมูลสำเร็จแล้ว</span>
                <button
                  onClick={resetStatus}
                  className="ml-auto text-green-600 hover:text-green-800 text-sm underline"
                >
                  ปิด
                </button>
              </div>
            )}

            {importStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 text-sm">เกิดข้อผิดพลาดในการนำเข้าข้อมูล</span>
                <button
                  onClick={resetStatus}
                  className="ml-auto text-red-600 hover:text-red-800 text-sm underline"
                >
                  ปิด
                </button>
              </div>
            )}

            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg space-y-1">
              <strong>ข้อกำหนดไฟล์:</strong>
              <ul className="list-disc list-inside space-y-1">
                <li>รองรับไฟล์ .xlsx เท่านั้น</li>
                <li>ขนาดไฟล์ไม่เกิน 10MB</li>
                <li>ควรมีโครงสร้างข้อมูลที่ถูกต้องตามรูปแบบที่กำหนด</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            คำแนะนำการใช้งาน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-700 mb-3">📤 การส่งออกข้อมูล</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• คลิกปุ่ม "ส่งออก Excel" เพื่อดาวน์โหลดข้อมูล</li>
                <li>• ไฟล์จะถูกบันทึกเป็น "production_optimization_export.xlsx"</li>
                <li>• ประกอบด้วยข้อมูลการวิเคราะห์และผลลัพธ์ทั้งหมด</li>
                <li>• สามารถเปิดด้วย Microsoft Excel หรือโปรแกรมที่รองรับ</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 mb-3">📥 การนำเข้าข้อมูล</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• เลือกไฟล์ Excel (.xlsx) ที่ต้องการนำเข้า</li>
                <li>• ระบบจะตรวจสอบรูปแบบและขนาดไฟล์</li>
                <li>• ข้อมูลจะถูกอัพเดตหลังจากนำเข้าสำเร็จ</li>
                <li>• รองรับไฟล์ขนาดไม่เกิน 10MB</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
