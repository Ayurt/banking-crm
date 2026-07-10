import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Switch, message } from 'antd';
import { Settings, Cpu, Zap, Database, Shield } from 'lucide-react';
import { getFeatureFlags, updateFeatureFlag } from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';

const flagIcons: Record<string, ReactNode> = {
  ENABLE_MEMORY: <Database size={18} />,
  ENABLE_STREAMING: <Zap size={18} />,
  ENABLE_AUDIT: <Shield size={18} />,
  ENABLE_CACHE: <Cpu size={18} />,
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['feature-flags'], queryFn: getFeatureFlags });

  const mutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => updateFeatureFlag(key, enabled),
    onSuccess: () => {
      message.success('Feature flag updated');
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
    onError: () => message.error('Failed to update'),
  });

  const flags = data?.data ?? [];

  if (isLoading) return <LoadingState />;

  return (
    <div className="page-container">
      <PageHeader title="Settings" subtitle="Configure platform feature flags and agent behavior" icon={<Settings size={22} />} />

      <div className="grid gap-4 max-w-2xl">
        {flags.map((flag: { key: string; enabled: boolean; description?: string }) => (
          <div
            key={flag.key}
            className="premium-card p-5 flex items-center justify-between animate-fade-in-up"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                {flagIcons[flag.key] ?? <Settings size={18} />}
              </div>
              <div>
                <p className="font-semibold text-slate-800 m-0 text-sm">{flag.key}</p>
                <p className="text-slate-500 text-xs m-0 mt-0.5">{flag.description}</p>
              </div>
            </div>
            <Switch
              checked={flag.enabled}
              loading={mutation.isPending}
              onChange={(enabled) => mutation.mutate({ key: flag.key, enabled })}
            />
          </div>
        ))}
      </div>

      <Card className="mt-6 max-w-2xl !bg-gradient-to-br from-brand-50/50 to-gold-50/30">
        <p className="text-sm text-slate-600 m-0">
          <strong>Tip:</strong> Disable <code className="bg-white px-1.5 py-0.5 rounded text-xs">ENABLE_CACHE</code> if Redis is not running.
          The agent workflow will still function with PostgreSQL-backed memory.
        </p>
      </Card>
    </div>
  );
}
