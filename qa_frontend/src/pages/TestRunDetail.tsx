import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  History, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Terminal,
  Server,
  Image as ImageIcon,
  Tag,
  Maximize2,
  Download,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  Spinner, 
  Button
} from '@heroui/react';
import { api } from '../api';
import '../styles/TestRunDetail.css';

export default function TestRunDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Parse ID
  const runIdNum = id ? parseInt(id) : 1;

  // Load real test run data (results, status, started_at)
  const { data: _testRun } = useQuery({
    queryKey: ['testrun', runIdNum],
    queryFn: () => api.getTestRun(runIdNum),
    refetchInterval: (query) => {
      // Keep polling if the status is pending or running
      const state = query.state.data?.status;
      return (state === 'pending' || state === 'running') ? 1500 : false;
    }
  });

  // Auto Scroll Terminal to bottom when logs arrive
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [_testRun?.logs]);

  // Trigger rerun test mutation
  const rerunMutation = useMutation({
    mutationFn: (testcaseId: number) => api.triggerTestRun(testcaseId),
    onSuccess: (data) => {
      // Invalidate queries to keep lists and run details perfectly synchronized
      queryClient.invalidateQueries({ queryKey: ['testruns'] });
      queryClient.invalidateQueries({ queryKey: ['testcases'] });
      queryClient.invalidateQueries({ queryKey: ['testrun', data.test_run_id] });
      navigate(`/testrun/${data.test_run_id}`);
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to trigger rerun');
    }
  });

  // Extract execution data from first result if available
  const executionData = useMemo(() => {
    const rawData = _testRun?.test_results?.[0]?.execution_data;
    if (rawData) {
      try {
        return JSON.parse(rawData);
      } catch (err) {
        console.error('Failed to parse execution_data', err);
      }
    }
    return null;
  }, [_testRun]);

  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);

  // Extract nested parameters only (filter out raw logs)
  const parametersOnly = useMemo(() => {
    if (!executionData) return null;
    const copy = { ...executionData };
    delete copy.api_interaction_logs;
    if (copy.parameters) {
      return copy.parameters;
    }
    return copy;
  }, [executionData]);

  // Extract captured api logs
  const apiInteractionLogs = useMemo(() => {
    return executionData?.api_interaction_logs || [];
  }, [executionData]);

  // Check if it is a UI test
  const isUiTest = useMemo(() => {
    if (executionData?.parameters?.framework === 'playwright') {
      return true;
    }
    const filePath = _testRun?.test_case?.file_path || '';
    return filePath.includes('ui/') || filePath.endsWith('.spec.ts');
  }, [_testRun, executionData]);

  // Check if test passed
  const isPassed = useMemo(() => {
    return _testRun?.status === 'completed';
  }, [_testRun]);

  // Compute dynamic title & description based on the actual run contents
  const testCaseTitle = useMemo(() => {
    if (_testRun?.test_case?.title) {
      return _testRun.test_case.title;
    }
    const firstResult = _testRun?.test_results?.[0];
    if (firstResult) {
      const parts = firstResult.test_name.split('::');
      return parts[parts.length - 1];
    }
    return 'UserAuthentication_OAuth2_Handshake';
  }, [_testRun]);

  const testCaseDesc = useMemo(() => {
    if (_testRun?.test_case?.expected_result) {
      return `Expected Result: ${_testRun.test_case.expected_result}`;
    }
    const firstResult = _testRun?.test_results?.[0];
    if (firstResult) {
      return `Automated Pytest scenario execution for "${firstResult.test_name}". Run in a sandboxed headless environment with real-time log capturing and database state assertions.`;
    }
    return 'Verifies the full OAuth2 authorization code flow, ensuring correct token exchange and session creation for third-party identity providers.';
  }, [_testRun]);

  // Build high fidelity steps representation dynamically
  const steps = useMemo(() => {
    if (_testRun?.test_results && _testRun.test_results.length > 0) {
      return _testRun.test_results.map((res: any, index: number) => {
        const parts = res.test_name.split('::');
        const testFuncName = parts[parts.length - 1];
        return {
          id: index + 1,
          action: `Execute Pytest assertion: ${testFuncName}`,
          expected: _testRun.test_case?.expected_result || 'Test assertions execute and return exit status 0 (passed)',
          actual: res.status === 'passed' ? 'Passed (Success)' : 'Failed',
          status: res.status === 'passed' ? 'passed' : 'failed',
          duration: `${res.duration.toFixed(3)}s`,
          errorDetail: res.error_message || undefined
        };
      });
    }
    
    // If no results but test run has failed, return an empty array to show proper error panel
    if (_testRun?.status === 'failed') {
      return [];
    }
    
    // Removed mock steps fallback
    return [];
  }, [_testRun]);

  return (
    <div className="trd-container">
      {/* HEADER CONTROL BAR */}
      <div className="trd-header">
        <div className="flex items-center gap-3">
          <Button 
            onPress={() => navigate('/history')}
            className="border border-[#EDEDED] text-[#595959] bg-white hover:bg-[#F5F7FA] w-8 h-8 min-w-8 p-0 rounded-md"
            aria-label="Go Back to History"
          >
            <ArrowLeft size={16} />
          </Button>
          
          <div>
            <div className="trd-meta-header">
              <span className={_testRun?.status === 'completed' ? 'trd-status-passed-badge' : 'trd-status-failed-badge'}>
                {_testRun?.status ? _testRun.status.toUpperCase() : 'PENDING'}
              </span>
              <span className="text-xs text-[#8C8C8C] font-bold">
                ID: {_testRun?.id ? `TR-${_testRun.id}` : 'TR-8842'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-[#1F1F1F] tracking-tight mt-1">
              Test Case: {testCaseTitle}
            </h2>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          <Button 
            className="text-xs font-semibold text-[#595959] border border-[#EDEDED] bg-white h-9 px-4 rounded-md flex items-center justify-center gap-1.5"
            onPress={() => navigate('/history')}
          >
            <History size={14} />
            <span>History</span>
          </Button>
          
          <Button 
            className="trd-rerun-btn"
            onPress={() => {
              const tcId = _testRun?.test_results?.[0]?.test_case_id || 1;
              rerunMutation.mutate(tcId);
            }}
            isDisabled={rerunMutation.isPending}
          >
            {rerunMutation.isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            <span>Rerun Test</span>
          </Button>
        </div>
      </div>

      {/* DESCRIPTION PARAGRAPH */}
      <p className="text-sm text-[#595959] font-medium leading-relaxed max-w-4xl">
        {testCaseDesc}
      </p>

      {/* TWO COLUMN GRID CONTENT */}
      <div className="trd-grid-3col">
        
        {/* LEFT COLUMN: TIMELINE STEPS & SCREENSHOT */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP BY STEP EXECUTION */}
          <Card className="trd-step-card">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                <h3 className="text-sm font-extrabold text-[#1F1F1F]">Step-by-step execution</h3>
                <span className="text-xs text-[#8C8C8C] font-semibold">Total Execution: 4.2s</span>
              </div>

              {/* TIMELINE LIST */}
              <div className="space-y-4 pt-1">
                {steps.length > 0 ? (
                  steps.map((step) => {
                    const isFailed = step.status === 'failed';
                    return (
                      <div 
                        key={step.id}
                        className={isFailed ? 'trd-step-item-failed' : 'trd-step-item-passed'}
                      >
                        {/* Flex header row */}
                        <div className="flex items-start gap-4">
                          {/* Bullet Circle Number */}
                          <div className={isFailed ? 'trd-step-bullet-failed' : 'trd-step-bullet-passed'}>
                            {step.id}
                          </div>

                          {/* Content Grid */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            <div>
                              <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">ACTION</span>
                              <span className="text-sm font-bold text-[#1F1F1F] block mt-0.5">{step.action}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">EXPECTED RESULT</span>
                              <span className="text-xs font-semibold text-[#595959] block mt-0.5 leading-relaxed">{step.expected}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">ACTUAL RESULT</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {isFailed ? (
                                  <>
                                    <XCircle size={14} className="text-[#FF4D4F] flex-shrink-0" />
                                    <span className="text-xs font-extrabold text-[#FF4D4F]">{step.actual}</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={14} className="text-[#52C41A] flex-shrink-0" />
                                    <span className="text-xs font-bold text-[#52C41A]">{step.actual}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stacktrace card if failed */}
                        {isFailed && step.errorDetail && (
                          <div className="trd-step-error-detail">
                            {step.errorDetail}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : _testRun?.status === 'running' || _testRun?.status === 'pending' ? (
                  <div className="p-6 text-center text-xs text-[#8C8C8C] font-semibold">
                    Test is running, waiting for results...
                  </div>
                ) : (
                  <div className="p-6 border border-red-100 bg-red-50/50 rounded-xl text-center space-y-3">
                    <AlertCircle className="mx-auto text-[#FF4D4F]" size={40} />
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-[#1F1F1F]">Test Run Execution Error</h4>
                      <p className="text-xs text-[#595959] max-w-md mx-auto leading-relaxed">
                        The test run environment failed to initialize or pytest crashed before creating any assertion results. 
                        Please inspect the **Terminal Output** on the right side for the full traceback log.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API NETWORK LOGS / NETWORK ACTIVITY */}
          {apiInteractionLogs && apiInteractionLogs.length > 0 && (
            <Card className="trd-step-card">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-[#1677FF]" />
                    <h3 className="text-sm font-extrabold text-[#1F1F1F]">API Network Activity</h3>
                  </div>
                  <span className="text-xs text-[#1677FF] bg-[#1677FF]/10 px-2.5 py-0.5 rounded-full font-bold font-sans">
                    {apiInteractionLogs.length} request(s) captured
                  </span>
                </div>

                {/* API Request List */}
                <div className="space-y-3 pt-1">
                  {apiInteractionLogs.map((log: any, idx: number) => {
                    const isExpanded = expandedRequest === idx;
                    const isSuccess = log.status_code >= 200 && log.status_code < 300;
                    
                    // Format method classes
                    let methodClass = "bg-blue-50 text-blue-600 border border-blue-100";
                    if (log.method === "POST") methodClass = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                    if (log.method === "PUT" || log.method === "PATCH") methodClass = "bg-amber-50 text-amber-600 border border-amber-100";
                    if (log.method === "DELETE") methodClass = "bg-rose-50 text-rose-600 border border-rose-100";

                    // URL parser helper
                    let displayUrl = log.url;
                    try {
                      const parsed = new URL(log.url);
                      displayUrl = parsed.pathname + parsed.search;
                    } catch (e) {}

                    // JSON format helpers
                    const formatJson = (val: any) => {
                      if (!val) return "No payload";
                      if (typeof val === "object") return JSON.stringify(val, null, 2);
                      try {
                        return JSON.stringify(JSON.parse(val), null, 2);
                      } catch (e) {
                        return String(val);
                      }
                    };

                    return (
                      <div 
                        key={idx} 
                        className="border border-[#EDEDED] rounded-xl overflow-hidden bg-white transition-all hover:border-[#BAE0FF]"
                      >
                        {/* Request Summary Strip */}
                        <div 
                          className="flex items-center justify-between p-3.5 cursor-pointer bg-zinc-50/50 hover:bg-zinc-50 select-none"
                          onClick={() => setExpandedRequest(isExpanded ? null : idx)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider font-mono ${methodClass}`}>
                              {log.method}
                            </span>
                            <span className="text-sm font-bold text-[#1F1F1F] truncate font-mono">
                              {displayUrl}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                              isSuccess ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            }`}>
                              HTTP {log.status_code}
                            </span>
                            {isExpanded ? <ChevronUp size={14} className="text-[#8C8C8C]" /> : <ChevronDown size={14} className="text-[#8C8C8C]" />}
                          </div>
                        </div>

                        {/* Request Expansion Body */}
                        {isExpanded && (
                          <div className="p-4 border-t border-[#EDEDED] bg-zinc-50/30 space-y-4 font-mono text-xs text-[#595959]">
                            {/* Request Payload */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">Request Payload</span>
                              <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-48 overflow-y-auto">
                                {formatJson(log.request_body)}
                              </pre>
                            </div>

                            {/* Response Body */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">Response Payload</span>
                              <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-64 overflow-y-auto">
                                {formatJson(log.response_body)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SCREENSHOT VIEW FOR UI TESTS ONLY */}
          {isUiTest && (
            <Card className="trd-screenshot-card">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <h3 className="text-sm font-extrabold text-[#1F1F1F]">
                    {isPassed ? "Screenshot (Passed Status)" : "Screenshot (At Failure)"}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button 
                      className="w-8 h-8 min-w-8 p-0 bg-transparent text-[#595959] hover:bg-zinc-100 rounded-md"
                      aria-label="Maximize screenshot"
                    >
                      <Maximize2 size={14} />
                    </Button>
                    <Button 
                      className="w-8 h-8 min-w-8 p-0 bg-transparent text-[#595959] hover:bg-zinc-100 rounded-md"
                      aria-label="Download screenshot"
                    >
                      <Download size={14} />
                    </Button>
                  </div>
                </div>

                {/* Spectacular Screenshot Container */}
                <div className="trd-screenshot-container">
                  {isPassed ? (
                    <>
                      {/* Simulated UI capture for PASSED state */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600 via-indigo-900 to-slate-950 opacity-95" />
                      
                      {/* Viewport UI lines */}
                      <div className="trd-screenshot-header">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <div className="trd-screenshot-address">
                          {_testRun?.test_case?.file_path?.includes('class') 
                            ? "http://localhost:3000/dashboard/classes" 
                            : _testRun?.test_case?.file_path?.includes('student')
                            ? "http://localhost:3000/dashboard/students"
                            : "http://localhost:3000/dashboard"
                          }
                        </div>
                      </div>

                      {/* Big success icon centered */}
                      <div className="trd-screenshot-overlay">
                        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-500 shadow-lg">
                          <CheckCircle size={48} className="stroke-[2]" />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-black text-white tracking-wide block uppercase">
                            {_testRun?.test_case?.file_path?.includes('class') 
                              ? "CLASSES MANAGEMENT VIEWPORT LOADED" 
                              : _testRun?.test_case?.file_path?.includes('student')
                              ? "STUDENT RECORD DIRECTORY LOADED"
                              : "EDUMASTER PORTAL DASHBOARD STABLE"
                            }
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold font-mono mt-1 block">
                            PORTAL VIEWPORT VALIDATED AND CAPTURED SUCCESSFULLY (HTTP 200 OK)
                          </span>
                        </div>
                      </div>

                      {/* Absolute bottom tags overlay */}
                      <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[10px] text-zinc-400 font-mono font-bold">
                        <span>URL: http://localhost:3000/dashboard</span>
                        <span>Captured At: {new Date(_testRun?.finished_at || Date.now()).toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Simulated UI capture for FAILED state */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black opacity-90 filter blur-xs" />
                      
                      {/* Viewport UI lines */}
                      <div className="trd-screenshot-header">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                        </div>
                        <div className="trd-screenshot-address">
                          https://dev.testops.app/auth/callback?error=server_error
                        </div>
                      </div>

                      {/* Big failure icon centered */}
                      <div className="trd-screenshot-overlay">
                        <div className="trd-screenshot-icon-box">
                          <AlertCircle size={48} className="stroke-[2]" />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-black text-white tracking-wide block">AUTHENTICATION BRIDGE ERROR</span>
                          <span className="text-[10px] text-zinc-400 font-semibold font-mono mt-1 block">CALLBACK STATE VALIDATION MISMATCH</span>
                        </div>
                      </div>

                      {/* Absolute bottom tags overlay matching image */}
                      <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[10px] text-zinc-500 font-mono font-bold">
                        <span>URL: https://dev.testops.app/auth/callback?error=server_error</span>
                        <span>Timestamp: {new Date(_testRun?.finished_at || Date.now()).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: RUN METADATA & LIVE TERMINAL & LABELS */}
        <div className="space-y-6">
          
          {/* ENVIRONMENT VIEWPORT CARD */}
          <Card className="trd-env-card">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#F0F0F0] pb-3">
                <Server size={16} className="text-[#1677FF]" />
                <h3 className="text-sm font-extrabold text-[#1F1F1F]">Environment</h3>
              </div>

              {/* Viewport Card layout representing the screenshot fail layout */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
                {/* Small Screen Mock Frame */}
                <div className="trd-env-mock-frame">
                  {!isUiTest ? (
                    <div className="absolute inset-0 bg-emerald-500/5 flex flex-col items-center justify-center space-y-1">
                      <Server size={24} className="text-emerald-500 stroke-[1.5]" />
                      <div className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-sans">API Online</div>
                    </div>
                  ) : isPassed ? (
                    <div className="absolute inset-0 bg-emerald-500/5 flex flex-col items-center justify-center space-y-1">
                      <ImageIcon size={24} className="text-emerald-500 stroke-[1.5]" />
                      <div className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-sans">UI Captured</div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-red-500/5 flex flex-col items-center justify-center space-y-1">
                      <AlertCircle size={24} className="text-red-500 stroke-[1.5]" />
                      <div className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-sans">Failure Capt.</div>
                    </div>
                  )}
                </div>

                {/* Properties list */}
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-[#8C8C8C]">Browser</span>
                    <span className="text-[#1F1F1F]">--</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8C8C]">OS</span>
                    <span className="text-[#1F1F1F]">--</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8C8C]">Region</span>
                    <span className="text-[#1F1F1F]">--</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8C8C]">Agent ID</span>
                    <span className="text-mono text-[#1677FF]">--</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TERMINAL OUTPUT PORT CARD */}
          <Card className="trd-terminal-card">
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-[#D9F7BE]" />
                  <span className="text-xs font-bold tracking-tight text-zinc-300 font-mono">Terminal Output</span>
                </div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              </div>

              {/* Scroll viewport */}
              <div className="trd-terminal-viewport">
                {/* Real-time and historical log list */}
                {_testRun?.logs?.length === 0 ? (
                  <div className="text-zinc-500 font-mono text-xs italic">
                    Waiting for execution log buffer...
                  </div>
                ) : (
                  _testRun?.logs?.map((line, idx) => (
                    <div key={idx} className="text-zinc-300 font-mono text-xs whitespace-pre-wrap">
                      {line}
                    </div>
                  ))
                )}
                
                {/* Loader status if test is currently running */}
                {(_testRun?.status === 'pending' || _testRun?.status === 'running') && (
                  <div className="text-[#1677FF] font-bold animate-pulse mt-2 flex items-center gap-1.5 text-xs font-mono">
                    <Spinner size="sm" aria-label="Loading execution stream..." />
                    EXECUTING PYTEST AND STREAMING OUTPUT...
                  </div>
                )}

                <div ref={terminalEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* RUNTIME EXECUTION DATA CARD */}
          {parametersOnly && Object.keys(parametersOnly).length > 0 && (
            <Card className="trd-labels-card">
              <CardContent className="p-0 space-y-3">
                <div className="flex items-center gap-2 border-b border-[#F0F0F0] pb-3">
                  <Tag size={15} className="text-[#52C41A]" />
                  <h3 className="text-sm font-extrabold text-[#1F1F1F]">Execution Parameters</h3>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 space-y-2 text-xs font-mono text-[#595959]">
                  {Object.entries(parametersOnly).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-dashed border-zinc-200 pb-1.5 last:border-none last:pb-0">
                      <span className="font-extrabold text-[#1F1F1F] uppercase text-[10px] tracking-wider">{key}</span>
                      <span className="text-[#52C41A] font-extrabold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* LABELS BADGES COMPONENT */}
          <Card className="trd-labels-card">
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center gap-2 border-b border-[#F0F0F0] pb-3">
                <Tag size={15} className="text-[#1677FF]" />
                <h3 className="text-sm font-extrabold text-[#1F1F1F]">Labels</h3>
              </div>

              {/* Flex wrapped badges */}
              <div className="flex flex-wrap gap-2 pt-1 font-semibold text-xs">
                <span className="trd-label-badge-blue">regression</span>
                <span className="trd-label-badge-blue">security</span>
                <span className="trd-label-badge-blue">oauth2</span>
                <span className="trd-label-badge-yellow">p0-blocker</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
