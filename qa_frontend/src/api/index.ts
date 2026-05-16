import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error handling and toasts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'An unexpected error occurred';
    console.error('[API Error]:', errorMsg, error);
    
    // Global actions: redirect to login if unauthorized
    if (error.response?.status === 401) {
      console.warn('Unauthorized access - redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface TestCase {
  id: number;
  suite_id: number;
  title: string;
  status: 'active' | 'draft';
  file_path: string;
  created_at: string;
}

export interface TestSuite {
  id: number;
  name: string;
  description: string | null;
  test_cases: TestCase[];
}

export interface TestResult {
  id: number;
  test_run_id: number;
  test_name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error_message: string | null;
  log_file_path: string | null;
  created_at: string;
}

export interface TestRun {
  id: number;
  test_case_id?: number | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string | null;
  finished_at: string | null;
  test_results?: TestResult[];
  test_case?: TestCase | null;
}

export interface TestRunHistoryItem {
  id: number;
  display_id: string;
  suite_name: string;
  target_title: string;
  environment: string;
  status: string;
  date_formatted: string;
  duration_formatted: string;
  duration_seconds: number;
}

// API Functions
export const api = {
  // Test Suites
  getTestSuites: async (): Promise<TestSuite[]> => {
    const res = await apiClient.get<APIResponse<TestSuite[]>>('/testsuites');
    return res.data.data;
  },

  // Test Cases
  getTestCases: async (): Promise<TestCase[]> => {
    const res = await apiClient.get<APIResponse<TestCase[]>>('/testcases');
    return res.data.data;
  },
  
  getTestCase: async (id: number): Promise<TestCase> => {
    const res = await apiClient.get<APIResponse<TestCase>>(`/testcases/${id}`);
    return res.data.data;
  },
  
  createTestCase: async (payload: Omit<TestCase, 'id' | 'created_at'>): Promise<TestCase> => {
    const res = await apiClient.post<APIResponse<TestCase>>('/testcases', payload);
    return res.data.data;
  },

  // Test Runs
  triggerTestRun: async (testcaseId: number): Promise<{ test_run_id: number; status: string }> => {
    const res = await apiClient.post<APIResponse<{ test_run_id: number; status: string }>>(`/testruns/${testcaseId}/run`);
    return res.data.data;
  },
  
  getTestRuns: async (limit = 100, offset = 0): Promise<TestRun[]> => {
    const res = await apiClient.get<APIResponse<TestRun[]>>('/testruns', { params: { limit, offset } });
    return res.data.data;
  },

  getTestRunsHistory: async (limit = 100, offset = 0): Promise<TestRunHistoryItem[]> => {
    const res = await apiClient.get<APIResponse<TestRunHistoryItem[]>>('/testruns/history', { params: { limit, offset } });
    return res.data.data;
  },
  
  getTestRun: async (id: number): Promise<TestRun> => {
    const res = await apiClient.get<APIResponse<TestRun>>(`/testruns/${id}`);
    return res.data.data;
  },

  // Authentication
  login: async (payload: any): Promise<any> => {
    const res = await apiClient.post<APIResponse<any>>('/auth/login', payload);
    return res.data.data;
  },

  register: async (payload: any): Promise<any> => {
    const res = await apiClient.post<APIResponse<any>>('/auth/register', payload);
    return res.data.data;
  }
};
