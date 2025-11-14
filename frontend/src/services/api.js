// API Configuration and Services

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

// ========================================
// Helper function to get auth headers
// ========================================

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ========================================
// Authentication utility functions
// ========================================

export const authUtils = {
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },
  
  getToken: () => {
    return localStorage.getItem('access_token');
  },
  
  clearToken: () => {
    localStorage.removeItem('access_token');
  }
};

// ========================================
// Generic API Functions
// ========================================

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    // Prepare headers
    let headers = {
      ...getAuthHeaders(), // Always include auth headers
      ...options.headers,
    };

    // Only set Content-Type to JSON if body is not FormData
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        console.warn('Authentication failed - redirecting to login');
        localStorage.removeItem('access_token');
        // Optionally redirect to login page
        window.location.href = '/';
        return;
      }
      
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
    return fetchAPI(`/statistics/kpis${query}`);
  },

  /**
   * Get responses per program
   * @param {string} dataset - 'egresados' or 'profesores'
   * @param {Object} filters - { version }
   */
  getResponsesPerProgram: async (dataset = 'egresados', filters = {}) => {
    const params = new URLSearchParams({ dataset });
    if (filters.version) params.append('version', filters.version);
    
    return fetchAPI(`/statistics/responses-per-program?${params.toString()}`);
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
    
    return fetchAPI(`/statistics/question-analysis?${params.toString()}`);
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
    
    return fetchAPI(`/statistics/questions-batch-analysis?${params.toString()}`, {
      method: 'POST'
    });
  },

  /**
   * Get available columns/questions
   * @param {string} dataset - 'egresados' or 'profesores'
   */
  getAvailableColumns: async (dataset) => {
    const params = new URLSearchParams({ dataset });
    return fetchAPI(`/statistics/available-columns?${params.toString()}`);
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
    
    return fetchAPI(`/statistics/satisfaction-analysis?${params.toString()}`);
  },

  /**
   * Get list of available programs
   */
  getPrograms: async () => {
    return fetchAPI('/statistics/programs');
  },
};

// ========================================
// Auth API
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
        // Don't include Authorization header for login
      },
      body: formData.toString(),
    });
  },

  getCurrentUser: async () => {
    // Token will be automatically included by fetchAPI
    return fetchAPI('/users/me');
  },

  refreshToken: async () => {
    // Token will be automatically included by fetchAPI
    return fetchAPI('/auth/refresh', {
      method: 'POST',
    });
  },

  logout: () => {
    // Clear the token from localStorage
    localStorage.removeItem('access_token');
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

export const UserListAPI = {
  getUserList: () => {
    // Token will be automatically included by fetchAPI
    return fetchAPI("/users/");
  },

  createUser: (userData) => {
    // Token will be automatically included by fetchAPI
    return fetchAPI("/users/create", {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  updateUser: (userId, userData) => {
    // Token will be automatically included by fetchAPI
    return fetchAPI(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  getSchools: () => {
    // Fetch available schools for dropdown
    return fetchAPI("/users/schools/");
  },

  getUsersForDropdown: () => {
    // Fetch users for dropdown (simplified format)
    return fetchAPI("/users/users-for-dropdown/");
  }
};

// =========================================
// Process API
// =========================================

export const ProcListAPI = {
  getProcList: () => {
    // Token will be automatically included by fetchAPI
    return fetchAPI("/process/all");
  },

  createProc: (processData) => {
    // For file uploads, we need FormData and let fetchAPI handle auth headers
    return fetchAPI("/process/create", {
      method: 'POST',
      body: processData // Should be FormData object
    });
  },

  downloadFile: (filePath) => {
    // Token will be automatically included by fetchAPI
    return fetchAPI(`/process/${filePath}`);
  }
};