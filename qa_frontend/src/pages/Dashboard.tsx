import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Beaker,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowRight,
  Download,
  Plus,
  Play,
  X
} from 'lucide-react';
import { api } from '../api';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modal open state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state for creating a new testcase
  const [newTcTitle, setNewTcTitle] = useState('');
  const [newTcFilePath, setNewTcFilePath] = useState('tests/test_auth.py');
  const [newTcSuite, setNewTcSuite] = useState('1');

  // Load real testcases
  const { data: testcases, isLoading: loadingCases } = useQuery({
    queryKey: ['testcases'],
    queryFn: api.getTestCases,
    placeholderData: [],
    refetchOnWindowFocus: false,
  });

  // Load real test runs for historical contexts
  const { data: testRuns } = useQuery({
    queryKey: ['testruns'],
    queryFn: () => api.getTestRuns(10, 0),
    placeholderData: [],
    refetchOnWindowFocus: false,
  });

  // Create Test Case Mutation
  const createTestCaseMutation = useMutation({
    mutationFn: api.createTestCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testcases'] });
      setNewTcTitle('');
      setIsModalOpen(false);
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to register test case');
    }
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

  const handleCreateTestCase = () => {
    if (!newTcTitle.trim()) return;
    createTestCaseMutation.mutate({
      suite_id: parseInt(newTcSuite),
      title: newTcTitle,
      status: 'active',
      file_path: newTcFilePath,
    });
  };

  const handleRunTestCase = (id: number) => {
    triggerTestMutation.mutate(id);
  };

  // SVG Trend Chart Dimensions and Data points
  const days = Array.from({ length: 12 }, (_, i) => `Point ${i + 1}`);
  const passPoints = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const failPoints = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // Map data to SVG coordinates (width=600, height=200)
  const getSvgPath = (points: number[], maxVal: number) => {
    if (points.length < 2) return 'M 0 170';
    const xStep = 600 / (points.length - 1);
    return points.map((p, i) => {
      const x = i * xStep;
      const y = 170 - (p / (maxVal || 1)) * 140; // Scale to fit height nicely
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const passPath = getSvgPath(passPoints, 120);
  const failPath = getSvgPath(failPoints, 120);

  // Stats summary counts
  const totalCasesCount = (testcases || []).length;
  const totalRunsCount = (testRuns || []).length;
  const latestRunId = testRuns && testRuns.length > 0 ? testRuns[0].id : 1;
  const failedRuns = testRuns?.filter(r => r.status === 'failed') || [];

  return (
    <div className="dashboard-container">
      {/* 4 TOP WIDGET CARDS */}
      <div className="dashboard-grid-3col">
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

        {/* PASSED TESTS */}
        <div className="stat-card-green">
          <div className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-[#8C8C8C] uppercase block">PASSED RUNS</span>
              <h2 className="text-3xl font-bold text-[#52C41A] tracking-tight mt-1">
                {testRuns?.filter(r => r.status === 'completed').length || 0}
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
                {testRuns?.filter(r => r.status === 'failed').length || 0}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#FF4D4F]">
              <XCircle size={20} className="stroke-[2]" />
            </div>
          </div>
        </div>

      </div>

      {/* CENTER GRIDS: LINE CHART & LATEST EXECUTION */}
      <div className="dashboard-grid-3col">
        {/* EXECUTION TREND CHART */}
        <div className="dashboard-chart-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F1F1F]">Execution Trend</h3>
                <span className="text-xs text-[#8C8C8C] font-semibold">Performance comparison (Last 30 Days)</span>
              </div>

              {/* Legends */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1677FF]" />
                  <span className="text-[#595959]">Pass Rate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D4F] border-2 border-dashed border-[#FF4D4F]" />
                  <span className="text-[#595959]">Failures</span>
                </div>
              </div>
            </div>

            {/* Custom SVG Graph (Extremely robust, light, high performance) */}
            <div className="relative pt-4">
              <svg
                viewBox="0 0 600 180"
                className="w-full h-44 overflow-visible"
              >
                {/* Horizontal Guide Grid Lines */}
                <line x1="0" y1="20" x2="600" y2="20" stroke="#F0F0F0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="600" y2="70" stroke="#F0F0F0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="600" y2="120" stroke="#F0F0F0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="170" x2="600" y2="170" stroke="#EAEAEA" strokeWidth="1.5" />

                {/* Blue Pass Path */}
                <path
                  d={passPath}
                  fill="none"
                  stroke="#1677FF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Red Fail Path */}
                <path
                  d={failPath}
                  fill="none"
                  stroke="#FF4D4F"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Node Circles for Last Data Point */}
                <circle cx="600" cy={180 - (108 / 120) * 140} r="5" fill="#1677FF" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="600" cy={180 - (22 / 120) * 140} r="4" fill="#FF4D4F" stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>

              {/* Day Coordinates labels */}
              <div className="flex justify-between text-[11px] text-[#8C8C8C] font-semibold mt-2 px-1">
                {days.map((d, idx) => (
                  <span key={idx}>{idx % 2 === 0 ? d : ''}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* LATEST RUN SUMMARY */}
        <div className="dashboard-latest-card">
          <div className="space-y-6 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-base font-bold text-[#1F1F1F]">Latest Execution</h3>
              <span className="text-xs text-[#8C8C8C] font-semibold">Immediate health status metrics</span>
            </div>

            {/* STATUS BADGE CONTAINER */}
            <div className="dashboard-latest-status-badge">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${testRuns?.[0]?.status === 'completed' ? 'bg-green-50 text-[#52C41A]' : 'bg-red-50 text-[#FF4D4F]'}`}>
                {testRuns?.[0]?.status === 'completed' ? <CheckCircle size={28} className="stroke-[2.5]" /> : <XCircle size={28} className="stroke-[2.5]" />}
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#8C8C8C] tracking-wider uppercase block">LAST COMPLETED STATUS</span>
                <span className={`text-lg font-black tracking-wide block ${testRuns?.[0]?.status === 'completed' ? 'text-[#52C41A]' : 'text-[#FF4D4F]'}`}>
                  {testRuns?.[0]?.status?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>

            {/* METRICS DUO GRID */}
            <div className="dashboard-metrics-grid">
              <div className="dashboard-metric-box">
                <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">DURATION</span>
                <span className="text-sm font-semibold text-[#1F1F1F] block mt-1">
                  {testRuns?.[0]?.started_at && testRuns?.[0]?.finished_at ? 
                    `${Math.floor((new Date(testRuns[0].finished_at).getTime() - new Date(testRuns[0].started_at).getTime()) / 1000)}s` : '--'}
                </span>
              </div>
              <div className="dashboard-metric-box">
                <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">ENVIRONMENT</span>
                <span className="text-sm font-semibold text-[#1F1F1F] block mt-1">--</span>
              </div>
            </div>

            {/* CAPACITY PROGRESS BAR */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#595959]">
                <span>CONCURRENCY NODE LIMIT</span>
                <span className="text-[#1677FF]">0% Capacity</span>
              </div>
              <div className="dashboard-progress-track">
                <div className="dashboard-progress-bar" style={{ width: '0%' }} />
              </div>
            </div>

            {/* DETAILED LOG CTA */}
            <button
              className="dashboard-button-primary-full"
              onClick={() => navigate(`/testrun/${latestRunId}`)}
              disabled={!testRuns || testRuns.length === 0}
            >
              <span>View Detailed Log</span>
              <ArrowRight size={14} />
            </button>
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

          {/* Floating Action Button (Add Test Case) */}
          <div className="absolute right-4 bottom-4 z-10">
            <button
              className="w-12 h-12 bg-[#1677FF] hover:bg-[#1677FF]/90 hover:scale-105 active:scale-95 text-white shadow-md transition-all rounded-full flex items-center justify-center"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE NEW TEST CASE DIALOG OVERLAY */}
      {isModalOpen && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal-container">
            {/* Close trigger */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#8C8C8C] hover:text-[#1F1F1F] transition-colors"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-[#1F1F1F] font-bold text-lg">Register New Test Case</h3>
              <span className="text-xs text-[#8C8C8C] font-semibold">Deploy a new Pytest script to target suite routes</span>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C8C8C]">TEST CASE TITLE</label>
                <input
                  placeholder="e.g. Verify Payment Integration"
                  value={newTcTitle}
                  onChange={(e) => setNewTcTitle(e.target.value)}
                  className="dashboard-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C8C8C]">PYTEST FILE PATH</label>
                <input
                  placeholder="e.g. api/test_payment.py"
                  value={newTcFilePath}
                  onChange={(e) => setNewTcFilePath(e.target.value)}
                  className="dashboard-input"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#8C8C8C]">PARENT TEST SUITE</label>
                <select
                  value={newTcSuite}
                  onChange={(e) => setNewTcSuite(e.target.value)}
                  className="dashboard-select"
                >
                  <option value="1">Authentication API</option>
                  <option value="2">Shopping Checkout</option>
                  <option value="3">User Administration</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#F0F0F0]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="font-bold text-xs h-9 px-4 bg-zinc-100 text-zinc-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                className="bg-[#1677FF] text-white font-bold text-xs h-9 px-4 rounded-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                onClick={handleCreateTestCase}
                disabled={createTestCaseMutation.isPending}
              >
                {createTestCaseMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Register Test</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
