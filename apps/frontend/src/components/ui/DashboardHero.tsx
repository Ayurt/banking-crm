import { useNavigate } from 'react-router-dom';
import { Bot, MessageSquare, Users, BarChart3, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const actions = [
  { label: 'Run AI Agent', desc: 'Natural language workflow', icon: Bot, path: '/agent', iconBg: 'linear-gradient(135deg, #33a1ff 0%, #1468e1 100%)' },
  { label: 'Review Approvals', desc: 'Pending WhatsApp messages', icon: MessageSquare, path: '/messages', iconBg: 'linear-gradient(135deg, #e8c468 0%, #b8892e 100%)' },
  { label: 'Browse Customers', desc: 'CRM profiles & history', icon: Users, path: '/customers', iconBg: 'linear-gradient(135deg, #34d399 0%, #059669 100%)' },
  { label: 'View Analytics', desc: 'Performance & benchmarks', icon: BarChart3, path: '/analytics', iconBg: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' },
];

export default function DashboardHero({ pendingApprovals = 0 }: { pendingApprovals?: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] ?? 'Manager';

  return (
    <div className="dashboard-hero animate-fade-in-up">
      <div className="dashboard-hero-bg" />
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="hero-pill">
              <Sparkles size={12} />
              Agentic AI Active
            </span>
            <span className="hero-pill hero-pill-gold">LangGraph v1</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white m-0 tracking-tight">
            Good evening, {firstName}
          </h1>
          <p className="text-slate-300 mt-2 mb-0 text-sm lg:text-base max-w-lg leading-relaxed">
            Identify high-value customers, score conversion likelihood, and generate personalized outreach — all in one workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => navigate('/agent')} className="hero-cta-primary">
            <Bot size={18} />
            Launch AI Agent
            <ArrowRight size={16} />
          </button>
          {pendingApprovals > 0 && (
            <button type="button" onClick={() => navigate('/messages')} className="hero-cta-secondary">
              {pendingApprovals} pending approvals
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function QuickActionsGrid() {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action) => (
        <button
          key={action.path}
          type="button"
          onClick={() => navigate(action.path)}
          className="quick-action-card group"
        >
          <div className="quick-action-icon" style={{ background: action.iconBg }}>
            <action.icon size={20} color="#ffffff" strokeWidth={2} />
          </div>
          <p className="quick-action-label">{action.label}</p>
          <p className="quick-action-desc">{action.desc}</p>
          <ArrowRight size={14} className="quick-action-arrow" />
        </button>
      ))}
    </div>
  );
}
