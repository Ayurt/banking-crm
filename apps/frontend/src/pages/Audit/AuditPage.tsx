import { useQuery } from '@tanstack/react-query';
import { Card, Table, Tag } from 'antd';
import { Shield } from 'lucide-react';
import { getAuditLogs } from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';

export default function AuditPage() {
  const { data, isLoading } = useQuery({ queryKey: ['audit'], queryFn: () => getAuditLogs() });
  const rows = data?.data ?? [];

  const columns = [
    { title: 'Request ID', dataIndex: 'requestId', key: 'requestId', ellipsis: true, render: (id: string) => <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{id?.slice(0, 8)}...</code> },
    { title: 'Agent', dataIndex: 'agent', key: 'agent', render: (a: string) => a ? <Tag className="!rounded-full">{a}</Tag> : '—' },
    { title: 'Tool', dataIndex: 'tool', key: 'tool' },
    { title: 'Action', dataIndex: 'action', key: 'action', render: (a: string) => <span className="text-sm">{a}</span> },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'SUCCESS' ? 'success' : 'error'} className="!rounded-full">{s}</Tag> },
    { title: 'Duration', dataIndex: 'executionTime', render: (ms: number) => ms ? <span className="text-slate-500">{ms}ms</span> : '—' },
    { title: 'Time', dataIndex: 'createdAt', render: (d: string) => <span className="text-slate-500 text-sm">{new Date(d).toLocaleString()}</span> },
  ];

  if (isLoading) return <LoadingState />;

  return (
    <div className="page-container">
      <PageHeader title="Audit Logs" subtitle="Full execution trace for compliance and debugging" icon={<Shield size={22} />} badge="Compliance" />
      <Card><Table rowKey="id" dataSource={rows} columns={columns} pagination={{ pageSize: 15 }} /></Card>
    </div>
  );
}
