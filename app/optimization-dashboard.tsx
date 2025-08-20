"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Package, Settings, Target, Database, FileSpreadsheet } from "lucide-react"
import OptimizationResultTab from "@/components/OptimizationResultTab"
import CustomAdjustmentTab from "@/components/CustomAdjustmentTab"
import ProductSelectionTab from "@/components/ProductSelectionTab"
import ScenarioCompareTab from "@/components/ScenarioCompareTab"
import ScenarioSelector from "@/components/ScenarioSelector"
import ImportExportTab from "@/components/ImportExportTab"
import { apiEndpoints } from "@/lib/api"
import { 
  OptimizationData, 
  ProductsData, 
} from "@/lib/types"


export default function OptimizationDashboard() {
  const [activeTab, setActiveTab] = useState("original")
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null)
  const [originalPlanData, setOriginalPlanData] = useState<OptimizationData | null>(null)
  const [scenarioData, setScenarioData] = useState<OptimizationData | null>(null)
  const [productsData, setProductsData] = useState<ProductsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Scenario states
  const [scenarios, setScenarios] = useState<string[]>([])
  const [selectedScenario, setSelectedScenario] = useState<string>("")
  const [loadingScenarios, setLoadingScenarios] = useState(false)

  // Fetch time optimization data from API
  const fetchOptimizationData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(apiEndpoints.getTime())
      console.log("Time Optimization Data:", response.data)
      setOptimizationData(response.data)
    } catch (err) {
      setError('optimization')
      console.error('Error fetching time optimization data:', err)
      // Fallback to mock data if API fails
      setOptimizationData(null) // Component will use its own mock data
    } finally {
      setLoading(false)
    }
  }

  // Fetch original plan data from API
  const fetchOriginalPlanData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(apiEndpoints.getOriginalPlan())
      console.log("Original Plan Data:", response.data)
      setOriginalPlanData(response.data)
    } catch (err) {
      setError('original_plan')
      console.error('Error fetching original plan data:', err)
      // Fallback to mock data if API fails
      setOriginalPlanData(null)
    } finally {
      setLoading(false)
    }
  }

  // Fetch scenarios from API
  const fetchScenarios = async () => {
    setLoadingScenarios(true)
    try {
      const response = await axios.get(apiEndpoints.getScenarios())
      if (response.data && Array.isArray(response.data)) {
        setScenarios(response.data)
      }
    } catch (error) {
      setError('scenarios')
      console.error('Error fetching scenarios:', error)
      setScenarios([])
    } finally {
      setLoadingScenarios(false)
    }
  }

  // Fetch scenario data from API
  const fetchScenarioData = async (scenarioName: string) => {
    if (!scenarioName) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(apiEndpoints.getScenario(scenarioName))
      console.log('Scenario API Response:', response.data)
      setScenarioData(response.data)
    } catch (error) {
      console.error("Error fetching scenario data:", error)
      setError('get_scenario')
      setScenarioData(null)
    } finally {
      setLoading(false)
    }
  }

  // Fetch products data from API
  const fetchProductsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(apiEndpoints.getFormula())
      console.log("Products Data:", response.data)
      setProductsData(response.data.data)
    } catch (err) {
      setError('get_formula')
      console.error('Error fetching products data:', err)
      // Fallback to mock data
      setProductsData({})
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchOptimizationData()
    fetchOriginalPlanData()
    fetchProductsData()
    fetchScenarios()
  }, [])

  // Auto load scenario data when selected scenario changes
  useEffect(() => {
    if (selectedScenario) {
      fetchScenarioData(selectedScenario)
    }
  }, [selectedScenario])

  // Handle delete scenario
  const handleDeleteScenario = async (scenarioName: string) => {
    // Confirm deletion
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบ scenario "${scenarioName}"?`)) {
      return
    }

    try {
      setLoadingScenarios(true)
      const response = await axios.delete(apiEndpoints.deleteScenario(scenarioName))
      
      if (response.status === 200) {
        // Remove scenario from list
        setScenarios(prev => prev.filter(s => s !== scenarioName))
        
        // Clear selected scenario if it was deleted
        if (selectedScenario === scenarioName) {
          setSelectedScenario("")
          setScenarioData(null)
        }
        
        // Show success message
        alert(`ลบ scenario "${scenarioName}" เรียบร้อยแล้ว`)
      }
    } catch (error: unknown) {
      console.error('Error deleting scenario:', error)
      
      // Handle different error types
      if (typeof error === 'object' && error !== null) {
        const apiError = error as { 
          response?: { 
            status?: number; 
            data?: { detail?: string } 
          }; 
          message?: string 
        }
        
        if (apiError.response?.status === 404) {
          alert(`ไม่พบ scenario "${scenarioName}"`)
        } else if (apiError.response?.status === 403) {
          alert(`ไม่มีสิทธิ์ในการลบ scenario "${scenarioName}"`)
        } else {
          const errorMessage = apiError.response?.data?.detail || apiError.message || 'ข้อผิดพลาดไม่ทราบสาเหตุ'
          alert(`เกิดข้อผิดพลาดในการลบ scenario: ${errorMessage}`)
        }
      } else {
        alert(`เกิดข้อผิดพลาดในการลบ scenario: ${String(error)}`)
      }
    } finally {
      setLoadingScenarios(false)
    }
  }

  // Loading state
  if (loading && !optimizationData && !scenarioData) {
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
                <p className="text-sm">เกิดข้อผิดพลาดในการดึงข้อมูล {error}</p>
                <button 
                  onClick={() => {
                    if (error === "optimization") {
                      fetchOptimizationData()
                    } else if (error === "get_formula") {
                      fetchProductsData()
                    } else if (error === "original_plan") {
                      fetchOriginalPlanData()
                    } else if (error === "scenarios") {
                      fetchScenarios()
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
            <TabsList className="grid grid-cols-7">
              <TabsTrigger value="original" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Original Plan
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Optimization
              </TabsTrigger>
              <TabsTrigger value="scenario" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Scenario Results
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Product Selection
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Custom Adjustment
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Scenario Compare
              </TabsTrigger>
              <TabsTrigger value="import-export" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Import/Export
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="optimization" className="space-y-6">
            <OptimizationResultTab 
              data={optimizationData} 
              loading={loading} 
              onRefresh={fetchOptimizationData}
            />
          </TabsContent>

          <TabsContent value="scenario" className="space-y-6">
            <ScenarioSelector
              scenarios={scenarios}
              selectedScenario={selectedScenario}
              onSelectedScenarioChange={setSelectedScenario}
              loadingScenarios={loadingScenarios}
              onDeleteScenario={handleDeleteScenario}
              scenarioData={scenarioData}
              loading={loading}
              onRefresh={() => fetchScenarioData(selectedScenario)}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <ProductSelectionTab 
              productsData={productsData}
              loading={loading} 
              onRefresh={fetchProductsData}
            />
          </TabsContent>

          <TabsContent value="original" className="space-y-6">
            <OptimizationResultTab 
              data={originalPlanData} 
              loading={loading} 
              onRefresh={fetchOriginalPlanData}
            />
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <CustomAdjustmentTab 
              loading={loading} 
              onRefresh={fetchScenarios}
            />
          </TabsContent>

          <TabsContent value="compare" className="space-y-6">
            <ScenarioCompareTab 
              loading={loading} 
              onRefresh={() => {}}
            />
          </TabsContent>

          <TabsContent value="import-export" className="space-y-6">
            <ImportExportTab 
              loading={loading} 
              onRefresh={() => {
                // Refresh all data when import is successful
                fetchOptimizationData()
                fetchOriginalPlanData()
                fetchProductsData()
                fetchScenarios()
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
