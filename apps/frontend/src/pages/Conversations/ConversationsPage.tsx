import { useMemo, useState } from 'react';
import { Input, Button, Table, Tag, Alert, Space } from 'antd';
import { Send, Bot, Sparkles, Zap } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { sortByConfidenceAndScore } from '../../utils/sortRecommendations';
import { runAgentQuery } from '../../api/client';
import type { AgentQueryResponse, ExecutionStep, Recommendation } from '@banking-crm/shared-types';
import PageHeader from '../../components/ui/PageHeader';
import ContentPanel from '../../components/ui/ContentPanel';
import ExecutionStepsPanel from '../../components/ui/ExecutionStepsPanel';

const { TextArea } = Input;

const SAMPLE_QUERIES = [
  'Find high-value customers likely to convert for a personal loan this month and generate personalized WhatsApp messages.',
  'Identify customers eligible for premium credit cards with strong transaction history.',
  'Find customers suitable for fixed deposits with high average balance.',
];

export default function AgentPage() {
  const [query, setQuery] = useState(SAMPLE_QUERIES[0]);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [result, setResult] = useState<AgentQueryResponse | null>(null);

  const mutation = useMutation({
    mutationFn: runAgentQuery,
    onSuccess: (res) => {
      const data = res.data as AgentQueryResponse;
      setResult(data);
      setSteps(data.executionSteps ?? []);
    },
  });

  const handleSubmit = () => {
    setSteps([]);
    setResult(null);
    mutation.mutate(query);
  };

  const recColumns = [
    { title: 'Customer', dataIndex: 'customerName', key: 'name', render: (n: string) => <span className="font-medium">{n}</span> },
    {
      title: 'Score',
      dataIndex: 'conversionScore',
      key: 'score',
      sorter: (a: Recommendation, b: Recommendation) => a.conversionScore - b.conversionScore,
      render: (score: number) => (
        <Tag color={score >= 80 ? 'success' : score >= 65 ? 'processing' : 'warning'} className="!rounded-full !font-semibold">
          {score}
        </Tag>
      ),
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      sorter: (a: Recommendation, b: Recommendation) => a.confidence - b.confidence,
      defaultSortOrder: 'descend' as const,
      render: (c: number) => <span className="text-brand-600 font-medium">{c}%</span>,
    },
    { title: 'Product', dataIndex: 'productName', key: 'product' },
    { title: 'Reasons', dataIndex: 'reasons', key: 'reasons', render: (reasons: string[]) => <span className="text-slate-500 text-sm">{reasons.slice(0, 2).join(', ')}</span> },
  ];

  const sortedRecommendations = useMemo(
    () => (result ? sortByConfidenceAndScore(result.recommendations) : []),
    [result],
  );

  return (
    <div className="page-container">
      <PageHeader
        title="AI Agent Assistant"
        subtitle="Ask natural language questions — LangGraph orchestrates the full workflow"
        icon={<Bot size={22} />}
        badge="LangGraph"
      />

      <ContentPanel title="Ask the AI Agent" subtitle="Natural language query — orchestrates Planner → Retrieval → Scoring → Messaging">
        <Space direction="vertical" className="w-full" size="middle">
          <TextArea
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask the AI agent..."
            className="!rounded-xl !text-base"
          />
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuery(q)}
                className="px-3 py-1.5 text-xs rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all duration-200"
              >
                <Sparkles size={12} className="inline mr-1" />
                {q.slice(0, 55)}...
              </button>
            ))}
          </div>
          <Button
            type="primary"
            icon={<Send size={16} />}
            onClick={handleSubmit}
            loading={mutation.isPending}
            size="large"
            className="!h-12 !px-8 !rounded-xl !font-semibold"
          >
            Run Agent Workflow
          </Button>

          {(mutation.isPending) && (
            <ExecutionStepsPanel steps={steps} loading />
          )}
        </Space>
      </ContentPanel>

      {result && (
        <div className="space-y-4 animate-fade-in-up">
          <Alert type="success" message={<span className="font-semibold">Workflow Complete</span>} description={result.summary} showIcon className="!rounded-xl" />
          {steps.length > 0 && (
            <ExecutionStepsPanel key={result.execution?.executionId ?? 'result'} steps={steps} />
          )}
          {result.execution && (
            <div className="flex flex-wrap gap-2">
              <Tag icon={<Zap size={12} />} className="!px-3 !py-1 !rounded-full">{result.execution.durationMs}ms</Tag>
              <Tag className="!px-3 !py-1 !rounded-full">{result.execution.toolCalls} tool calls</Tag>
              <Tag className="!px-3 !py-1 !rounded-full">{result.execution.tokensUsed} tokens</Tag>
            </div>
          )}
          <ContentPanel title={`Recommendations (${sortedRecommendations.length})`} noPadding>
            <Table
              dataSource={sortedRecommendations}
              columns={recColumns}
              rowKey="customerId"
              pagination={{ pageSize: 10 }}
              expandable={{
                expandedRowRender: (record: Recommendation) => (
                  <div className="py-2 px-1 text-sm text-slate-600">
                    <p className="m-0 mb-1"><strong>Evidence:</strong> {record.evidence.join(' | ')}</p>
                    <p className="m-0"><strong>Reasons:</strong> {record.reasons.join(', ')}</p>
                  </div>
                ),
              }}
            />
          </ContentPanel>
          <ContentPanel title={`Generated Messages (${result.messages.length})`} subtitle="Pending your approval before sending">
            <div className="space-y-3">
              {result.messages.map((msg) => (
                <div key={msg.customerId} className="message-preview-card">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-slate-800">{msg.customerName}</span>
                    <Tag className="!rounded-full">{msg.channel}</Tag>
                  </div>
                  <p className="text-slate-600 m-0 text-sm leading-relaxed">{msg.content}</p>
                </div>
              ))}
            </div>
          </ContentPanel>
        </div>
      )}

      {mutation.isError && (
        <Alert type="error" message="Workflow failed" description="Check backend logs and ensure the database is seeded." className="!rounded-xl" />
      )}
    </div>
  );
}
