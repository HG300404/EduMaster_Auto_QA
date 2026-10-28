import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  SlidersHorizontal,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import {
  Card,
  CardContent,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Table
} from '@heroui/react';
import { api } from '../api';
import '../styles/ExecutionHistory.css';

export default function ExecutionHistory() {
  const navigate = useNavigate();

  // Search, filter, pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('All');
  const [page, setPage] = useState(1);

  // Debounce logic as requested by FE_RULES.md
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load real test runs from backend using pre-formatted joined history API
  const { data: realRuns } = useQuery({
    queryKey: ['testruns_history'],
    queryFn: () => api.getTestRunsHistory(1000, 0),
    placeholderData: [],
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  // Map backend run items to table representation
  const filteredRuns = useMemo(() => {
    const formattedReal = (realRuns || []).map((run) => ({
      id: run.display_id,
      suite: `${run.suite_name}: ${run.target_title}`,
      date: run.date_formatted,
      env: run.environment,
      status: run.status,
      duration: run.duration_formatted
    }));

    return formattedReal.filter((r) => {
      const matchesSearch = r.suite.toLowerCase().includes(debouncedSearch.toLowerCase()) || r.id.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesEnv = selectedEnv === 'All' || r.env === selectedEnv;
      return matchesSearch && matchesEnv;
    });
  }, [realRuns, debouncedSearch, selectedEnv]);

  const totalCount = filteredRuns.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / 10));
  const tableData = useMemo(() => {
    const start = (page - 1) * 10;
    return filteredRuns.slice(start, start + 10);
  }, [filteredRuns, page]);

  // Dynamic metrics calculation
  const metrics = useMemo(() => {
    const runs = realRuns || [];
    const total = runs.length;
    const passed = runs.filter(r => r.status === 'Passed').length;
    const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    const validDurations = runs.filter(r => r.duration_seconds > 0);
    let avgDuration = '--:--';
    if (validDurations.length > 0) {
      const totalSecs = validDurations.reduce((acc, r) => acc + r.duration_seconds, 0);
      const avg = Math.round(totalSecs / validDurations.length);
      avgDuration = avg >= 60 ? `${Math.floor(avg / 60)}m ${avg % 60}s` : `${avg}s`;
    }

    const active = runs.filter(r => r.status === 'Running').length;

    const segments: string[] = runs.slice(0, 7).map(r => {
      if (r.status === 'Passed') return '#52C41A';
      if (r.status === 'Failed') return '#FF4D4F';
      if (r.status === 'Running') return '#1677FF';
      return '#FAAD14';
    });
    while (segments.length < 7) {
      segments.push('#E2E8F0');
    }

    return { total, rate, avgDuration, active, segments };
  }, [realRuns]);

  return (
    <div className="eh-container">
      {/* HEADER SECTION */}
      <div className="eh-header">
        <div>
          <h2 className="text-2xl font-black text-[#1F1F1F] tracking-tight">Execution History</h2>
          <span className="text-xs text-[#595959] font-semibold">Analyze performance metrics and status across all testing environments.</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="eh-export-btn">
            <Download size={14} />
            <span>Export Reports</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR ACTIONS */}
      <Card className="eh-controls-card">
        <CardContent className="p-0 flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Left search */}
          <div className="w-full md:w-96 relative">
            <input
              placeholder="Search by Run ID or Suite Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="eh-search-input"
            />
            <Search size={14} className="text-[#8C8C8C] absolute left-3 top-2.5" />
          </div>

          {/* Right filters */}
          <div className="eh-filters-wrapper">
            {/* Environment select filter */}
            <Dropdown>
              <DropdownTrigger>
                <button className="eh-dropdown-trigger">
                  Environment: {selectedEnv}
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Filter Environment"
                onAction={(key) => setSelectedEnv(key as string)}
                className="font-semibold text-xs"
              >
                <DropdownItem key="All">All</DropdownItem>
                <DropdownItem key="Production">Production</DropdownItem>
                <DropdownItem key="Staging">Staging</DropdownItem>
                <DropdownItem key="QA-1">QA-1</DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* Date filter dropdown mockup */}
            <Dropdown>
              <DropdownTrigger>
                <button className="eh-dropdown-trigger">
                  <Calendar size={13} />
                  <span>Date: Last 7 Days</span>
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Filter Date" className="font-semibold text-xs">
                <DropdownItem key="today">Today</DropdownItem>
                <DropdownItem key="7days">Last 7 Days</DropdownItem>
                <DropdownItem key="30days">Last 30 Days</DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <button className="eh-icon-btn">
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* HISTORICAL TABLE CARD */}
      <Card className="eh-table-card">
        <CardContent className="p-0">
          <Table 
            aria-label="Execution Runs Table" 
            className="font-sans"
          >
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column className="eh-table-header" isRowHeader>RUN ID</Table.Column>
                  <Table.Column className="eh-table-header">SUITE / TARGET</Table.Column>
                  <Table.Column className="eh-table-header">DATE & TIME</Table.Column>
                  <Table.Column className="eh-table-header">STATUS</Table.Column>
                  <Table.Column className="eh-table-header">DURATION</Table.Column>
                </Table.Header>
                <Table.Body items={tableData}>
                  {(row) => {
                    // Determine status styles dynamically
                    let badgeClass = "bg-zinc-100 text-zinc-600";
                    if (row.status === 'Passed') badgeClass = "bg-green-50 text-[#52C41A] border border-green-200/50";
                    else if (row.status === 'Failed') badgeClass = "bg-red-50 text-[#FF4D4F] border border-red-200/50";
                    else if (row.status === 'Partial') badgeClass = "bg-amber-50 text-[#FAAD14] border border-amber-200/50";
                    else if (row.status === 'Running') badgeClass = "bg-blue-50 text-[#1677FF] border border-blue-200/50";

                    return (
                      <Table.Row
                        key={row.id}
                        className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]/70 cursor-pointer transition-colors"
                        onClick={() => navigate(`/testrun/${row.id.replace('TR-', '')}`)}
                      >
                        <Table.Cell className="eh-table-cell-id">
                          <div className="w-full py-2 cursor-pointer" onClick={() => navigate(`/testrun/${row.id.replace('TR-', '')}`)}>
                            #{row.id}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="eh-table-cell-suite">
                          <div className="w-full py-2 cursor-pointer" onClick={() => navigate(`/testrun/${row.id.replace('TR-', '')}`)}>
                            {row.suite}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="eh-table-cell-date">
                          <div className="w-full py-2 cursor-pointer" onClick={() => navigate(`/testrun/${row.id.replace('TR-', '')}`)}>
                            {row.date}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="py-4 px-4">
                          <div className="w-full py-2 cursor-pointer" onClick={() => navigate(`/testrun/${row.id.replace('TR-', '')}`)}>
                            <span className={`px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase rounded-full ${badgeClass}`}>
                              {row.status}
                            </span>
                          </div>
                        </Table.Cell>
                        <Table.Cell className="text-xs font-semibold text-[#595959] py-4 px-4">
                          <div className="w-full py-2 cursor-pointer" onClick={() => navigate(`/testrun/${row.id.replace('TR-', '')}`)}>
                            {row.duration}
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    );
                  }}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>

          {/* Table Bottom Pagination controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#F0F0F0] mt-4 font-semibold text-xs text-[#595959]">
            <span>Showing {Math.min(totalCount, (page - 1) * 10 + 1)}-{Math.min(totalCount, page * 10)} of {totalCount} runs</span>

            {/* Custom Pagination Panel */}
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`w-8 h-8 rounded-lg border border-[#EDEDED] text-[#595959] bg-white hover:bg-[#FAFAFA] flex items-center justify-center transition-colors ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${p === page ? 'bg-[#1677FF] text-white' : 'border border-[#EDEDED] text-[#595959] bg-white hover:bg-[#FAFAFA] transition-colors'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`w-8 h-8 rounded-lg border border-[#EDEDED] text-[#595959] bg-white hover:bg-[#FAFAFA] flex items-center justify-center transition-colors ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* METRICS DUO BOTTOM PANEL */}
      <div className="eh-grid-2col">
        {/* SUCCESS RATE */}
        <Card className="eh-metric-card">
          <CardContent className="p-0 flex flex-col justify-between h-full space-y-4">
            <div>
              <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block">Success Rate</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#1F1F1F] tracking-tight">{metrics.rate}%</span>
                <span className="text-[10px] font-bold text-[#52C41A] flex items-center gap-0.5">
                  <TrendingUp size={9} /> Live
                </span>
              </div>
            </div>

            {/* Health track bar */}
            <div className="eh-progress-track">
              <div className="bg-[#52C41A] h-full rounded-full transition-all duration-500" style={{ width: `${metrics.rate}%` }} />
            </div>
          </CardContent>
        </Card>


        {/* TOTAL RUNS TODAY WITH PIPELINE GRIDS */}
        <Card className="eh-metric-card">
          <CardContent className="p-0 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block">Total Runs Today</span>
                <span className="text-2xl font-black text-[#1F1F1F] tracking-tight mt-1 block">{metrics.total}</span>
              </div>
              <span className="text-[10px] font-extrabold bg-blue-50 text-[#1677FF] border border-[#BAE0FF] px-2 py-0.5 rounded-md">
                Active: {metrics.active}
              </span>
            </div>

            {/* Horizontal Pipeline Run Segment Grids */}
            <div className="flex gap-1.5 pt-1">
              {metrics.segments.map((color, idx) => (
                <span key={idx} className="flex-1 h-2 rounded-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
