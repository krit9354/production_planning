"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Package, Settings, Target, Database, FileSpreadsheet, Truck } from "lucide-react"
import OptimizationResultTab from "@/components/OptimizationResultTab"
import CustomAdjustmentTab from "@/components/CustomAdjustmentTab"
import ProductSelectionTab from "@/components/ProductSelectionTab"
import ScenarioCompareTab from "@/components/ScenarioCompareTab"
import ScenarioResultTab from "@/components/ScenarioResultTab"
import ImportExportTab from "@/components/ImportExportTab"
import DeliveryEditorTab from "@/components/DeliveryEditorTab"
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
  const [error, setError] = useState<string | null>(null)
  
  // Loading states for different API calls
  const [loadingOptimization, setLoadingOptimization] = useState(false)
  const [loadingOriginalPlan, setLoadingOriginalPlan] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingScenarioData, setLoadingScenarioData] = useState(false)
  const [loadingInitializer, setLoadingInitializer] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  
  // Scenario states
  const [scenarios, setScenarios] = useState<string[]>([])
  const [selectedScenario, setSelectedScenario] = useState<string>("")
  const [loadingScenarios, setLoadingScenarios] = useState(false)

  // Warnings state
  const [warnings, setWarnings] = useState<string[]>([])
  const [loadingWarnings, setLoadingWarnings] = useState(false)

  // Fetch time optimization data from API
  const fetchOptimizationData = async () => {
    try {
      setLoadingOptimization(true)
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
      setLoadingOptimization(false)
    }
  }

  // Fetch original plan data from API
  const fetchOriginalPlanData = async () => {
    try {
      setLoadingOriginalPlan(true)
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
      setLoadingOriginalPlan(false)
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
      setLoadingScenarioData(true)
      setError(null)
      const response = await axios.get(apiEndpoints.getScenario(scenarioName))
      console.log('Scenario API Response:', response.data)
      setScenarioData(response.data)
    } catch (error) {
      console.error("Error fetching scenario data:", error)
      setError('get_scenario')
      setScenarioData(null)
    } finally {
      setLoadingScenarioData(false)
    }
  }

  // Fetch products data from API
  const fetchProductsData = async () => {
    try {
      setLoadingProducts(true)
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
      setLoadingProducts(false)
    }
  }

  // Fetch warnings data
  const fetchWarnings = async () => {
    try {
      setLoadingWarnings(true)
      const response = await axios.get(apiEndpoints.getWarnings())
      if (response.data && Array.isArray(response.data.data.warnings)) {
        setWarnings(response.data.data.warnings)
      } else {
        setWarnings([])
      }
    } catch (error: unknown) {
      console.error('Error fetching warnings:', error)
      setWarnings([])
    } finally {
      setLoadingWarnings(false)
    }
    console.log("Warnings state:", warnings)
  }

  // Initialize optimizer first
  const initializeOptimizer = async () => {
    try {
      setLoadingInitializer(true)
      console.log("🚀 Initializing optimizer...")
      const response = await axios.post(apiEndpoints.initializeOptimizer())
      console.log("✅ Optimizer initialized:", response.data)
      return true
    } catch (error: unknown) {
      console.error('❌ Error initializing optimizer:', error)
      setError('initialize_optimizer')
      return false
    } finally {
      setLoadingInitializer(false)
    }
  }

  // Load all data after optimizer is initialized
  const loadAllData = async () => {
    try {
      await Promise.all([
        fetchOptimizationData(),
        fetchOriginalPlanData(),
        fetchProductsData(),
        fetchScenarios(),
        fetchWarnings()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  // Load data on component mount
  useEffect(() => {
    const initialize = async () => {
      console.log("🔄 Starting application initialization...")
      setIsInitializing(true)
      
      // Step 1: Initialize optimizer first
      const optimizerReady = await initializeOptimizer()
      
      if (optimizerReady) {
        console.log("✅ Optimizer ready, loading other data...")
        // Step 2: Load all other data after optimizer is ready
        await loadAllData()
        console.log("✅ All data loaded successfully")
      } else {
        console.warn("⚠️ Optimizer initialization failed, loading data anyway...")
        // Try to load data even if optimizer fails
        await loadAllData()
      }
      
      setIsInitializing(false)
    }
    
    initialize()
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

  // Loading state - show loading if initializing or any major component is loading
  const isLoading = isInitializing || loadingOptimization || loadingOriginalPlan || loadingProducts || loadingScenarioData
  
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">
            {loadingInitializer ? "กำลังเริ่มต้นระบบ..." : "กำลังโหลดข้อมูล..."}
          </p>
          <div className="mt-2 text-sm text-gray-500">
            {loadingInitializer && "🚀 กำลังเตรียมเครื่องมือ optimization..."}
            {loadingOptimization && "📊 กำลังโหลดข้อมูล optimization..."}
            {loadingOriginalPlan && "📋 กำลังโหลดแผนเดิม..."}
            {loadingProducts && "🏭 กำลังโหลดข้อมูลผลิตภัณฑ์..."}
            {loadingScenarios && "📂 กำลังโหลดรายการ scenario..."}
            {loadingWarnings && "⚠️ กำลังตรวจสอบคำเตือน..."}
          </div>
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
          
          {/* Loading indicators for individual components */}
          {(loadingOptimization || loadingOriginalPlan || loadingProducts || loadingScenarios || loadingWarnings) && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg mx-auto max-w-md">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <div className="text-sm">
                  {loadingOptimization && "กำลังโหลดข้อมูล Optimization..."}
                  {loadingOriginalPlan && "กำลังโหลดแผนเดิม..."}
                  {loadingProducts && "กำลังโหลดข้อมูลผลิตภัณฑ์..."}
                  {loadingScenarios && "กำลังโหลดรายการ Scenario..."}
                  {loadingWarnings && "กำลังตรวจสอบคำเตือน..."}
                  {loadingScenarioData && "กำลังโหลดข้อมูล Scenario..."}
                </div>
              </div>
            </div>
          )}
          
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
                    } else if (error === "initialize_optimizer") {
                      initializeOptimizer()
                    }
                  }}
                  className="ml-3 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'กำลังโหลด...' : 'ลองใหม่'}
                </button>
              </div>
            </div>
          )}
          
          {/* Warnings message */}
          {warnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mx-auto max-w-4xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-2">⚠️ คำเตือน:</h3>
                  <ul className="text-sm space-y-1 pl-4">
                    {warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid grid-cols-4 w-full bg-gray-50">
              <TabsTrigger value="original" className="flex items-center gap-2 hover:scale-110 transition-all">
                <Package className="h-4 w-4" />
                Original Plan
                {loadingOriginalPlan && <div className="animate-spin rounded-full h-3 w-3 border-b border-current ml-1"></div>}
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center gap-2 hover:scale-110 transition-all">
                <Clock className="h-4 w-4" />
                Optimization
                {loadingOptimization && <div className="animate-spin rounded-full h-3 w-3 border-b border-current ml-1"></div>}
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2 hover:scale-110 transition-all">
                <Target className="h-4 w-4" />
                Product Selection
                {loadingProducts && <div className="animate-spin rounded-full h-3 w-3 border-b border-current ml-1"></div>}
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2 hover:scale-110 transition-all">
                <Settings className="h-4 w-4" />
                Custom Adjustment
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex items-center gap-2 hover:scale-110 transition-all">
                <Package className="h-4 w-4" />
                Scenario Compare
              </TabsTrigger>
              <TabsTrigger value="scenario" className="flex items-center gap-2 hover:scale-110 transition-all">
                <Database className="h-4 w-4" />
                Scenario Results
                {(loadingScenarios || loadingScenarioData) && <div className="animate-spin rounded-full h-3 w-3 border-b border-current ml-1"></div>}
              </TabsTrigger>
              <TabsTrigger value="import-export" className="flex items-center gap-2 hover:scale-110 transition-all">
                <FileSpreadsheet className="h-4 w-4" />
                Import/Export
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center gap-2 hover:scale-110 transition-all">
                <Truck className="h-4 w-4" />
                Delivery
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="optimization" className="space-y-6">
            <OptimizationResultTab 
              data={optimizationData} 
              loading={loadingOptimization} 
              onRefresh={fetchOptimizationData}
            />
          </TabsContent>

          <TabsContent value="scenario" className="space-y-6">
            <ScenarioResultTab
              scenarios={scenarios}
              selectedScenario={selectedScenario}
              onSelectedScenarioChange={setSelectedScenario}
              loadingScenarios={loadingScenarios}
              onDeleteScenario={handleDeleteScenario}
              scenarioData={scenarioData}
              loading={loadingScenarioData}
              onRefresh={() => fetchScenarioData(selectedScenario)}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <ProductSelectionTab 
              productsData={productsData}
              loading={loadingProducts} 
              onRefresh={fetchScenarios}
            />
          </TabsContent>

          <TabsContent value="original" className="space-y-6">
            <OptimizationResultTab 
              data={originalPlanData} 
              loading={loadingOriginalPlan} 
              onRefresh={fetchOriginalPlanData}
            />
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <CustomAdjustmentTab 
              loading={isLoading} 
              onRefresh={fetchScenarios}
              scenarios={scenarios}
              loadingScenarios={loadingScenarios}
            />
          </TabsContent>

          <TabsContent value="compare" className="space-y-6">
            <ScenarioCompareTab 
              loading={isLoading} 
              onRefresh={() => {}}
              scenarios={scenarios}
              loadingScenarios={loadingScenarios}
            />
          </TabsContent>

          <TabsContent value="import-export" className="space-y-6">
            <ImportExportTab 
              loading={isLoading} 
              onRefresh={() => {
                // Refresh all data when import is successful
                fetchOptimizationData()
                fetchOriginalPlanData()
                fetchProductsData()
                fetchScenarios()
              }}
            />
          </TabsContent>

          <TabsContent value="delivery" className="space-y-6">
            <DeliveryEditorTab 
              onRefresh={() => {
                // Optionally refresh related data
                fetchOptimizationData()
                fetchOriginalPlanData()
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
