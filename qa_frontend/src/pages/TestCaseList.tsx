import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Search, 
  Plus, 
  FileCode, 
  X
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  Table
} from '@heroui/react';
import { api } from '../api';
import '../styles/TestCaseList.css';

export default function TestCaseList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'draft'>('all');

  // Modal open state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [newTcTitle, setNewTcTitle] = useState('');
  const [newTcFilePath, setNewTcFilePath] = useState('tests/test_auth.py');
  const [newTcSuite, setNewTcSuite] = useState('1');

  // Debounce logic as requested by FE_RULES.md
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load test cases for quick metrics
  const { data: testcases } = useQuery({
    queryKey: ['testcases'],
    queryFn: api.getTestCases,
    placeholderData: [],
  });

  // Load test suites with nested cases
  const { data: testsuites, isLoading } = useQuery({
    queryKey: ['testsuites'],
    queryFn: api.getTestSuites,
    placeholderData: [],
  });

  // Create Test Case Mutation
  const createTestCaseMutation = useMutation({
    mutationFn: api.createTestCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testcases'] });
      queryClient.invalidateQueries({ queryKey: ['testsuites'] });
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
      queryClient.invalidateQueries({ queryKey: ['testruns'] });
      queryClient.invalidateQueries({ queryKey: ['testcases'] });
      queryClient.invalidateQueries({ queryKey: ['testsuites'] });
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

  // Filter test suites and their nested test cases
  const filteredSuites = useMemo(() => {
    return (testsuites || []).map(suite => {
      const suiteMatches = suite.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                           (suite.description && suite.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
      const filteredCases = (suite.test_cases || []).filter(tc => {
        const tcMatchesSearch = tc.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                                tc.file_path.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesTab = statusTab === 'all' || tc.status === statusTab;
        return (suiteMatches || tcMatchesSearch) && matchesTab;
      });
      return {
        ...suite,
        test_cases: filteredCases
      };
    }).filter(suite => suite.test_cases.length > 0 || (suite.name.toLowerCase().includes(debouncedSearch.toLowerCase())));
  }, [testsuites, debouncedSearch, statusTab]);

  return (
    <div className="tcl-container">
      {/* PAGE HEADER */}
      <div className="tcl-header">
        <div>
          <h2 className="text-2xl font-bold text-[#1F1F1F]">Automated Test Cases</h2>
          <span className="text-xs text-[#595959] font-semibold">Manage, inspect, and trigger your Pytest scenarios</span>
        </div>
        
        <Button 
          className="bg-[#1677FF] text-white font-bold text-xs h-9 px-4 rounded-md flex items-center justify-center gap-1.5"
          onClick={() => setIsModalOpen(true)}
          aria-label="Add Test Case"
        >
          <Plus size={16} />
          <span>Add Test Case</span>
        </Button>
      </div>

      {/* QUICK STATUS METRICS */}
      <div className="tcl-grid-3col">
        <Card className="tcl-metric-card">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">TOTAL CASES</span>
            <span className="text-xl font-bold text-[#1F1F1F] block mt-1">{(testcases || []).length}</span>
          </CardContent>
        </Card>
        <Card className="tcl-metric-card">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">ACTIVE</span>
            <span className="text-xl font-bold text-[#52C41A] block mt-1">
              {(testcases || []).filter(c => c.status === 'active').length}
            </span>
          </CardContent>
        </Card>
        <Card className="tcl-metric-card">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">DRAFTS</span>
            <span className="text-xl font-bold text-[#FAAD14] block mt-1">
              {(testcases || []).filter(c => c.status === 'draft').length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* CONTROLS & SEARCH CARD */}
      <Card className="tcl-controls-card">
        <CardContent className="p-0 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs Filter */}
          <div className="tcl-tabs-wrapper">
            <button
              onClick={() => setStatusTab('all')}
              className={`${statusTab === 'all' ? 'bg-white text-[#1677FF] shadow-xs' : 'text-[#595959] hover:text-[#1F1F1F]'} tcl-tab-btn`}
            >
              All Cases
            </button>
            <button
              onClick={() => setStatusTab('active')}
              className={`${statusTab === 'active' ? 'bg-white text-[#52C41A] shadow-xs' : 'text-[#595959] hover:text-[#1F1F1F]'} tcl-tab-btn`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusTab('draft')}
              className={`${statusTab === 'draft' ? 'bg-white text-[#FAAD14] shadow-xs' : 'text-[#595959] hover:text-[#1F1F1F]'} tcl-tab-btn`}
            >
              Drafts
            </button>
          </div>

          {/* Search Box */}
          <div className="tcl-search-wrapper">
            <input
              placeholder="Search by Suite, ID, title or path..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tcl-search-input"
            />
            <Search size={14} className="text-[#8C8C8C] absolute left-3 top-2.5" />
          </div>
        </CardContent>
      </Card>

      {/* TEST SUITES & CASES LIST */}
      <div className="space-y-6 mt-6">
        {isLoading ? (
          <Card className="tcl-table-card">
            <CardContent className="flex flex-col items-center justify-center p-12 space-y-2">
              <span className="w-5 h-5 border-2 border-[#1677FF]/30 border-t-[#1677FF] rounded-full animate-spin" />
              <span className="text-xs font-semibold text-[#8C8C8C]">Loading test suites and scenarios...</span>
            </CardContent>
          </Card>
        ) : filteredSuites.length === 0 ? (
          <Card className="tcl-table-card">
            <CardContent className="flex flex-col items-center justify-center p-16 space-y-3">
              <FileCode size={40} className="text-[#8C8C8C] stroke-[1.5]" />
              <div className="text-center">
                <span className="text-sm font-bold text-[#1F1F1F] block">No test suites or scenarios found</span>
                <span className="text-xs text-[#8C8C8C] font-semibold block mt-0.5">Try widening your search filters or add a new test scenario</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredSuites.map((suite) => (
            <Card key={suite.id} className="border border-[#EDEDED] shadow-xs overflow-hidden rounded-xl bg-white font-sans">
              <div className="bg-[#FAFAFA] px-6 py-4 border-b border-[#EDEDED] flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2 py-0.5 bg-[#1677FF]/10 text-[#1677FF] rounded">TS-{suite.id}</span>
                    <h3 className="text-base font-bold text-[#1F1F1F]">{suite.name}</h3>
                  </div>
                  {suite.description && (
                    <p className="text-xs text-[#595959] mt-1 font-medium">{suite.description}</p>
                  )}
                </div>
                <span className="text-xs font-bold text-[#8C8C8C] bg-white px-2.5 py-1 rounded-md border border-[#EDEDED] self-start md:self-auto">
                  {suite.test_cases.length} Scenarios
                </span>
              </div>
              
              <CardContent className="p-0">
                {suite.test_cases.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#8C8C8C] font-semibold">
                    No scenarios in this suite match current filters.
                  </div>
                ) : (
                  <Table aria-label={`Test Cases for ${suite.name}`} className="font-sans border-none shadow-none">
                    <Table.ScrollContainer>
                      <Table.Content>
                        <Table.Header>
                          <Table.Column className="tcl-table-header" isRowHeader>ID</Table.Column>
                          <Table.Column className="tcl-table-header">Title</Table.Column>
                          <Table.Column className="tcl-table-header">Execution Pathway</Table.Column>
                          <Table.Column className="tcl-table-header">Status</Table.Column>
                          <Table.Column className="tcl-table-header text-center">Trigger Action</Table.Column>
                        </Table.Header>
                        <Table.Body items={suite.test_cases}>
                          {(tc) => (
                            <Table.Row key={tc.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]/70 transition-colors">
                              <Table.Cell className="tcl-table-cell-id">#{tc.id}</Table.Cell>
                              <Table.Cell className="tcl-table-cell-title">{tc.title}</Table.Cell>
                              <Table.Cell className="py-4 px-4">
                                <div className="tcl-table-cell-path" title={tc.file_path}>
                                  <FileCode size={12} className="text-[#8C8C8C]" />
                                  {tc.file_path}
                                </div>
                              </Table.Cell>
                              <Table.Cell className="py-4 px-4">
                                <span className={`px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase rounded-full ${tc.status === 'active' ? 'bg-green-50 text-[#52C41A]' : 'bg-amber-50 text-[#FAAD14]'}`}>
                                  {tc.status}
                                </span>
                              </Table.Cell>
                              <Table.Cell className="py-4 px-4 text-center">
                                <Button 
                                  className="tcl-run-btn"
                                  onClick={() => handleRunTestCase(tc.id)}
                                  aria-label={`Run test scenario ${tc.title}`}
                                >
                                  {triggerTestMutation.isPending && triggerTestMutation.variables === tc.id ? (
                                    <span className="w-3.5 h-3.5 border-2 border-[#1677FF]/30 border-t-[#1677FF] rounded-full animate-spin" />
                                  ) : (
                                    <Play size={12} />
                                  )}
                                  <span>Run Test</span>
                                </Button>
                              </Table.Cell>
                            </Table.Row>
                          )}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* CREATE NEW TEST CASE DIALOG OVERLAY */}
      {isModalOpen && (
        <div className="tcl-modal-overlay">
          <div className="tcl-modal-container">
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
                  className="tcl-input"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C8C8C]">PYTEST FILE PATH</label>
                <input
                  placeholder="e.g. api/test_payment.py"
                  value={newTcFilePath}
                  onChange={(e) => setNewTcFilePath(e.target.value)}
                  className="tcl-input"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#8C8C8C]">PARENT TEST SUITE</label>
                <select
                  value={newTcSuite}
                  onChange={(e) => setNewTcSuite(e.target.value)}
                  className="tcl-select"
                >
                  {(testsuites || []).map(suite => (
                    <option key={suite.id} value={suite.id}>{suite.name}</option>
                  ))}
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
