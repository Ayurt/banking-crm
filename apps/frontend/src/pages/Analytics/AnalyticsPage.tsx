import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Tag, Progress } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { getAnalytics, getEvaluationBenchmarks } from '../../api/client';
import { chartColors } from '../../theme/antdTheme';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import LoadingState from '../../components/ui/LoadingState';

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: getAnalytics });
  const { data: benchmarkData } = useQuery({ queryKey: ['evaluation-benchmarks'], queryFn: getEvaluationBenchmarks });

  if (isLoading) return <LoadingState label="Loading analytics..." />;

  const summary = data?.data;
  const monitoring = summary?.monitoring;
  const scenarios = benchmarkData?.data?.scenarios ?? [];
  const pieData = Object.entries(summary?.productBreakdown ?? {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }));

  return (
    <div className="page-container">
      <PageHeader title="Analytics" subtitle="Performance metrics and evaluation benchmarks" icon={<BarChart3 size={22} />} badge="Insights" />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}><StatCard title="Total Customers" value={summary?.totalCustomers ?? 0} accent="blue" delay={50} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Analyzed" value={summary?.customersAnalyzed ?? 0} accent="green" delay={100} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Avg Score" value={summary?.averageConversionScore ?? 0} suffix="/100" accent="gold" delay={150} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Pending" value={summary?.pendingApprovals ?? 0} accent="rose" delay={200} /></Col>
      </Row>

      <Row gutter={[20, 20]} className="mt-2">
        <Col xs={24} sm={12} lg={6}><StatCard title="Tool Calls" value={monitoring?.totalToolCalls ?? 0} accent="purple" delay={250} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Latency" value={monitoring?.averageLatencyMs ?? 0} suffix="ms" accent="blue" delay={300} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Error Rate" value={((monitoring?.errorRate ?? 0) * 100).toFixed(1)} suffix="%" accent="rose" delay={350} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Audit Logs" value={monitoring?.auditLogs ?? 0} accent="green" delay={400} /></Col>
      </Row>

      {scenarios.length > 0 && (
        <Card title="Benchmark Scenarios" className="mt-4 animate-fade-in-up">
          <Row gutter={[16, 16]}>
            {scenarios.map((scenario: { id: string; name: string; passed: boolean }) => (
              <Col xs={24} md={12} lg={8} key={scenario.id}>
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-sm text-slate-800">{scenario.name}</span>
                    <Tag color={scenario.passed ? 'success' : 'error'} className="!rounded-full">{scenario.passed ? 'PASS' : 'FAIL'}</Tag>
                  </div>
                  <Progress percent={scenario.passed ? 100 : 0} size="small" status={scenario.passed ? 'success' : 'exception'} strokeColor={scenario.passed ? '#10b981' : '#ef4444'} />
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Row gutter={[20, 20]} className="mt-4">
        <Col xs={24} lg={12}>
          <Card title="Product Recommendations" className="animate-fade-in-up">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pieData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" fill="#1a7ff5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Product Distribution" className="animate-fade-in-up">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
