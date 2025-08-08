"use client"

import { useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Play, RefreshCw } from "lucide-react"
import OptimizationResultTab from "./OptimizationResultTab"
import { apiEndpoints } from "@/lib/api"
import { ProductsData, OptimizationData } from "@/lib/types"

interface ProductSelectionTabProps {
  productsData: ProductsData | null
  loading: boolean
  onRefresh: () => void
}

export default function ProductSelectionTab({ productsData, loading, onRefresh }: ProductSelectionTabProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [scenarioName, setScenarioName] = useState<string>("")
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get all available product groups from the new data structure
  const getAllProductGroups = () => {
    if (!productsData) return []
    const productGroups: string[] = []
    Object.keys(productsData).forEach(productType => {
      Object.keys(productsData[productType]).forEach(productGroup => {
        const productGroupKey = `${productType}|${productGroup}`
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
        setShowResults(true)
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

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button onClick={selectAll} variant="outline" size="sm">
                เลือกทั้งหมด
              </Button>
              <Button onClick={clearAll} variant="outline" size="sm">
                ยกเลิกทั้งหมด
              </Button>
              <Badge variant="secondary">
                เลือกแล้ว: {selectedProducts.length} รายการ
              </Badge>
            </div>
            <Button 
              onClick={runOptimization}
              disabled={selectedProducts.length === 0 || optimizing || !scenarioName.trim()}
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

          {/* Products Grid - Grouped by Type */}
          {productsData ? (
            <div className="space-y-8">
              {Object.keys(productsData).map((productType) => (
                <div key={productType} className="space-y-4">
                  {/* Product Type Header */}
                  <div className="border-b-2 border-purple-200 pb-2">
                    <h2 className="text-xl font-bold text-purple-800">{productType}</h2>
                    <p className="text-sm text-gray-600">
                      {Object.keys(productsData[productType]).length} Product Groups
                    </p>
                  </div>
                  
                  {/* Product Groups Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Object.keys(productsData[productType]).map((productGroupName) => {
                      const formulas = productsData[productType][productGroupName]
                      const productGroupKey = `${productType}|${productGroupName}`
                      const isSelected = selectedProducts.includes(productGroupKey)
                      
                      return (
                        <div
                          key={`${productType}-${productGroupName}`}
                          onClick={() => toggleProduct(productGroupKey)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isSelected 
                              ? 'border-purple-500 bg-purple-50' 
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm leading-tight mb-1">
                                {productGroupName}
                              </h3>
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
