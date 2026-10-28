import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Beaker,
  CheckCircle,
  XCircle,
  Download,
  Play,
  Activity
} from 'lucide-react';
import { api } from '../api';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load real testcases
  const { data: testcases, isLoading: loadingCases } = useQuery({
    queryKey: ['testcases'],
    queryFn: api.getTestCases,
    placeholderData: [],
    refetchOnWindowFocus: false,
  });

  // Load real test runs for historical contexts.
  // Fetch a large window so summary stats reflect the full history,
  // while the "Recent Test Runs" table below still renders only the latest few.
  const { data: testRuns } = useQuery({
    queryKey: ['testruns'],
    queryFn: () => api.getTestRuns(1000, 0),
    placeholderData: [],
    refetchOnWindowFocus: false,
  });

  // Load real test suites
  const { data: suites } = useQuery({
    queryKey: ['testsuites'],
    queryFn: api.getTestSuites,
    placeholderData: [],
    refetchOnWindowFocus: false,
  });

  // Trigger Run Test Mutation
  const triggerTestMutation = useMutation({
    mutationFn: api.triggerTestRun,
    onSuccess: (data) => {
      // Invalidate queries to ensure UI updates seamlessly
      queryClient.invalidateQueries({ queryKey: ['testruns'] });
      queryClient.invalidateQueries({ queryKey: ['testcases'] });
      navigate(`/testrun/${data.test_run_id}`);
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to execute test run');
    }
  });

  const handleRunTestCase = (id: number) => {
    triggerTestMutation.mutate(id);
  };

  // Stats summary counts (computed across the full run history)
  const totalCasesCount = (testcases || []).length;

  // Only the latest 10 runs are shown in the "Recent Test Runs" table
  const recentRuns = (testRuns || []).slice(0, 10);

  // Show the most recent failing runs (capped) in the "Top Failing Tests" table
  const failedRuns = (testRuns?.filter(r => r.status === 'failed') || []).slice(0, 10);

  const passedRunsCount = testRuns?.filter(r => r.status === 'completed').length || 0;
  const failedRunsCount = testRuns?.filter(r => r.status === 'failed').length || 0;
  const totalRunsCount = passedRunsCount + failedRunsCount;
  const successRate = totalRunsCount > 0 ? Math.round((passedRunsCount / totalRunsCount) * 100) : 100;

  return (
    <div className="dashboard-container">
      {/* 4 TOP WIDGET CARDS */}
      <div className="dashboard-grid-4col">
        {/* TOTAL TESTS */}
        <div className="stat-card-blue">
          <div className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-[#8C8C8C] uppercase block">TOTAL TEST CASES</span>
              <h2 className="text-3xl font-bold text-[#1F1F1F] tracking-tight mt-1">
                {loadingCases ? '...' : totalCasesCount}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#1677FF]">
              <Beaker size={20} className="stroke-[2]" />
            </div>
          </div>
        </div>

        {/* SUCCESS RATE */}
        <div className="stat-card-yellow">
          <div className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-[#8C8C8C] uppercase block">SUCCESS RATE</span>
              <h2 className="text-3xl font-bold text-[#FAAD14] tracking-tight mt-1">
                {successRate}%
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center text-[#FAAD14]">
              <Activity size={20} className="stroke-[2]" />
            </div>
          </div>
        </div>

        {/* PASSED TESTS */}
        <div className="stat-card-green">
          <div className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-[#8C8C8C] uppercase block">PASSED RUNS</span>
              <h2 className="text-3xl font-bold text-[#52C41A] tracking-tight mt-1">
                {passedRunsCount}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-[#52C41A]">
              <CheckCircle size={20} className="stroke-[2]" />
            </div>
          </div>
        </div>

        {/* FAILED TESTS */}
        <div className="stat-card-red">
          <div className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-[#8C8C8C] uppercase block">FAILED RUNS</span>
              <h2 className="text-3xl font-bold text-[#FF4D4F] tracking-tight mt-1">
                {failedRunsCount}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#FF4D4F]">
              <XCircle size={20} className="stroke-[2]" />
            </div>
          </div>
        </div>

      </div>

      {/* MAIN SPLIT GRID: Recent Executions & Suite Health */}
      <div className="dashboard-grid-3col">
        
        {/* RECENT EXECUTIONS (Col-span 2) */}
        <div className="dashboard-chart-card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1F1F1F]">Recent Test Runs</h3>
              <span className="text-xs text-[#8C8C8C] font-semibold">Latest test executions across all suites</span>
            </div>
          </div>
          
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="dashboard-table-header-row">
                  <th className="py-3.5 px-4 font-bold rounded-l-lg">ID</th>
                  <th className="py-3.5 px-4 font-bold">Test Case</th>
                  <th className="py-3.5 px-4 font-bold">Started At</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold rounded-r-lg text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {(!recentRuns || recentRuns.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#8C8C8C] font-semibold">
                      No executions found.
                    </td>
                  </tr>
                ) : (
                  recentRuns.map(run => (
                    <tr key={run.id} className="hover:bg-[#FAFAFA]/70 transition-colors">
                      <td className="py-4 px-4 text-sm font-semibold text-[#595959]">
                        TR-{run.id}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <span 
                            className="text-sm font-semibold text-[#1F1F1F] hover:text-[#1677FF] cursor-pointer"
                            onClick={() => navigate(`/testrun/${run.id}`)}
                          >
                            {run.test_case?.title || `TC-${run.test_case_id}`}
                          </span>
                          <span className="text-[11px] text-[#8C8C8C] font-medium block mt-0.5">
                            {run.test_case?.file_path || 'Automated Suite'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-[#595959]">
                        {run.started_at ? new Date(run.started_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          run.status === 'completed' ? 'bg-green-50 text-[#52C41A]' :
                          run.status === 'failed' ? 'bg-red-50 text-[#FF4D4F]' :
                          run.status === 'running' ? 'bg-blue-50 text-[#1677FF] animate-pulse' :
                          'bg-zinc-100 text-zinc-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            run.status === 'completed' ? 'bg-[#52C41A]' :
                            run.status === 'failed' ? 'bg-[#FF4D4F]' :
                            run.status === 'running' ? 'bg-[#1677FF]' :
                            'bg-zinc-400'
                          }`} />
                          {run.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          className="text-[#1677FF] hover:bg-blue-50 px-2.5 py-1 rounded-md transition-colors text-xs font-bold"
                          onClick={() => navigate(`/testrun/${run.id}`)}
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUITE HEALTH / SUMMARY (Col-span 1) */}
        <div className="dashboard-latest-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#1F1F1F]">Suite Health</h3>
            <span className="text-xs text-[#8C8C8C] font-semibold">Test suite stability and distribution</span>
          </div>

          <div className="space-y-5 pt-2">
            {(!suites || suites.length === 0) ? (
              <div className="text-center py-6 text-xs text-[#8C8C8C] font-semibold">
                No suites configured.
              </div>
            ) : (
              suites.map(suite => {
                const suiteCases = suite.test_cases || [];
                const passedCount = suiteCases.filter(c => c.recent_result?.status === 'passed').length;
                const failedCount = suiteCases.filter(c => c.recent_result?.status === 'failed').length;
                const total = suiteCases.length;
                const runCount = suiteCases.filter(c => c.recent_result).length;
                
                const isUntested = runCount === 0;
                const suiteSuccessRate = isUntested ? 0 : Math.round((passedCount / runCount) * 100);
                
                const textColorClass = isUntested
                  ? 'text-[#8C8C8C]'
                  : suiteSuccessRate >= 80
                    ? 'text-[#52C41A]'
                    : suiteSuccessRate >= 50
                      ? 'text-[#FAAD14]'
                      : 'text-[#FF4D4F]';
                      
                const barColorClass = isUntested
                  ? 'bg-zinc-200'
                  : suiteSuccessRate >= 80
                    ? 'bg-[#52C41A]'
                    : suiteSuccessRate >= 50
                      ? 'bg-[#FAAD14]'
                      : 'bg-[#FF4D4F]';
                
                return (
                  <div key={suite.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#1F1F1F] block">{suite.name}</span>
                        <span className="text-[10px] text-[#8C8C8C] font-semibold">
                          {passedCount}/{total} passed · {failedCount} failing
                        </span>
                      </div>
                      <span className={`text-xs font-extrabold ${textColorClass}`}>
                        {isUntested ? '0%' : `${suiteSuccessRate}%`}
                      </span>
                    </div>
                    
                    <div className="dashboard-progress-track">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                        style={{ width: `${suiteSuccessRate}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>



      {/* TOP FAILING TESTS TABLE */}
      <div className="dashboard-table-card">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1F1F1F]">Top Failing Tests</h3>
              <span className="text-xs text-[#8C8C8C] font-semibold">Recurring execution blockages prioritized by system risk</span>
            </div>

            <button
              className="text-xs font-semibold text-[#595959] border border-[#EDEDED] rounded-lg px-3 py-1.5 bg-white hover:bg-[#FAFAFA] flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="dashboard-table-header-row">
                  <th className="py-3.5 px-4 font-bold rounded-l-lg">Test Name</th>
                  <th className="py-3.5 px-4 font-bold text-center">Fail Count</th>
                  <th className="py-3.5 px-4 font-bold">Last Run</th>
                  <th className="py-3.5 px-4 font-bold rounded-r-lg">Stability Meter</th>
                  <th className="py-3.5 px-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {failedRuns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#8C8C8C] font-semibold">
                      No failing tests found in the latest runs.
                    </td>
                  </tr>
                ) : (
                  failedRuns.map(run => (
                    <tr key={run.id} className="hover:bg-[#FAFAFA]/70 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <span className="status-dot bg-[#FF4D4F] mt-1.5" />
                          <div>
                            <span className="text-sm font-semibold text-[#1F1F1F] block hover:text-[#1677FF] cursor-pointer">
                              {run.test_case?.title || `TC-${run.test_case_id}`}
                            </span>
                            <span className="text-[11px] text-[#8C8C8C] font-medium block mt-0.5">Automated Suite</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-sm font-bold text-[#FF4D4F]">1</td>
                      <td className="py-4 px-4 text-xs font-semibold text-[#595959]">
                        {run.started_at ? new Date(run.started_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-4 px-4 w-48">
                        <div className="flex items-center gap-2">
                          <div className="dashboard-progress-track">
                            <div className="bg-[#FF4D4F] h-full rounded-full" style={{ width: '0%' }} />
                          </div>
                          <span className="text-[11px] font-extrabold text-[#FF4D4F]">0%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          className="text-[#1677FF] hover:bg-blue-50 p-1.5 rounded-md transition-colors"
                          title="Run case"
                          onClick={() => run.test_case_id && handleRunTestCase(run.test_case_id)}
                        >
                          <Play size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
