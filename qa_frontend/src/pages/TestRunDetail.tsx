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
  Image as ImageIcon,
  Tag,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [screenshotZoom, setScreenshotZoom] = useState(100);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

  const SCREENSHOT_ZOOM_MIN = 50;
  const SCREENSHOT_ZOOM_MAX = 200;
  const SCREENSHOT_ZOOM_STEP = 25;

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
    const stepsData = _testRun?.test_results?.[0]?.steps_data;
    if (stepsData) {
      try {
        return JSON.parse(stepsData);
      } catch (e) {
        console.error('Failed to parse steps_data', e);
      }
    }
    return executionData?.api_interaction_logs || [];
  }, [_testRun, executionData]);

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

  const parsePlaywrightTitle = (testName: string) => {
    if (testName.includes(' › ')) {
      const segments = testName.split(' › ');
      return segments[segments.length - 1];
    }
    const parts = testName.split('::');
    return parts[parts.length - 1];
  };

  // Build high fidelity steps representation dynamically
  const steps = useMemo(() => {
    if (_testRun?.test_results && _testRun.test_results.length > 0) {
      return _testRun.test_results.map((res: any, index: number) => {
        const testFuncName = parsePlaywrightTitle(res.test_name);
        const filePath = _testRun.test_case?.file_path || res.test_name.split('::')[0] || '';
        const fileName = filePath.split('/').pop() || '';
        return {
          id: index + 1,
          index,
          action: isUiTest ? testFuncName : `Execute Pytest assertion: ${testFuncName}`,
          file: fileName,
          expected: _testRun.test_case?.expected_result || 'Test assertions execute and return exit status 0 (passed)',
          actual: res.status === 'passed' ? 'Passed (Success)' : 'Failed',
          status: res.status === 'passed' ? 'passed' : 'failed',
          duration: `${res.duration.toFixed(3)}s`,
          errorDetail: res.error_message || undefined,
          screenshot_path: res.screenshot_path as string | undefined,
        };
      });
    }
    
    // If no results but test run has failed, return an empty array to show proper error panel
    if (_testRun?.status === 'failed') {
      return [];
    }
    
    // Removed mock steps fallback
    return [];
  }, [_testRun, isUiTest]);

  const uiStepTimeline = useMemo(() => {
    if (!isUiTest || !apiInteractionLogs?.length) return [];
    const uiSteps = apiInteractionLogs.filter(
      (log: { method?: string; screenshot_path?: string }) =>
        log.method === 'UI_STEP' && log.screenshot_path
    );
    if (uiSteps.length === 0) return [];
    return uiSteps.map(
      (
        log: { url?: string; screenshot_path?: string; status_code?: number },
        index: number
      ) => ({
        id: index + 1,
        index,
        action: log.url || `Step ${index + 1}`,
        file: '',
        expected: _testRun?.test_case?.expected_result || '',
        actual:
          log.status_code && log.status_code >= 400 ? 'Failed' : 'Passed (Success)',
        status: log.status_code && log.status_code >= 400 ? 'failed' : 'passed',
        duration: '',
        screenshot_path: log.screenshot_path,
      })
    );
  }, [apiInteractionLogs, isUiTest, _testRun]);

  const displaySteps = useMemo(
    () => (uiStepTimeline.length > 0 ? uiStepTimeline : steps),
    [uiStepTimeline, steps]
  );

  const networkLogs = useMemo(
    () =>
      apiInteractionLogs.filter(
        (log: { method?: string }) => log.method !== 'UI_STEP'
      ),
    [apiInteractionLogs]
  );

  const stepScreenshots = useMemo(
    () => displaySteps.filter((s: any) => s.screenshot_path),
    [displaySteps]
  );

  const activeScreenshotPath =
    displaySteps[selectedStepIndex]?.screenshot_path ||
    stepScreenshots[0]?.screenshot_path ||
    _testRun?.test_results?.[0]?.screenshot_path;

  const buildScreenshotUrl = (path?: string) =>
    path ? `${apiBaseUrl}${path}` : undefined;

  useEffect(() => {
    if (selectedStepIndex >= displaySteps.length) {
      setSelectedStepIndex(0);
    }
  }, [displaySteps.length, selectedStepIndex]);

  useEffect(() => {
    setScreenshotZoom(100);
  }, [selectedStepIndex, activeScreenshotPath]);

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
                ID: TR-{_testRun?.id || 'N/A'}
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
              const tcId = _testRun?.test_case_id || _testRun?.test_case?.id || 1;
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
                <span className="text-xs text-[#8C8C8C] font-semibold">
                  Total Execution: {(_testRun?.test_results?.reduce((sum: number, r: any) => sum + (r.duration || 0), 0) || 0).toFixed(2)}s
                </span>
              </div>

              {/* TIMELINE LIST */}
              <div className="space-y-4 pt-1">
                {displaySteps.length > 0 ? (
                  displaySteps.map((step: any) => {
                    const isFailed = step.status === 'failed';
                    const isSelected = step.index === selectedStepIndex;
                    return (
                      <div 
                        key={step.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedStepIndex(step.index)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedStepIndex(step.index);
                          }
                        }}
                        className={`${isFailed ? 'trd-step-item-failed' : 'trd-step-item-passed'} ${
                          isSelected ? 'ring-2 ring-[#1677FF] ring-offset-1' : 'cursor-pointer'
                        }`}
                      >
                        {/* Flex header row */}
                        <div className="flex items-start gap-4">
                          {/* Bullet Circle Number */}
                          <div className={isFailed ? 'trd-step-bullet-failed' : 'trd-step-bullet-passed'}>
                            {step.id}
                          </div>

                          {/* Content Grid (Stacked vertically) */}
                          <div className="flex-1 grid grid-cols-1 gap-3">
                            <div>
                              <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">ACTION</span>
                              <span className="text-sm font-bold text-[#1F1F1F] block mt-0.5 break-words">{step.action}</span>
                              {step.file && (
                                <span className="text-[10px] text-[#1677FF] font-mono mt-0.5 block">File: {step.file}</span>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">EXPECTED RESULT</span>
                              <span className="text-xs font-semibold text-[#595959] block mt-0.5 leading-relaxed break-words">{step.expected}</span>
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

                        {/* Per-step screenshot thumbnail (UI tests) */}
                        {step.screenshot_path && (
                          <div className="mt-4 border border-[#EDEDED] rounded-lg overflow-hidden bg-zinc-50">
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#EDEDED] bg-white">
                              <ImageIcon size={14} className="text-[#1677FF]" />
                              <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider">
                                Step screenshot — {step.action}
                              </span>
                            </div>
                            <img
                              src={buildScreenshotUrl(step.screenshot_path)}
                              alt={`Screenshot: ${step.action}`}
                              className="w-full max-h-48 object-contain object-top bg-zinc-950"
                              onError={(e) => {
                                e.currentTarget.src =
                                  'https://placehold.co/800x400/0f172a/64748b?text=Screenshot+Not+Found';
                              }}
                            />
                          </div>
                        )}

                        {/* Stacktrace card if failed */}
                        {isFailed && step.errorDetail && (
                          <div className="trd-step-error-detail whitespace-pre-wrap overflow-x-auto max-h-96">
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
          {networkLogs && networkLogs.length > 0 && (
            <Card className="trd-step-card">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-[#1677FF]" />
                    <h3 className="text-sm font-extrabold text-[#1F1F1F]">
                      {isUiTest ? "UI Interaction Steps" : "API Network Activity"}
                    </h3>
                  </div>
                  <span className="text-xs text-[#1677FF] bg-[#1677FF]/10 px-2.5 py-0.5 rounded-full font-bold font-sans">
                    {networkLogs.length} {isUiTest ? "step(s)" : "request(s)"} captured
                  </span>
                </div>

                {/* API Request List */}
                <div className="space-y-3 pt-1">
                  {networkLogs.map((log: any, idx: number) => {
                    const isExpanded = expandedRequest === idx;
                    const isSuccess = log.status_code >= 200 && log.status_code < 300;
                    
                    // Format method classes
                    let methodClass = "bg-blue-50 text-blue-600 border border-blue-100";
                    if (log.method === "POST") methodClass = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                    if (log.method === "PUT" || log.method === "PATCH") methodClass = "bg-amber-50 text-amber-600 border border-amber-100";
                    if (log.method === "DELETE") methodClass = "bg-rose-50 text-rose-600 border border-rose-100";
                    if (log.method === "UI_ACTION") methodClass = "bg-purple-50 text-purple-600 border border-purple-100";

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
                              <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">
                                {isUiTest ? "Action Details" : "Request Payload"}
                              </span>
                              <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {formatJson(log.request_body)}
                              </pre>
                            </div>

                            {/* Response Body */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">
                                {isUiTest ? "Action Result" : "Response Payload"}
                              </span>
                              <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
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
          {(activeScreenshotPath || stepScreenshots.length > 0 || isUiTest) && (
            <Card className="trd-screenshot-card">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1F1F1F]">
                      {stepScreenshots.length > 1
                        ? `Screenshots (${stepScreenshots.length} steps)`
                        : isPassed
                          ? 'Screenshot (Passed)'
                          : 'Screenshot (At Failure)'}
                    </h3>
                    {displaySteps[selectedStepIndex] && (
                      <p className="text-xs text-[#8C8C8C] font-semibold mt-0.5">
                        Step: {displaySteps[selectedStepIndex].action}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {activeScreenshotPath && (
                      <>
                        <Button
                          className="w-8 h-8 min-w-8 p-0 bg-transparent text-[#595959] hover:bg-zinc-100 rounded-md"
                          aria-label="Zoom out screenshot"
                          isDisabled={screenshotZoom <= SCREENSHOT_ZOOM_MIN}
                          onPress={() =>
                            setScreenshotZoom((z) =>
                              Math.max(z - SCREENSHOT_ZOOM_STEP, SCREENSHOT_ZOOM_MIN)
                            )
                          }
                        >
                          <ZoomOut size={14} />
                        </Button>
                        <Button
                          className="h-8 min-w-[3rem] px-2 bg-transparent text-[#595959] hover:bg-zinc-100 rounded-md text-xs font-bold"
                          aria-label="Reset screenshot size"
                          onPress={() => setScreenshotZoom(100)}
                        >
                          {screenshotZoom}%
                        </Button>
                        <Button
                          className="w-8 h-8 min-w-8 p-0 bg-transparent text-[#595959] hover:bg-zinc-100 rounded-md"
                          aria-label="Zoom in screenshot"
                          isDisabled={screenshotZoom >= SCREENSHOT_ZOOM_MAX}
                          onPress={() =>
                            setScreenshotZoom((z) =>
                              Math.min(z + SCREENSHOT_ZOOM_STEP, SCREENSHOT_ZOOM_MAX)
                            )
                          }
                        >
                          <ZoomIn size={14} />
                        </Button>
                        <Button
                          className="w-8 h-8 min-w-8 p-0 bg-transparent text-[#595959] hover:bg-zinc-100 rounded-md"
                          aria-label="Reset screenshot to fit"
                          onPress={() => setScreenshotZoom(100)}
                        >
                          <RotateCcw size={14} />
                        </Button>
                        <a
                          href={buildScreenshotUrl(activeScreenshotPath)}
                          download
                          className="w-8 h-8 min-w-8 p-0 bg-transparent text-[#595959] hover:bg-zinc-100 rounded-md flex items-center justify-center"
                          aria-label="Download screenshot"
                        >
                          <Download size={14} />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {stepScreenshots.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {stepScreenshots.map((step: any) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setSelectedStepIndex(step.index)}
                        className={`flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                          step.index === selectedStepIndex
                            ? 'border-[#1677FF] shadow-md'
                            : 'border-[#EDEDED] opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={buildScreenshotUrl(step.screenshot_path)}
                          alt={step.action}
                          className="h-16 w-28 object-cover object-top bg-zinc-900"
                        />
                        <span className="block text-[9px] font-bold text-[#595959] px-1 py-0.5 truncate max-w-[7rem] bg-white">
                          Step {step.id}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Main screenshot viewer (selected step) */}
                <div className="trd-screenshot-container trd-screenshot-viewport">
                  {activeScreenshotPath ? (
                    <div className="trd-screenshot-zoom-wrap">
                      <img
                        src={buildScreenshotUrl(activeScreenshotPath)}
                        alt={steps[selectedStepIndex]?.action || 'Test Result Screenshot'}
                        className="trd-screenshot-image rounded-lg"
                        style={{ width: `${screenshotZoom}%` }}
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://placehold.co/800x600/0f172a/64748b?text=Screenshot+Not+Found';
                        }}
                      />
                    </div>
                  ) : (_testRun?.status === 'running' || _testRun?.status === 'pending') ? (
                    <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center text-zinc-400 space-y-3 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1677FF]"></div>
                      <span className="text-xs font-semibold">Waiting for test execution to complete...</span>
                    </div>
                  ) : isPassed ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 space-y-3 rounded-lg p-6 text-center">
                      <ImageIcon size={40} className="text-zinc-500" />
                      <span className="text-sm font-bold text-zinc-300">No UI screenshot captured</span>
                      <span className="text-xs text-zinc-500 max-w-sm">
                        The test passed but no screenshot file was saved. Restart qa-backend
                        (or re-run the test) so labelled step screenshots can be attached.
                      </span>
                    </div>
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
                          {_testRun?.url || "http://localhost:3000/error-boundary"}
                        </div>
                      </div>

                      {/* Big failure icon centered */}
                      <div className="trd-screenshot-overlay">
                        <div className="trd-screenshot-icon-box">
                          <AlertCircle size={48} className="stroke-[2]" />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-black text-white tracking-wide block uppercase">
                            {_testRun?.id ? `TEST EXECUTION FAILED (${_testRun.id})` : "TEST EXECUTION FAILED"}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-semibold font-mono mt-1 block">
                            {_testRun?.duration ? `VIEWPORT STATE CAPTURED AFTER ${_testRun.duration.toFixed(2)}s` : "VIEWPORT STATE CAPTURED DURING ASSERTION ERROR"}
                          </span>
                        </div>
                      </div>

                      {/* Absolute bottom tags overlay matching image */}
                      <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[10px] text-zinc-500 font-mono font-bold">
                        <span>URL: {_testRun?.url || "http://localhost:3000/error-boundary"}</span>
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

        </div>
      </div>
    </div>
  );
}
