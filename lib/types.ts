// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  json_result?: T
}

// Error Types
export interface ApiError {
  message: string
  code?: string | number
  details?: string
  stack?: string
}

export interface NetworkError extends ApiError {
  status?: number
  statusText?: string
}

export interface ValidationError extends ApiError {
  field?: string
  value?: unknown
}

// Type guard for error objects
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'message' in error
}

// Product and Material Types
export interface PulpRatios {
  Pulp_A: number
  Pulp_B: number
  Pulp_C: number
  Eucalyptus: number
  เยื่อกระดาษ?: number
}

export interface Product {
  id?: string
  brand?: string
  product_group: string  // เปลี่ยนจาก type เป็น product_group
  thickness?: string
  channel?: string
  name: string
  formula: string
  ratios: PulpRatios
  target_quantity: number
  unit?: string
  is_optimized?: boolean
}

export interface ProductGroup {
  [combinedKey: string]: string[]
}

export interface ProductsData {
  [brand: string]: ProductGroup
}

// Formula Data Types
export interface FormulaData {
  [brand: string]: {
    [combinedKey: string]: string[]
  }
}

// Optimization Data Types
export interface Summary {
  totalDays?: number
  maxPossibleDays?: number
  totalCost?: number
  avgCostPerTon?: number
  actualProduction?: number
  targetProduction?: number
  optimizationType?: string
  fitness?: number
  avgCost?: number
  totalProduction?: number
  successRate?: number
  finalInventory?: {
    pulp_a?: number
    pulp_b?: number
    pulp_c?: number
    eucalyptus?: number
  }
}

export interface Delivery {
  pulp_type: string
  amount: number
  date?: string
}

export interface InventoryItem {
  day: number
  date: string
  inventory: number
  materialA?: number
  materialB?: number
  materialC?: number
  materialD?: number
  eucalyptus?: number
  pulp_a: number
  pulp_b: number
  pulp_c: number
  deliveries: Delivery[]
  delivery_pulp_a?: number
  delivery_pulp_b?: number
  delivery_pulp_c?: number
}

export interface ProductionPlanItem {
  day: number
  date?: string
  product: string
  product_group: [string, string, string, string] // [brand, product_group, thickness, channel]
  formula: string
  quantity: number
  target_quantity: number
  max_product_ratio?: number
  rawMaterials?: Record<string, number>
  pulpMaterials?: Record<string, number>
}

export interface DataPerDay {
  day: number
  cost_per_ton: number
  cost: number
  production_quantity: number
}

export interface OptimizationData {
  scenario_name?: string
  summary?: Summary
  products?: Product[]
  productionPlan?: ProductionPlanItem[]
  inventoryData?: InventoryItem[]
  dataPerDay?: DataPerDay[]
  pulpInventoryFinal?: {
    pulp_a?: number
    pulp_b?: number
    pulp_c?: number
    eucalyptus?: number
  }
}

// Custom Settings Types
export interface CustomPulpRatios {
  Pulp_A: number
  Pulp_B: number
  Pulp_C: number
  Eucalyptus: number
}

export interface CustomSettings {
  formula: string
  pulp_ratios: CustomPulpRatios
}

export interface CustomSettingsData {
  [productKey: string]: CustomSettings
}

export interface CustomOptimizationRequest {
  settings: CustomSettingsData
  scenario_name: string
  description?: string
}

// Target Percentage Types
export interface ProductTargetInfo {
  target_quantity: number
  percentage: number
}

export interface BrandTargetInfo {
  brand_total_target: number
  brand_percentage: number
  products: {
    [combinedKey: string]: ProductTargetInfo
  }
}

export interface TargetPercentagesData {
  [brand: string]: BrandTargetInfo
}

export interface TargetPercentagesResponse {
  success: boolean
  data: TargetPercentagesData
  scenario_info: {
    name: string
    total_target: number
    optimization_date?: string
  } | null
  message: string
}

// API Error Types
export interface ApiError {
  response?: {
    status: number
    data?: {
      detail?: string
      message?: string
    }
  }
  message: string
}

// Component Props Types
export interface OptimizationResultTabProps {
  data: OptimizationData | null
  loading: boolean
  onRefresh: () => void
}

export interface ProductSelectionTabProps {
  productsData: ProductsData | null
  loading: boolean
  onRefresh: () => void
}

export interface CustomAdjustmentTabProps {
  loading: boolean
  onRefresh: () => void
}

export interface ScenarioCompareTabProps {
  loading: boolean
  onRefresh: () => void
}

// Genetic Algorithm Types
export interface GAParams {
  population_size?: number
  generations?: number
  mutation_rate?: number
  selected_products: string[]
  scenario_name: string
}

// Chart Data Types
export interface ChartDataPoint {
  day: number
  [key: string]: number | string | undefined
}

export interface InventoryChartData extends ChartDataPoint {
  eucalyptus: number
  pulp_a: number
  pulp_b: number
  pulp_c: number
  delivery_pulp_a?: number
  delivery_pulp_b?: number
  delivery_pulp_c?: number
}

export interface CostChartData extends ChartDataPoint {
  cost_per_ton: number
  cost: number
  production_quantity: number
}

// Form Types
export interface ScenarioForm {
  name: string
  description?: string
}

// State Types
export interface DashboardState {
  activeTab: string
  optimizationData: OptimizationData | null
  originalPlanData: OptimizationData | null
  scenarioData: OptimizationData | null
  productsData: ProductsData | null
  loading: boolean
  error: string | null
  scenarios: string[]
  selectedScenario: string
  loadingScenarios: boolean
}

// Helper functions for safe calculations
export const safeCalculation = (
  value1: number | undefined,
  value2: number | undefined,
  operation: 'add' | 'subtract' | 'multiply' | 'divide',
  defaultValue: number = 0
): number => {
  const v1 = value1 ?? defaultValue
  const v2 = value2 ?? defaultValue
  
  switch (operation) {
    case 'add': return v1 + v2
    case 'subtract': return v1 - v2
    case 'multiply': return v1 * v2
    case 'divide': return v2 !== 0 ? v1 / v2 : defaultValue
    default: return defaultValue
  }
}

export const safePercentageChange = (
  oldValue: number | undefined,
  newValue: number | undefined
): number => {
  const old = oldValue ?? 0
  const newVal = newValue ?? 0
  
  if (old === 0) return 0
  return ((newVal - old) / old) * 100
}

// Safe display functions for summary data
export const getSafeSummaryValue = (
  data: OptimizationData | null,
  field: 'totalDays' | 'maxPossibleDays' | 'totalCost' | 'avgCostPerTon' | 'actualProduction' | 'targetProduction' | 'fitness' | 'avgCost' | 'totalProduction' | 'successRate',
  defaultValue: number = 0
): number => {
  return (data?.summary?.[field] as number) ?? defaultValue
}

export const formatSafeDifference = (
  value1: OptimizationData | null,
  value2: OptimizationData | null,
  field: 'totalDays' | 'maxPossibleDays' | 'totalCost' | 'avgCostPerTon' | 'actualProduction' | 'targetProduction' | 'fitness' | 'avgCost' | 'totalProduction' | 'successRate',
  isPercentage: boolean = false
): string => {
  const v1 = getSafeSummaryValue(value1, field)
  const v2 = getSafeSummaryValue(value2, field)
  const diff = v1 - v2
  
  if (isPercentage && v1 !== 0) {
    const percentage = (diff / v1) * 100
    return `${diff.toFixed(2)} (${percentage.toFixed(1)}%)`
  }
  
  return diff.toFixed(2)
}

// Chart formatter helper functions
export const formatChartTooltip = (value: number | string, name: string): [string, string] => {
  let displayName = name;
  switch (name) {
    case "eucalyptus":
      displayName = "Eucalyptus คงเหลือ";
      break;
    case "pulp_a":
      displayName = "Pulp A คงเหลือ";
      break;
    case "pulp_b":
      displayName = "Pulp B คงเหลือ";
      break;
    case "pulp_c":
      displayName = "Pulp C คงเหลือ";
      break;
    case "delivery_pulp_a":
      displayName = "ส่งมอบ Pulp A";
      break;
    case "delivery_pulp_b":
      displayName = "ส่งมอบ Pulp B";
      break;
    case "delivery_pulp_c":
      displayName = "ส่งมอบ Pulp C";
      break;
    default:
      displayName = name;
  }
  return [`${parseFloat(String(value)).toFixed(2)} ตัน`, displayName];
}

export const formatCostTooltip = (value: number | string, label: string): [string, string] => {
  return [`฿${parseFloat(String(value)).toLocaleString()}`, label];
}

export const formatProductionTooltip = (value: number | string): [string, string] => {
  return [`${parseFloat(String(value)).toFixed(2)} ตัน`, "ปริมาณการผลิต"];
}
