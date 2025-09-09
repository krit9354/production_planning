"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Truck, Plus, Trash2, Save, RefreshCw, Trash, Trash2Icon } from "lucide-react"
import { apiEndpoints } from "@/lib/api"
import { DeliveryRow, SyncDeliveryRequest, DeliveryEditorTabProps } from "@/lib/types"

const PULP_TYPES = ["Eucalyptus", "Pulp_A", "Pulp_B", "Pulp_C"]

function formatDate(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function DeliveryEditorTab({ onRefresh }: DeliveryEditorTabProps) {
  const [rows, setRows] = useState<DeliveryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const startDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return formatDate(d)
  }, [])
  const endDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return formatDate(d)
  }, [])

  const fetchDelivery = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)
      const url = apiEndpoints.getDelivery(startDate, endDate)
      const res = await axios.get(url)
      const data = res.data?.data || []
      setRows(data)
    } catch (e: any) {
      console.error("Failed to load delivery", e)
      setError(e?.response?.data?.message || e?.message || "โหลดข้อมูลล้มเหลว")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchDelivery() 
  }, [startDate, endDate])

  const addRow = () => {
    const today = formatDate(new Date())
    setRows(r => [...r, { date: today, pulp_type: "Eucalyptus", amount: 0 }])
  }

  const removeRow = (idx: number) => {
    setRows(r => r.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, patch: Partial<DeliveryRow>) => {
    setRows(r => r.map((row, i) => i === idx ? { ...row, ...patch } : row))
  }

  const saveAll = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      // Basic validation
      for (const row of rows) {
        if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
          setError(`รูปแบบวันที่ไม่ถูกต้อง: ${row.date}`)
          setSaving(false)
          return
        }
        if (!row.pulp_type) {
          setError("กรุณาเลือกชนิดเยื่อ")
          setSaving(false)
          return
        }
        if (isNaN(Number(row.amount)) || Number(row.amount) < 0) {
          setError(`จำนวนต้องเป็นตัวเลขที่ไม่ติดลบ: ${row.amount}`)
          setSaving(false)
          return
        }
      }

      const payload: SyncDeliveryRequest = { 
        items: rows.map(r => ({ 
          ...r, 
          amount: Number(r.amount) || 0 
        })) 
      }
      
      const res = await axios.post(apiEndpoints.syncDelivery(), payload)
      if (res.data?.success) {
        setSuccessMessage(`บันทึกสำเร็จ! ${res.data.inserted || 0} รายการ`)
        await fetchDelivery()
        onRefresh?.()
      } else {
        setError(res.data?.message || "บันทึกไม่สำเร็จ")
      }
    } catch (e: any) {
      console.error("Failed to sync delivery", e)
      setError(e?.response?.data?.message || e?.message || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  const clearMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Editor
          </CardTitle>
          <CardDescription>
            แก้ไขข้อมูลการส่งมอบเยื่อ แล้วกดบันทึกครั้งเดียว (ระบบจะลบข้อมูลเดิมทั้งหมดและเพิ่มข้อมูลใหม่)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Control buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              onClick={fetchDelivery} 
              disabled={loading} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </Button>
            <Button 
              onClick={addRow} 
              variant="secondary"
              className="flex items-center gap-2 hover:bg-gray-200"
            >
              <Plus className="h-4 w-4" />
              เพิ่มแถว
            </Button>
            <Button 
              onClick={saveAll} 
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2" 
              disabled={saving || loading}
            >
              <Save className="h-4 w-4" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
            </Button>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <Button variant="ghost" size="sm" onClick={clearMessages}>×</Button>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
              <span className="text-sm">{successMessage}</span>
              <Button variant="ghost" size="sm" onClick={clearMessages}>×</Button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">วันที่ (YYYY-MM-DD)</TableHead>
                  <TableHead className="w-32">ชนิดเยื่อ</TableHead>
                  <TableHead className="w-32 text-right">จำนวน (ตัน)</TableHead>
                  <TableHead className="w-24 text-center">ลบ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={`${row.date}-${row.pulp_type}-${idx}`}>
                    <TableCell>
                      <input
                        type="date"
                        className="border rounded px-2 py-1 w-full text-sm"
                        value={row.date}
                        onChange={(e) => updateRow(idx, { date: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        className="border rounded px-2 py-1 w-full text-sm"
                        value={row.pulp_type}
                        onChange={(e) => updateRow(idx, { pulp_type: e.target.value })}
                      >
                        {PULP_TYPES.map(pt => (
                          <option key={pt} value={pt}>{pt}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="border rounded px-2 py-1 w-full text-right text-sm"
                        value={row.amount}
                        onChange={(e) => updateRow(idx, { amount: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeRow(idx)}
                        className="w-8 h-8 p-0 rounded-full hover:bg-red-50 hover:text-red-600 text-gray-400 transition-all duration-200 hover:scale-110 group"
                      >
                        <Trash2 className="h-4 w-4 group-hover:animate-pulse" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          กำลังโหลดข้อมูล...
                        </div>
                      ) : (
                        <div>
                          <p>ไม่มีข้อมูลการส่งมอบ</p>
                          <p className="text-xs mt-1">แสดงช่วง {startDate} ถึง {endDate}</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {rows.length > 0 && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p>รวม {rows.length} รายการ</p>
              <p>ช่วงวันที่: {startDate} ถึง {endDate}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
