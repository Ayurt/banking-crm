import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { Building2, Shield, Sparkles, TrendingUp, Lock, Mail } from 'lucide-react';
import { login } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const features = [
  { icon: <Sparkles size={20} />, title: 'AI-Powered Insights', desc: 'Natural language queries for customer opportunities' },
  { icon: <TrendingUp size={20} />, title: 'Conversion Scoring', desc: 'Deterministic, explainable conversion likelihood' },
  { icon: <Shield size={20} />, title: 'Human-in-the-Loop', desc: 'Approve every message before outreach' },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await login(values.email, values.password);
      authLogin(res.data.accessToken, res.data.user);
      message.success('Welcome back!');
      navigate('/');
    } catch {
      message.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #071018 0%, #0c1929 40%, #142d57 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-gold-500/15 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-gold-500 flex items-center justify-center shadow-xl shadow-brand-500/30">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl m-0">Banking CRM</p>
              <p className="text-brand-300/60 text-sm m-0">Agentic AI Platform</p>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Intelligent CRM for{' '}
            <span className="gradient-text" style={{ backgroundImage: 'linear-gradient(135deg, #59c0ff, #e8c468)' }}>
              Relationship Managers
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            Identify high-value customers, score conversion likelihood, and generate personalized outreach — all with full explainability.
          </p>
        </div>

        <div className="relative z-10 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm animate-fade-in-up"
              style={{ animationDelay: `${0.3 + i * 0.1}s`, opacity: 0 }}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm m-0">{f.title}</p>
                <p className="text-slate-500 text-xs m-0">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-gold-500 flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <p className="font-bold text-xl m-0">Banking CRM AI</p>
          </div>

          <div className="premium-card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 m-0">Welcome back</h2>
              <p className="text-slate-500 mt-2 mb-0">Sign in to your Relationship Manager portal</p>
            </div>

            <Form
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ email: 'rm@bank.com', password: 'password123' }}
              size="large"
            >
              <Form.Item name="email" label={<span className="font-medium text-slate-700">Email</span>} rules={[{ required: true, type: 'email' }]}>
                <Input prefix={<Mail size={16} className="text-slate-400" />} placeholder="rm@bank.com" className="!rounded-xl" />
              </Form.Item>
              <Form.Item name="password" label={<span className="font-medium text-slate-700">Password</span>} rules={[{ required: true }]}>
                <Input.Password prefix={<Lock size={16} className="text-slate-400" />} className="!rounded-xl" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large" className="!h-12 !rounded-xl !font-semibold !mt-2">
                Sign In to Dashboard
              </Button>
            </Form>

            <p className="text-center text-xs text-slate-400 mt-6 mb-0">
              Demo credentials: rm@bank.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
