"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Play, RefreshCw } from "lucide-react"
import OptimizationResultTab from "./OptimizationResultTab"

interface ProductSelectionTabProps {
  productsData: any
  loading: boolean
  onRefresh: () => void
}

export default function ProductSelectionTab({ productsData, loading, onRefresh }: ProductSelectionTabProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [optimizationData, setOptimizationData] = useState<any>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  // Select all products
  const selectAll = () => {
    if (productsData) {
      setSelectedProducts(Object.keys(productsData))
    }
  }

  // Clear all selections
  const clearAll = () => {
    setSelectedProducts([])
  }

  // Mock optimization function
  const runOptimization = async () => {
    if (selectedProducts.length === 0) {
      alert('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ')
      return
    }

    setOptimizing(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock optimization results based on selected products
    const mockResults = {
      selected_products: selectedProducts,
      optimization_results: {
        total_time: selectedProducts.length * 8.5,
        total_cost: selectedProducts.length * 12500,
        efficiency: Math.round(85 + Math.random() * 10),
        schedule: selectedProducts.map((product, index) => ({
          product_id: product,
          start_time: index * 8,
          duration: 8,
          formulation: `f${index + 1}`
        }))
      },
      summary: {
        products_optimized: selectedProducts.length,
        time_saved: selectedProducts.length * 1.2,
        cost_saved: selectedProducts.length * 850
      }
    }
    
    setOptimizationData(mockResults)
    setOptimizing(false)
    setShowResults(true)
  }

  // Reset to product selection view
  const backToSelection = () => {
    setShowResults(false)
    setOptimizationData(null)
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
                  แสดงผลการปรับปรุงสำหรับสินค้า: {selectedProducts.join(', ')}
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
          <CardTitle className="text-xl text-purple-700">เลือกสินค้าสำหรับการปรับปรุงประสิทธิภาพ</CardTitle>
          <CardDescription>
            เลือกสินค้าที่ต้องการนำไปทำการปรับปรุงประสิทธิภาพการผลิต
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Selection Controls */}
      <Card>
        <CardContent className="pt-6">
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
              disabled={selectedProducts.length === 0 || optimizing}
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

          {/* Products Grid */}
          {productsData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.keys(productsData).map((productId) => {
                const isSelected = selectedProducts.includes(productId)
                return (
                  <div
                    key={productId}
                    onClick={() => toggleProduct(productId)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{productId.toUpperCase()}</h3>
                        <p className="text-sm text-gray-600">
                          {productsData[productId].length} formulations
                        </p>
                      </div>
                      {isSelected ? (
                        <CheckCircle className="h-6 w-6 text-purple-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Show formulations as badges */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {productsData[productId].slice(0, 3).map((formulation: string) => (
                        <Badge key={formulation} variant="outline" className="text-xs">
                          {formulation}
                        </Badge>
                      ))}
                      {productsData[productId].length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{productsData[productId].length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">ไม่พบข้อมูลสินค้า</p>
              <Button onClick={onRefresh} variant="outline" className="mt-4">
                โหลดข้อมูลใหม่
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">วิธีการใช้งาน:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>1. เลือกสินค้าที่ต้องการปรับปรุงประสิทธิภาพโดยคลิกที่การ์ดสินค้า</li>
            <li>2. สินค้าที่เลือกจะแสดงด้วยสีม่วงและมีเครื่องหมายถูก</li>
            <li>3. คลิก "เริ่มปรับปรุงประสิทธิภาพ" เพื่อเริ่มการคำนวณ</li>
            <li>4. ผลลัพธ์จะแสดงในรูปแบบเดียวกับหน้า Time Optimization</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
