"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Play, RefreshCw, Info } from "lucide-react"
import OptimizationResultTab from "./OptimizationResultTab"
import { apiEndpoints } from "@/lib/api"
import { ProductsData, OptimizationData, TargetPercentagesData, TargetPercentagesResponse } from "@/lib/types"

interface ProductSelectionTabProps {
  productsData: ProductsData | null
  loading: boolean
  onRefresh: () => void
}

interface DefaultSelectionData {
  selected_products: string[]
  scenario_info: {
    id: number
    name: string
    time: string
  } | null
}

export default function ProductSelectionTab({ productsData, loading, onRefresh }: ProductSelectionTabProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [scenarioName, setScenarioName] = useState<string>("")
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [defaultSelectionInfo, setDefaultSelectionInfo] = useState<DefaultSelectionData | null>(null)
  const [loadingDefaults, setLoadingDefaults] = useState(false)
  const [targetPercentages, setTargetPercentages] = useState<TargetPercentagesData>({})
  const [loadingTargets, setLoadingTargets] = useState(false)

  // Load target percentages from optimize_next_week.json
  const loadTargetPercentages = async () => {
    setLoadingTargets(true)
    try {
      const response = await axios.get<TargetPercentagesResponse>(apiEndpoints.getTargetPercentages())
      
      if (response.data.success && response.data.data) {
        setTargetPercentages(response.data.data)
      }
    } catch (error) {
      console.error('Error loading target percentages:', error)
      // Don't show error to user for target loading failure
    } finally {
      setLoadingTargets(false)
    }
  }

  // Load default selection from latest scenario
  const loadDefaultSelection = async () => {
    setLoadingDefaults(true)
    try {
      const response = await axios.get(apiEndpoints.getDefaultSelection())
      
      if (response.data.success && response.data.data) {
        const defaultData = response.data.data as DefaultSelectionData
        setDefaultSelectionInfo(defaultData)
        setSelectedProducts(defaultData.selected_products || [])
        
        // Set default scenario name based on latest scenario
        if (defaultData.scenario_info?.name) {
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
          setScenarioName(`${defaultData.scenario_info.name}_copy_${timestamp}`)
        }
      }
    } catch (error) {
      console.error('Error loading default selection:', error)
      // Don't show error to user for default loading failure
    } finally {
      setLoadingDefaults(false)
    }
  }

  // Load default selection and target percentages on component mount
  useEffect(() => {
    loadDefaultSelection()
    loadTargetPercentages()
  }, [])

  // Get all available product groups from the new data structure
  const getAllProductGroups = () => {
    if (!productsData) return []
    const productGroups: string[] = []
    
    // รองรับ structure ใหม่ที่เป็น brand -> { "product_group|thickness|channel": data }
    Object.keys(productsData).forEach(brand => {
      Object.keys(productsData[brand]).forEach(combinedKey => {
        // combinedKey มีรูปแบบ "product_group|thickness|channel"
        const productGroupKey = `${brand}|${combinedKey}`
        productGroups.push(productGroupKey)
      })
    })
    return productGroups
  }

  // Toggle product group selection
  const toggleProduct = (productGroupKey: string) => {
    setSelectedProducts(prev => 
      prev.includes(productGroupKey) 
        ? prev.filter(id => id !== productGroupKey)
        : [...prev, productGroupKey]
    )
  }

  // Select all product groups
  const selectAll = () => {
    setSelectedProducts(getAllProductGroups())
  }

  // Clear all selections
  const clearAll = () => {
    setSelectedProducts([])
  }

  // API optimization function
  const runOptimization = async () => {
    if (selectedProducts.length === 0) {
      alert('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ')
      return
    }

    if (!scenarioName.trim()) {
      alert('กรุณาใส่ชื่อ Scenario')
      return
    }

    setOptimizing(true)
    setError(null)
    
    try {
      console.log('🚀 Starting optimization with selected products:', selectedProducts)
      console.log('📝 Scenario name:', scenarioName)

      const requestBody = {
        selected_products: selectedProducts,
        scenario_name: scenarioName.trim(),
      }

      console.log('📤 Request body:', requestBody)

      const response = await axios.post(apiEndpoints.runGeneticAlgorithm(), requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ API Response:', response.data)

      if (response.data.success) {
        setOptimizationData(response.data.json_result);
        setShowResults(true);
        onRefresh();
      } else {
        throw new Error(response.data.message || 'Optimization failed')
      }
    } catch (error: unknown) {
      console.error('❌ Optimization error:', error)
      let errorMessage = 'เกิดข้อผิดพลาดในการปรับปรุงประสิทธิภาพ'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        const apiError = error as { response?: { data?: { message?: string } }; message?: string }
        errorMessage = apiError.response?.data?.message || apiError.message || errorMessage
      }
      
      setError(errorMessage)
      alert(`เกิดข้อผิดพลาด: ${errorMessage}`)
    } finally {
      setOptimizing(false)
    }
  }

  // Reset to product selection view
  const backToSelection = () => {
    setShowResults(false)
    setOptimizationData(null)
    setError(null)
  }

  if (loading && !productsData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      </div>
    )
  }

  // Show optimization results (similar to Time Optimization Tab)
  if (showResults && optimizationData) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-purple-700">ผลการปรับปรุงประสิทธิภาพ - สินค้าที่เลือก</CardTitle>
                <CardDescription>
                  Scenario: <strong>{optimizationData.scenario_name}</strong> | Product Groups ที่เลือก: {selectedProducts.length} กลุ่ม
                </CardDescription>
              </div>
              <Button onClick={backToSelection} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                กลับไปเลือกสินค้า
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Use OptimizationResultTab component to display results */}
        <OptimizationResultTab 
          data={optimizationData} 
          loading={optimizing} 
          onRefresh={runOptimization}
        />
      </div>
    )
  }

  // Product selection interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-purple-700">เลือก Product Groups สำหรับการปรับปรุงประสิทธิภาพ</CardTitle>
          <CardDescription>
            เลือก Product Groups ที่ต้องการนำไปทำการปรับปรุงประสิทธิภาพการผลิต แยกตามประเภทสินค้า
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Selection Controls */}
      <Card>
        <CardContent className="pt-6">
          {/* Scenario Name Input */}
          <div className="mb-6">
            <label htmlFor="scenario-name" className="block text-sm font-medium mb-2">
              ชื่อ Scenario <span className="text-red-500">*</span>
            </label>
            <input
              id="scenario-name"
              type="text"
              placeholder="ใส่ชื่อ scenario"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-64 h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              ชื่อ scenario จะใช้เป็นชื่อไฟล์ผลลัพธ์ที่บันทึก
            </p>
          </div>

          {/* Default Selection Info */}
          {defaultSelectionInfo?.scenario_info && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    โหลดการเลือกเริ่มต้นจาก Scenario ล่าสุด
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>Scenario:</strong> {defaultSelectionInfo.scenario_info.name}
                  </p>
                  <p className="text-xs text-blue-600">
                    <strong>วันที่:</strong> {new Date(defaultSelectionInfo.scenario_info.time).toLocaleString('th-TH')} | 
                    <strong> เลือกแล้ว:</strong> {selectedProducts.length} รายการ
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button 
                      onClick={loadDefaultSelection} 
                      variant="outline" 
                      size="sm"
                      disabled={loadingDefaults}
                      className="text-xs"
                    >
                      {loadingDefaults ? "กำลังโหลด..." : "โหลดใหม่"}
                    </Button>
                    <Button 
                      onClick={() => setSelectedProducts([])} 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                    >
                      ล้างการเลือก
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={selectAll} 
                variant="outline" 
                size="sm"
                disabled={loadingDefaults}
              >
                เลือกทั้งหมด
              </Button>
              <Button 
                onClick={clearAll} 
                variant="outline" 
                size="sm"
                disabled={loadingDefaults}
              >
                ยกเลิกทั้งหมด
              </Button>
              <Badge variant="secondary">
                เลือกแล้ว: {selectedProducts.length} รายการ
              </Badge>
            </div>
            <Button 
              onClick={runOptimization}
              disabled={selectedProducts.length === 0 || optimizing || !scenarioName.trim() || loadingDefaults}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              {optimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังปรับปรุง...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  เริ่มปรับปรุงประสิทธิภาพ
                </>
              )}
            </Button>
          </div>

          {/* Products Grid - Grouped by Brand */}
          {productsData ? (
            <div className="space-y-8">
              {Object.keys(productsData).map((brand) => (
                <div key={brand} className="space-y-4">
                  {/* Brand Header */}
                  <div className="border-b-2 border-purple-200 pb-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-purple-800">{brand}</h2>
                      {targetPercentages[brand] && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          {targetPercentages[brand].brand_percentage}%
                        </Badge>
                      )}
                      {targetPercentages[brand] && (
                        <span className="text-sm text-gray-600">
                          {targetPercentages[brand].brand_total_target.toFixed(1)} ตัน
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {Object.keys(productsData[brand]).length} Product Combinations
                    </p>
                  </div>
                  
                  {/* Product Combinations Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Object.keys(productsData[brand]).map((combinedKey) => {
                      // combinedKey มีรูปแบบ "product_group|thickness|channel"
                      const [productGroup, thickness, channel] = combinedKey.split('|')
                      const formulas = productsData[brand][combinedKey]
                      const productGroupKey = `${brand}|${combinedKey}`
                      const isSelected = selectedProducts.includes(productGroupKey)
                      
                      return (
                        <div
                          key={`${brand}-${combinedKey}`}
                          onClick={() => toggleProduct(productGroupKey)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isSelected 
                              ? 'border-purple-500 bg-purple-50' 
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-sm leading-tight">
                                  {productGroup}
                                </h3>
                                {targetPercentages[brand]?.products[combinedKey] && (
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                    {targetPercentages[brand].products[combinedKey].percentage}%
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mb-1">
                                {thickness && `หนา: ${thickness}`}
                              </p>
                              <p className="text-xs text-gray-500 mb-1">
                                {channel && `ช่องทาง: ${channel}`}
                              </p>
                              <p className="text-xs text-gray-600">
                                {formulas.length} formulas
                              </p>
                            </div>
                            {isSelected ? (
                              <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 ml-2" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                            )}
                          </div>
                          
                          {/* Show formulations as badges */}
                          <div className="flex flex-wrap gap-1">
                            {formulas.slice(0, 3).map((formula: string) => (
                              <Badge key={formula} variant="outline" className="text-xs">
                                {formula}
                              </Badge>
                            ))}
                            {formulas.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{formulas.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">ไม่พบข้อมูล Product Groups</p>
              <Button onClick={onRefresh} variant="outline" className="mt-4">
                โหลดข้อมูลใหม่
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
