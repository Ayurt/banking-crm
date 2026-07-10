import { useQuery } from '@tanstack/react-query';
import { Col, Row, Progress } from 'antd';
import {
  Users, TrendingUp, Clock, CheckCircle, Zap, Award,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Cell,
} from 'recharts';
import { getAnalytics } from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import ContentPanel from '../../components/ui/ContentPanel';
import LoadingState from '../../components/ui/LoadingState';
import DashboardHero, { QuickActionsGrid } from '../../components/ui/DashboardHero';
import { chartColors } from '../../theme/antdTheme';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getAnalytics });
  const summary = data?.data;
  const monitoring = summary?.monitoring;

  if (isLoading) return <LoadingState label="Loading dashboard..." />;

  const productData = Object.entries(summary?.productBreakdown ?? {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value: value as number,
  }));

  const pipelineSteps = [
    { label: 'Data Retrieval', pct: 100, status: 'complete' },
    { label: 'Scoring Engine', pct: 100, status: 'complete' },
    { label: 'Recommendations', pct: Math.min(100, (summary?.customersAnalyzed ?? 0) / 10), status: 'active' },
    { label: 'RM Approvals', pct: summary?.pendingApprovals ? 60 : 100, status: summary?.pendingApprovals ? 'pending' : 'complete' },
  ];

  const activityFeed = [
    { time: 'Just now', text: 'Agent workflow engine ready', type: 'system' },
    { time: 'Live', text: `${summary?.totalCustomers ?? 0} customers in CRM database`, type: 'data' },
    { time: 'Live', text: `${summary?.recommendationVolume ?? monitoring?.recommendationVolume ?? 0} recommendations generated`, type: 'ai' },
    { time: 'Pending', text: `${summary?.pendingApprovals ?? 0} messages awaiting your approval`, type: 'approval' },
  ];

  return (
    <div className="page-container">
      <DashboardHero pendingApprovals={summary?.pendingApprovals ?? 0} />

      {/* Primary KPIs */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Total Customers" value={summary?.totalCustomers ?? 0} icon={<Users size={20} color="#fff" strokeWidth={2} />} accent="blue" trend="CRM database" delay={80} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Avg Conversion" value={summary?.averageConversionScore ?? 0} suffix="/ 100" icon={<Award size={20} color="#fff" strokeWidth={2} />} accent="gold" trend="Deterministic score" delay={120} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Pending Approvals" value={summary?.pendingApprovals ?? 0} icon={<CheckCircle size={20} color="#fff" strokeWidth={2} />} accent="rose" trend="Requires action" trendUp={false} delay={160} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Avg Latency" value={monitoring?.averageLatencyMs ?? 0} suffix="ms" icon={<Clock size={20} color="#fff" strokeWidth={2} />} accent="green" trend="Agent response" delay={200} />
        </Col>
      </Row>

      {/* Quick actions */}
      <ContentPanel title="Quick Actions" subtitle="Jump to key workflows">
        <QuickActionsGrid />
      </ContentPanel>

      {/* Secondary metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <div className="mini-stat">
            <Zap size={16} className="text-violet-500" />
            <div>
              <p className="mini-stat-value">{monitoring?.activeRequests ?? 0}</p>
              <p className="mini-stat-label">Active Requests</p>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="mini-stat">
            <TrendingUp size={16} style={{ color: '#1a7ff5' }} />
            <div>
              <p className="mini-stat-value">{monitoring?.recommendationVolume ?? summary?.customersAnalyzed ?? 0}</p>
              <p className="mini-stat-label">Recommendations</p>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="mini-stat">
            <Users size={16} className="text-emerald-500" />
            <div>
              <p className="mini-stat-value">{summary?.customersAnalyzed ?? 0}</p>
              <p className="mini-stat-label">Analyzed</p>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="mini-stat">
            <Award size={16} style={{ color: '#d4a853' }} />
            <div>
              <p className="mini-stat-value capitalize text-base">{(summary?.topProduct ?? '—').replace(/_/g, ' ')}</p>
              <p className="mini-stat-label">Top Product</p>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="stretch">
        {/* Charts — stacked to balance right column height */}
        <Col xs={24} lg={14} className="flex">
          <div className="dashboard-stack-col">
            <ContentPanel title="Product Recommendations" subtitle="Distribution across banking products" noPadding>
              <div className="px-2 pb-4 pt-2">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={productData.length ? productData : [{ name: 'No data', value: 0 }]}>
                    <defs>
                      <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a7ff5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1a7ff5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                    <Area type="monotone" dataKey="value" stroke="#1a7ff5" strokeWidth={2.5} fill="url(#colorRec)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ContentPanel>

            {productData.length > 0 && (
              <ContentPanel title="Product Breakdown" subtitle="Recommendation volume by product type" noPadding className="dashboard-panel-grow">
                <div className="px-2 pb-4 pt-2">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={productData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {productData.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ContentPanel>
            )}
          </div>
        </Col>

        {/* Pipeline + activity */}
        <Col xs={24} lg={10} className="flex">
          <div className="dashboard-stack-col">
          <ContentPanel title="Agent Pipeline" subtitle="Workflow health status">
            <div className="space-y-4">
              {pipelineSteps.map((step) => (
                <div key={step.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{step.label}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      step.status === 'complete' ? 'bg-emerald-50 text-emerald-600' :
                      step.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600'
                    }`}>
                      {step.status === 'complete' ? 'Healthy' : step.status === 'pending' ? 'Action needed' : 'Active'}
                    </span>
                  </div>
                  <Progress
                    percent={step.pct}
                    showInfo={false}
                    strokeColor={step.status === 'complete' ? '#10b981' : step.status === 'pending' ? '#d4a853' : '#1a7ff5'}
                    trailColor="#f1f5f9"
                    size="small"
                  />
                </div>
              ))}
            </div>
          </ContentPanel>

          <ContentPanel title="Live Activity" subtitle={`Session: ${user?.name}`} className="dashboard-panel-grow">
            <div className="space-y-0">
              {activityFeed.map((item, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-dot activity-dot-${item.type}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 m-0 font-medium">{item.text}</p>
                    <p className="text-xs text-slate-400 m-0 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </ContentPanel>
          </div>
        </Col>
      </Row>
    </div>
  );
}
