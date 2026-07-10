import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Tag } from 'antd';
import { Sparkles } from 'lucide-react';
import { sortByConfidenceAndScore } from '../../utils/sortRecommendations';
import { getRecommendations } from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';

export default function RecommendationsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['recommendations'], queryFn: () => getRecommendations() });
  const rows = useMemo(
    () => sortByConfidenceAndScore(data?.data ?? []),
    [data?.data],
  );

  const columns = [
    { title: 'Customer', key: 'customer', render: (_: unknown, r: Record<string, unknown>) => {
      const c = r.customer as { firstName?: string; lastName?: string } | undefined;
      return <span className="font-medium">{c ? `${c.firstName} ${c.lastName}` : '—'}</span>;
    }},
    { title: 'Product', key: 'product', render: (_: unknown, r: Record<string, unknown>) => {
      const p = r.product as { name?: string } | undefined;
      return p?.name ?? '—';
    }},
    {
      title: 'Score',
      dataIndex: 'conversionScore',
      key: 'conversionScore',
      sorter: (a: { conversionScore: number }, b: { conversionScore: number }) => a.conversionScore - b.conversionScore,
      render: (s: number) => <Tag color={s >= 80 ? 'success' : 'processing'} className="!rounded-full !font-semibold">{Math.round(s)}</Tag>,
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      sorter: (a: { confidence: number }, b: { confidence: number }) => a.confidence - b.confidence,
      defaultSortOrder: 'descend' as const,
      render: (c: number) => <span className="text-brand-600 font-medium">{Math.round(c)}%</span>,
    },
    { title: 'Reasons', dataIndex: 'reason', render: (reasons: string[]) => <span className="text-slate-500 text-sm">{reasons?.slice(0, 2).join(', ') ?? '—'}</span> },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag className="!rounded-full">{s}</Tag> },
  ];

  if (isLoading) return <LoadingState />;

  return (
    <div className="page-container">
      <PageHeader title="Recommendations" subtitle="AI-generated product recommendations with explainability" icon={<Sparkles size={22} />} badge={`${rows.length} total`} />
      <Card><Table rowKey="id" dataSource={rows} columns={columns} pagination={{ pageSize: 10 }} /></Card>
    </div>
  );
}
