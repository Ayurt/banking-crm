import { useQuery } from '@tanstack/react-query';
import { Card, Table, Tag } from 'antd';
import { Megaphone } from 'lucide-react';
import { getCampaigns } from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';

export default function CampaignsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['campaigns'], queryFn: () => getCampaigns() });
  const rows = data?.data ?? [];

  const columns = [
    { title: 'Campaign', dataIndex: 'campaignName', key: 'name', render: (n: string) => <span className="font-medium">{n}</span> },
    { title: 'Customer', key: 'customer', render: (_: unknown, r: Record<string, unknown>) => {
      const c = r.customer as { firstName?: string; lastName?: string; customerCode?: string } | undefined;
      return c ? `${c.firstName} ${c.lastName}` : '—';
    }},
    { title: 'Channel', dataIndex: 'channel', key: 'channel', render: (c: string) => <Tag className="!rounded-full">{c}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color="processing" className="!rounded-full">{s}</Tag> },
    { title: 'Engagement', key: 'engagement', render: (_: unknown, r: Record<string, unknown>) => (
      <div className="flex gap-1">
        {Boolean(r.opened) && <Tag color="blue" className="!rounded-full">Opened</Tag>}
        {Boolean(r.clicked) && <Tag color="orange" className="!rounded-full">Clicked</Tag>}
        {Boolean(r.converted) && <Tag color="success" className="!rounded-full">Converted</Tag>}
      </div>
    )},
  ];

  if (isLoading) return <LoadingState />;

  return (
    <div className="page-container">
      <PageHeader title="Campaigns" subtitle="Outreach campaign history and engagement tracking" icon={<Megaphone size={22} />} />
      <Card><Table rowKey="id" dataSource={rows} columns={columns} pagination={{ pageSize: 10 }} /></Card>
    </div>
  );
}
