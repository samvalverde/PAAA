// API Configuration and Services

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';
const AGENT_API = 'http://localhost:8000';

// ========================================
// Helper function to get auth headers
// ========================================

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Reports API (backend) - returns binary PDF
export const ReportsAPI = {
  generatePDF: async (payload) => {
    const token = localStorage.getItem('access_token');
    const url = `${API_BASE_URL}/reports/pdf`;

    const headers = {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`PDF generation failed: ${response.status} ${text}`);
    }

    return response; // caller will handle blob()
  }
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

async function fetchAPI(endpoint, options = {}, flag = true) {
  let url = "";
  if (flag){
    url =`${API_BASE_URL}${endpoint}`;
  } else {
    url = `${API_BASE_URL}${endpoint}`;
  }

  
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

  getProcById: (processId) => {
    // Get a specific process by ID
    return fetchAPI(`/process/id/${processId}`);
  },

  updateProc: (processId, updateData) => {
    // Update a specific process by ID
    return fetchAPI(`/process/id/${processId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  getProcFiles: (processId) => {
    // Get files for a specific process from MinIO
    return fetchAPI(`/process/id/${processId}/files`);
  },

  createProc: (processData) => {
    // For file uploads, we need FormData and let fetchAPI handle auth headers
    return fetchAPI("/process/create", {
      method: 'POST',
      body: processData // Should be FormData object
    });
  },

  downloadFile: async (filePath) => {
    // For file downloads, we need to handle binary data, not JSON
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/process/${filePath}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response; // Return the response object directly for blob handling
  },

  uploadFile: (fileData) => {
    // For file uploads only (without creating a process)
    return fetchAPI("/process/upload-file", {
      method: 'POST',
      body: fileData // Should be FormData object
    });
  }
};

export const AgentAPI = {
  loadEgresados: (type, data)=>{
    return fetchAPI(`/carga/${type}/minio`, {
      method: 'POST',
      body: data
    }, false);
  },

  // ETL Load from MinIO to Database
  loadFromMinIO: (dataset, programa, version = null, filename = null) => {
    const formData = new FormData();
    formData.append('programa', programa);
    if (version) formData.append('version', version);
    if (filename) formData.append('filename', filename);

    return fetch(`http://localhost:8000/carga/${dataset}/minio`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      body: formData
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    }).catch(error => {
      console.error('ETL Load error:', error);
      throw error;
    });
  },

  // Analytics endpoints
  getAnalytics: async (payload) => {
    try {
      const response = await fetch('http://localhost:8000/agente/resultados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Analytics error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics request failed:', error);
      throw error;
    }
  },

  generateNarrative: (payload) => {
    return fetch('http://localhost:8000/agente/redactar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
  },

  getPostgradosAnalysis: (programa) => {
    return fetch(`http://localhost:8000/analisis/posgrados?programa=${programa}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
  }
}

// =========================================
// Audit API
// =========================================

export const AuditAPI = {
  getAllAudits: () => {
    // Token will be automatically included by fetchAPI
    return fetchAPI("/audit/all");
  },

  getAuditsByUser: (userId) => {
    // Token will be automatically included by fetchAPI
    return fetchAPI(`/audit/${userId}`);
  },

  // Log audit action by ID
  logAction: (actionData) => {
    return fetchAPI("/audit/log", {
      method: "POST",
      body: JSON.stringify(actionData)
    });
  },

  // Log audit action by name (easier to use)
  logActionByName: (actionTypeName, description, schoolId = null) => {
    return fetchAPI("/audit/log-by-name", {
      method: "POST",
      body: JSON.stringify({
        action_type_name: actionTypeName,
        description: description,
        school_id: schoolId
      })
    });
  },

  // Get available action types
  getActionTypes: () => {
    return fetchAPI("/audit/action-types");
  }
};