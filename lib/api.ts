// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const apiEndpoints = {
  // Scenario management
  getTime: () => `${API_BASE_URL}/time`,
  getOriginalPlan: () => `${API_BASE_URL}/original_plan`,
  getScenarios: () => `${API_BASE_URL}/get_scenarios`,
  getScenario: (scenarioName: string) => `${API_BASE_URL}/get_scenario/${scenarioName}`,
  deleteScenario: (scenarioName: string) => `${API_BASE_URL}/delete_scenario/${scenarioName}`,
  
  // Formula and optimization
  getFormula: () => `${API_BASE_URL}/get_formula`,
  runGeneticAlgorithm: () => `${API_BASE_URL}/run_genetic_algorithm`,
  evaluateCustomIndividual: () => `${API_BASE_URL}/evaluate_custom_individual`,
  
  // Optimizer status
  optimizerStatus: () => `${API_BASE_URL}/optimizer_status`,
  initializeOptimizer: () => `${API_BASE_URL}/initialize_optimizer`,
  
  // Import/Export
  exportExcel: () => `${API_BASE_URL}/export-excel`,
  importExcel: () => `${API_BASE_URL}/import-excel`,
  
  // Scenario save
  saveScenario: () => `${API_BASE_URL}/save_scenario`,
  
  // Warnings
  getWarnings: () => `${API_BASE_URL}/get_warnings`,
  
  // Default selection
  getDefaultSelection: () => `${API_BASE_URL}/get_default_selection`,
  
  // Actual inventory
  getActualInventory: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const queryString = params.toString();
    return `${API_BASE_URL}/get_actual_inventory${queryString ? `?${queryString}` : ''}`;
  },
  
  // Target percentages
  getTargetPercentages: () => `${API_BASE_URL}/get_target_percentages`,
};

export { API_BASE_URL };
