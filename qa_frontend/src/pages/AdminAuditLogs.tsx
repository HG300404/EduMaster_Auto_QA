import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, ClipboardList, Info } from 'lucide-react';
import { Button, Card, CardContent, Table } from '@heroui/react';
import { api } from '../api';

export default function AdminAuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load audit logs
  const { data: logs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin_audit_logs'],
    queryFn: () => api.getAdminAuditLogs(200, 0),
    placeholderData: [],
  });

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return (logs || []).filter(log => 
      log.action.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
      (log.user_id && String(log.user_id).includes(debouncedSearch))
    );
  }, [logs, debouncedSearch]);

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F1F1F]">System Audit Logs</h2>
          <span className="text-xs text-[#595959] font-semibold">Monitor system-wide logins, test executions, and administrative events</span>
        </div>
        
        <Button
          className="bg-white border border-[#EDEDED] text-[#595959] hover:bg-[#F5F7FA] font-bold text-xs h-9 px-4 rounded-md flex items-center justify-center gap-1.5 transition-colors"
          onClick={() => refetch()}
          isDisabled={isLoading || isRefetching}
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          <span>Refresh Logs</span>
        </Button>
      </div>

      {/* FILTER CONTROLS */}
      <Card className="border border-[#EDEDED] shadow-xs rounded-xl bg-white">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <input
              placeholder="Search by action, details, user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#EDEDED] rounded-lg text-xs font-semibold placeholder:text-[#BFBFBF] focus:outline-none focus:border-[#1677FF] transition-all bg-white"
            />
            <Search size={14} className="text-[#8C8C8C] absolute left-3 top-3.5" />
          </div>
          <span className="text-xs text-[#8C8C8C] font-semibold">Showing last 200 records</span>
        </CardContent>
      </Card>

      {/* AUDIT LOGS TABLE */}
      <Card className="border border-[#EDEDED] shadow-xs rounded-xl bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-2">
              <span className="w-5 h-5 border-2 border-[#1677FF]/30 border-t-[#1677FF] rounded-full animate-spin" />
              <span className="text-xs font-semibold text-[#8C8C8C]">Loading system audit records...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <ClipboardList size={40} className="text-[#8C8C8C] stroke-[1.5]" />
              <div className="text-center">
                <span className="text-sm font-bold text-[#1F1F1F] block">No audit logs found</span>
                <span className="text-xs text-[#8C8C8C] font-semibold block mt-0.5">Try refining your search keyword</span>
              </div>
            </div>
          ) : (
            <Table aria-label="System Audit Logs" className="font-sans border-none shadow-none">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                    <Table.Column className="bg-[#FAFAFA] text-xs font-black text-[#595959] py-3.5 px-6 border-b border-[#EDEDED]" isRowHeader>Log ID</Table.Column>
                    <Table.Column className="bg-[#FAFAFA] text-xs font-black text-[#595959] py-3.5 px-6 border-b border-[#EDEDED]">Timestamp</Table.Column>
                    <Table.Column className="bg-[#FAFAFA] text-xs font-black text-[#595959] py-3.5 px-6 border-b border-[#EDEDED]">Operator ID</Table.Column>
                    <Table.Column className="bg-[#FAFAFA] text-xs font-black text-[#595959] py-3.5 px-6 border-b border-[#EDEDED]">Action</Table.Column>
                    <Table.Column className="bg-[#FAFAFA] text-xs font-black text-[#595959] py-3.5 px-6 border-b border-[#EDEDED]">Details</Table.Column>
                  </Table.Header>
                  <Table.Body items={filteredLogs}>
                    {(log) => (
                      <Table.Row key={log.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]/70 transition-colors">
                        <Table.Cell className="py-4 px-6 text-xs text-[#595959] font-bold">#{log.id}</Table.Cell>
                        <Table.Cell className="py-4 px-6 text-xs text-[#595959] font-semibold">{formatDate(log.timestamp)}</Table.Cell>
                        <Table.Cell className="py-4 px-6 text-xs text-[#1F1F1F] font-bold">
                          {log.user_id ? `User #${log.user_id}` : 'System / Auto'}
                        </Table.Cell>
                        <Table.Cell className="py-4 px-6">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase rounded-full ${
                            log.action.includes('Register') || log.action.includes('Login')
                              ? 'bg-blue-50 text-blue-600'
                              : log.action.includes('Delete')
                              ? 'bg-red-50 text-red-600'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {log.action}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="py-4 px-6 text-xs text-[#595959] font-medium">
                          <div className="flex items-center gap-1.5">
                            <Info size={12} className="text-[#8C8C8C] flex-shrink-0" />
                            <span>{log.details || 'No additional logs details.'}</span>
                          </div>
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
    </div>
  );
}
