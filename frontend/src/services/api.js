// API Configuration and Services

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

// ========================================
// Generic API Functions
// ========================================

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ========================================
// Statistics API
// ========================================

export const statisticsAPI = {
  /**
   * Get general KPIs
   * @param {Object} filters - { programa, version }
   */
  getKPIs: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.version) params.append('version', filters.version);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/stats/kpis${query}`);
  },

  /**
   * Get responses per program
   * @param {string} dataset - 'egresados' or 'profesores'
   * @param {Object} filters - { version }
   */
  getResponsesPerProgram: async (dataset = 'egresados', filters = {}) => {
    const params = new URLSearchParams({ dataset });
    if (filters.version) params.append('version', filters.version);
    
    return fetchAPI(`/stats/responses-per-program?${params.toString()}`);
  },

  /**
   * Analyze a specific question
   * @param {string} dataset - 'egresados' or 'profesores'
   * @param {string} questionColumn - Column name to analyze
   * @param {Object} filters - { programa, version }
   */
  analyzeQuestion: async (dataset, questionColumn, filters = {}) => {
    const params = new URLSearchParams({ dataset, question_column: questionColumn });
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.version) params.append('version', filters.version);
    
    return fetchAPI(`/stats/question-analysis?${params.toString()}`);
  },

  /**
   * Analyze multiple questions at once
   * @param {string} dataset - 'egresados' or 'profesores'
   * @param {Array<string>} questionColumns - Array of column names
   * @param {Object} filters - { programa, version }
   */
  analyzeQuestionsBatch: async (dataset, questionColumns, filters = {}) => {
    const params = new URLSearchParams({ dataset });
    questionColumns.forEach(col => params.append('question_columns', col));
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.version) params.append('version', filters.version);
    
    return fetchAPI(`/stats/questions-batch-analysis?${params.toString()}`, {
      method: 'POST'
    });
  },

  /**
   * Get available columns/questions
   * @param {string} dataset - 'egresados' or 'profesores'
   */
  getAvailableColumns: async (dataset) => {
    const params = new URLSearchParams({ dataset });
    return fetchAPI(`/stats/available-columns?${params.toString()}`);
  },

  /**
   * Get satisfaction analysis
   * @param {string} dataset - 'egresados' or 'profesores'
   * @param {Object} filters - { programa, version }
   */
  getSatisfactionAnalysis: async (dataset, filters = {}) => {
    const params = new URLSearchParams({ dataset });
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.version) params.append('version', filters.version);
    
    return fetchAPI(`/stats/satisfaction-analysis?${params.toString()}`);
  },

  /**
   * Get list of available programs
   */
  getPrograms: async () => {
    return fetchAPI('/stats/programs');
  },
};

// ========================================
// Auth API (if needed later)
// ========================================

export const authAPI = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return fetchAPI('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
  },

  getCurrentUser: async (token) => {
    return fetchAPI('/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// ========================================
// Health Check
// ========================================

export const healthAPI = {
  checkDatabase: async () => fetchAPI('/health/db'),
  checkDatabaseETL: async () => fetchAPI('/health/db_etl'),
  checkMinio: async () => fetchAPI('/health/minio'),
};

// =========================================
// User API
// =========================================

export const UserListAPI={
  getUserList: ()=>{
    return(fetchAPI("/users/"))
  }
}

export const ProcListAPI={
  getProcList: ()=>{
    return(fetchAPI("/proc/"))
  },

  createProc: ()=>{
    return(fetchAPI("/proc/create"))
  }
}