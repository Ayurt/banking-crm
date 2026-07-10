import { Layout, Menu, Button, Avatar, Badge } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  MessageSquare,
  BarChart3,
  LogOut,
  LayoutDashboard,
  Users,
  Megaphone,
  Shield,
  Settings,
  Sparkles,
  Bell,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { key: '/agent', icon: <Bot size={18} />, label: 'AI Agent' },
  { key: '/messages', icon: <MessageSquare size={18} />, label: 'Approvals' },
  { key: '/recommendations', icon: <Sparkles size={18} />, label: 'Recommendations' },
  { key: '/customers', icon: <Users size={18} />, label: 'Customers' },
  { key: '/campaigns', icon: <Megaphone size={18} />, label: 'Campaigns' },
  { key: '/audit', icon: <Shield size={18} />, label: 'Audit' },
  { key: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { key: '/settings', icon: <Settings size={18} />, label: 'Settings' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout className="dashboard-shell">
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={260}
        theme="dark"
        className="dashboard-sider !bg-sidebar-gradient border-r border-white/5"
        style={{ background: 'linear-gradient(180deg, #0c1929 0%, #071018 60%, #040a10 100%)' }}
      >
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-gold-500 flex items-center justify-center shadow-lg shadow-brand-500/20 animate-glow">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base m-0 leading-tight">Banking CRM</p>
              <p className="text-brand-300/70 text-xs m-0">Agentic AI Platform</p>
            </div>
          </div>
        </div>

        <div className="px-3 py-4 pb-24">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-2">Navigation</p>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            className="!bg-transparent !border-none"
            style={{ background: 'transparent' }}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <Avatar
              size={36}
              className="!bg-gradient-to-br from-brand-500 to-brand-700 flex-shrink-0"
            >
              {user?.name?.[0]}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium m-0 truncate">{user?.name}</p>
              <p className="text-slate-500 text-xs m-0 truncate">Relationship Manager</p>
            </div>
          </div>
        </div>
      </Sider>

      <Layout className="dashboard-main">
        <Header
          className="dashboard-header !px-6 !py-0 flex items-center justify-between border-b border-slate-200/60 backdrop-blur-xl flex-shrink-0"
          style={{ background: 'rgba(255, 255, 255, 0.85)', height: 64 }}
        >
          <div>
            <p className="text-slate-900 font-semibold m-0 text-sm">Relationship Manager Portal</p>
            <p className="text-slate-400 text-xs m-0">Powered by LangGraph Agentic AI</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge dot color="#d4a853">
              <Button type="text" className="!text-slate-500" icon={<Bell size={18} />} />
            </Badge>
            <Button
              type="text"
              className="!text-slate-600 hover:!text-rose-500"
              icon={<LogOut size={16} />}
              onClick={() => { logout(); navigate('/login'); }}
            >
              Sign out
            </Button>
          </div>
        </Header>

        <Content className="content-shell">
          <div className="content-inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
