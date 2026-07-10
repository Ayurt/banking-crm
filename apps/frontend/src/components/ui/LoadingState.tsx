import { Spin } from 'antd';

export default function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Spin size="small" />
        </div>
      </div>
      <p className="text-slate-500 mt-4 text-sm font-medium">{label}</p>
    </div>
  );
}
