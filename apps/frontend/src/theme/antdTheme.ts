import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1a7ff5',
    colorSuccess: '#10b981',
    colorWarning: '#d4a853',
    colorError: '#ef4444',
    colorInfo: '#1a7ff5',
    borderRadius: 12,
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorText: '#0f172a',
    colorTextSecondary: '#64748b',
    boxShadow: '0 4px 24px -4px rgba(7, 16, 24, 0.08)',
    controlHeight: 40,
  },
  components: {
    Layout: {
      siderBg: '#071018',
      headerBg: 'rgba(255, 255, 255, 0.85)',
      bodyBg: 'transparent',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(26, 127, 245, 0.15)',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
      itemBorderRadius: 10,
      itemMarginInline: 8,
      itemHeight: 44,
    },
    Card: {
      borderRadiusLG: 16,
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#475569',
      rowHoverBg: '#f1f5f9',
    },
    Button: {
      primaryShadow: '0 4px 14px rgba(26, 127, 245, 0.35)',
    },
    Input: {
      activeBorderColor: '#1a7ff5',
      hoverBorderColor: '#33a1ff',
    },
  },
};

export const chartColors = ['#1a7ff5', '#d4a853', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4'];
