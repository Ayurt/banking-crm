import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Input, Descriptions, Tag, Button } from 'antd';
import { Users, ArrowRight, UserRound } from 'lucide-react';
import { getCustomers, getCustomerProfile } from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import ContentPanel from '../../components/ui/ContentPanel';
import LoadingState from '../../components/ui/LoadingState';

interface CustomerRow {
  id: string;
  name: string;
  customerCode: string;
  city?: string;
  monthlyIncome?: number;
  creditScore?: number;
}

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => getCustomers(page, search || undefined),
  });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['customer-profile', selectedId],
    queryFn: () => getCustomerProfile(selectedId!),
    enabled: !!selectedId,
  });

  const customers: CustomerRow[] = data?.data ?? [];
  const profile = profileData?.data;
  const total = data?.meta?.total ?? 0;

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, record: CustomerRow) => (
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #33a1ff 0%, #1468e1 100%)' }}
          >
            {record.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 m-0 truncate">{record.name}</p>
            <p className="text-xs text-slate-400 m-0 mt-0.5 font-mono tracking-wide">{record.customerCode}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      render: (city: string) => <span className="text-slate-600">{city ?? '—'}</span>,
    },
    {
      title: 'Income',
      dataIndex: 'monthlyIncome',
      key: 'income',
      width: 130,
      render: (v: number) => (
        <span className="text-emerald-600 font-semibold">₹{v?.toLocaleString('en-IN')}</span>
      ),
    },
    {
      title: 'Credit',
      dataIndex: 'creditScore',
      key: 'credit',
      width: 100,
      render: (s: number) => (
        <Tag color={s >= 750 ? 'success' : s >= 650 ? 'processing' : 'warning'} className="!rounded-full !font-semibold !m-0">
          {s}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: CustomerRow) => (
        <Button
          type="default"
          size="small"
          icon={<UserRound size={14} color="#1a7ff5" />}
          className={`!rounded-lg !inline-flex !items-center !gap-1 !font-medium !border-slate-200 ${
            selectedId === record.id
              ? '!bg-blue-50 !border-blue-300 !text-blue-700'
              : '!text-slate-700 hover:!border-blue-300 hover:!text-blue-700 hover:!bg-blue-50'
          }`}
          onClick={() => setSelectedId(record.id)}
        >
          Profile
          <ArrowRight size={13} className="opacity-60" />
        </Button>
      ),
    },
  ];

  if (isLoading && !selectedId) return <LoadingState />;

  return (
    <div className="page-container">
      <PageHeader
        title="Customers"
        subtitle="Search and explore complete CRM profiles"
        icon={<Users size={22} color="#fff" />}
        badge={`${total.toLocaleString()} total`}
        action={(
          <Input.Search
            placeholder="Search name or code..."
            allowClear
            size="large"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onClear={() => {
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
            className="customer-search !w-full sm:!w-80"
          />
        )}
      />

      <ContentPanel noPadding className="content-panel-scroll">
        <Table
          rowKey="id"
          dataSource={customers}
          columns={columns}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage, showSizeChanger: false }}
          scroll={{ x: 720 }}
          rowClassName={(record) => (record.id === selectedId ? 'customer-row-selected' : '')}
        />
      </ContentPanel>

      {selectedId && (
        <ContentPanel
          title="CRM Profile"
          subtitle={profile?.customer?.name}
          className="animate-fade-in-up"
        >
          {profileLoading ? (
            <LoadingState label="Loading profile..." />
          ) : profile ? (
            <>
              <Descriptions bordered size="small" column={2} className="!rounded-xl overflow-hidden">
                <Descriptions.Item label="Customer">
                  <div>
                    <span className="font-semibold">{profile.customer.name}</span>
                    <span className="block text-xs text-slate-400 font-mono mt-0.5">{profile.customer.customerCode}</span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Credit Score">
                  <Tag color="processing" className="!rounded-full">{profile.customer.creditScore}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Income">₹{profile.customer.monthlyIncome?.toLocaleString('en-IN')}</Descriptions.Item>
                <Descriptions.Item label="Risk">{profile.customer.riskProfile}</Descriptions.Item>
                <Descriptions.Item label="Products" span={2}>
                  {profile.customer.existingProducts?.map((p: string) => (
                    <Tag key={p} className="!rounded-full">{p}</Tag>
                  ))}
                </Descriptions.Item>
              </Descriptions>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {[
                  { label: 'Transactions', count: profile.transactions?.length ?? 0 },
                  { label: 'Loans', count: profile.loans?.length ?? 0 },
                  { label: 'CRM Notes', count: profile.crmNotes?.length ?? 0 },
                  { label: 'Campaigns', count: profile.campaigns?.length ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="text-2xl font-bold text-slate-800 m-0">{item.count}</p>
                    <p className="text-xs text-slate-500 m-0 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </ContentPanel>
      )}
    </div>
  );
}
