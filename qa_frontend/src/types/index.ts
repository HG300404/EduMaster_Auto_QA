export type TestCaseStatus = 'active' | 'draft';
export type TestRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TestCase {
  id: number;
  suite_id: number;
  title: string;
  status: TestCaseStatus;
  file_path: string;
  created_at: string;
  recent_result?: RecentRunSummary | null;
}

export interface RecentRunSummary {
  test_run_id: number;
  status: 'passed' | 'failed' | 'running' | 'pending';
  run_at: string;
}

export interface TestResult {
  id: number;
  test_run_id: number;
  test_name: string;
  status: 'passed' | 'failed' | 'skipped' | string;
  duration: number;
  error_message: string | null;
  log_file_path: string | null;
  created_at: string;
}

export interface TestRun {
  id: number;
  status: TestRunStatus;
  started_at: string | null;
  finished_at: string | null;
  test_results?: TestResult[];
}

export interface TestSuite {
  id: number;
  name: string;
  description: string | null;
  test_cases?: TestCase[];
}
