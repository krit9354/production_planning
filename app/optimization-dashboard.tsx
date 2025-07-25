"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, DollarSign, Package, Settings } from "lucide-react"
import TimeOptimizationTab from "@/components/TimeOptimizationTab"
import CostOptimizationTab from "@/components/CostOptimizationTab"
import CustomAdjustmentTab from "@/components/CustomAdjustmentTab"

export default function OptimizationDashboard() {
  const [activeTab, setActiveTab] = useState("time")
  const [timeOptimizationData, setTimeOptimizationData] = useState<any>(null)
  const [costOptimizationData, setCostOptimizationData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch time optimization data from API
  const fetchTimeOptimizationData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('http://localhost:8000/time')
      console.log("Time Optimization Data:", response.data)
      setTimeOptimizationData(response.data)
    } catch (err) {
      setError('ไม่สามารถดึงข้อมูลจาก API ได้ จะใช้ข้อมูลตัวอย่างแทน')
      console.error('Error fetching time optimization data:', err)
      // Fallback to mock data if API fails
      setTimeOptimizationData(null) // Component will use its own mock data
    } finally {
      setLoading(false)
    }
  }

  // Fetch cost optimization data from API
  const fetchCostOptimizationData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('http://localhost:8000/cost')
      console.log("Cost Optimization Data:", response.data)
      setCostOptimizationData(response.data)
    } catch (err) {
      setError('ไม่สามารถดึงข้อมูลจาก API ได้ จะใช้ข้อมูลตัวอย่างแทน')
      console.error('Error fetching cost optimization data:', err)
      // Fallback to mock data if API fails
      setCostOptimizationData(null) // Component will use its own mock data
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchTimeOptimizationData()
    fetchCostOptimizationData()
  }, [])

  // Loading state
  if (loading && !timeOptimizationData && !costOptimizationData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Production Optimization Dashboard</h1>
          <p className="text-gray-600">แดชบอร์ดสำหรับแสดงผลการปรับปรุงประสิทธิภาพการผลิต</p>
          
          {/* Error message */}
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mx-auto max-w-md">
              <div className="flex items-center justify-between">
                <p className="text-sm">{error}</p>
                <button 
                  onClick={() => {
                    if (activeTab === "time") {
                      fetchTimeOptimizationData()
                    } else if (activeTab === "cost") {
                      fetchCostOptimizationData()
                    }
                  }}
                  className="ml-3 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'กำลังโหลด...' : 'ลองใหม่'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Optimization
              </TabsTrigger>
              <TabsTrigger value="cost" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost Optimization
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Custom Adjustment
              </TabsTrigger>
            </TabsList>
            
            {/* Refresh button for tabs */}
            {activeTab === "time" && (
              <button
                onClick={fetchTimeOptimizationData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังโหลด...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    รีเฟรชข้อมูล
                  </>
                )}
              </button>
            )}
            
            {activeTab === "cost" && (
              <button
                onClick={fetchCostOptimizationData}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังโหลด...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4" />
                    รีเฟรชข้อมูล
                  </>
                )}
              </button>
            )}
{/*             
            {activeTab === "custom" && (
              <button
                onClick={() => {}}
                disabled={loading}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                ปรับแต่งอัตราส่วน
              </button>
            )} */}
          </div>

          <TabsContent value="time" className="space-y-6">
            <TimeOptimizationTab 
              data={timeOptimizationData} 
              loading={loading} 
              onRefresh={fetchTimeOptimizationData}
            />
          </TabsContent>

          <TabsContent value="cost" className="space-y-6">
            <CostOptimizationTab 
              data={costOptimizationData} 
              loading={loading} 
              onRefresh={fetchCostOptimizationData}
            />
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <CustomAdjustmentTab 
              loading={loading} 
              onRefresh={() => {}}
              timeData={timeOptimizationData}
              costData={costOptimizationData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
