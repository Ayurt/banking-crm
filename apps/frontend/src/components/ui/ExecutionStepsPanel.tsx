import { useMemo, useState } from 'react';
import { Button } from 'antd';
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Loader2, XCircle } from 'lucide-react';
import type { ExecutionStep } from '@banking-crm/shared-types';
import {
  condenseExecutionSteps,
  getStepLabel,
  LOADING_PIPELINE,
} from '../../utils/condenseExecutionSteps';

interface ExecutionStepsPanelProps {
  steps: ExecutionStep[];
  loading?: boolean;
}

function StepIcon({ status }: { status: ExecutionStep['status'] | 'pending' }) {
  if (status === 'completed') return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === 'failed') return <XCircle size={14} className="text-rose-500" />;
  if (status === 'running') return <Loader2 size={14} className="text-blue-500 animate-spin" />;
  return <Circle size={10} className="text-slate-300" />;
}

export default function ExecutionStepsPanel({ steps, loading = false }: ExecutionStepsPanelProps) {
  const [open, setOpen] = useState(false);
  const displaySteps = useMemo(() => condenseExecutionSteps(steps), [steps]);

  if (!loading && displaySteps.length === 0) return null;

  const pipelineItems = loading
    ? LOADING_PIPELINE.map((label, i) => ({
        key: label,
        label,
        status: (i === 0 ? 'running' : 'pending') as ExecutionStep['status'] | 'pending',
      }))
    : displaySteps.map((step) => ({
        key: step.agentName,
        label: getStepLabel(step.agentName),
        status: step.status,
      }));

  return (
    <div className="execution-steps-panel">
      <div className="execution-steps-bar">
        <div className="execution-pipeline">
          {pipelineItems.map((item, index) => (
            <div key={item.key} className="execution-pipeline-item">
              <div className={`execution-pipeline-node execution-pipeline-node-${item.status}`}>
                <StepIcon status={item.status} />
                <span className="execution-pipeline-label">{item.label}</span>
              </div>
              {index < pipelineItems.length - 1 && <ChevronRight size={12} className="execution-pipeline-arrow" />}
            </div>
          ))}
        </div>

        {!loading && (
          <Button
            type="text"
            size="small"
            className="!text-slate-500 hover:!text-blue-600 !font-medium !flex !items-center !gap-1"
            onClick={() => setOpen((v) => !v)}
            icon={open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          >
            {open ? 'Hide steps' : 'View steps'}
          </Button>
        )}
      </div>

      {loading && (
        <p className="execution-steps-hint m-0">
          <Loader2 size={12} className="inline animate-spin mr-1.5" />
          Running LangGraph workflow…
        </p>
      )}

      {open && !loading && (
        <div className="execution-steps-detail">
          {displaySteps.map((step) => (
            <div key={step.agentName} className={`execution-step-card execution-step-card-${step.status}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <StepIcon status={step.status} />
                  <span className="font-semibold text-slate-800 text-sm">{step.agentName}</span>
                  {step.toolName && (
                    <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {step.toolName}
                    </span>
                  )}
                </div>
                {step.durationMs != null && (
                  <span className="text-xs text-slate-400 flex-shrink-0">{step.durationMs}ms</span>
                )}
              </div>
              <p className="text-xs text-slate-500 m-0 mt-1.5 leading-relaxed">{step.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
