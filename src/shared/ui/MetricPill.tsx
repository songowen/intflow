import type { LucideIcon } from 'lucide-react';

interface MetricPillProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** 값 색상 오버라이드 */
  valueColor?: string;
  /** 아이콘 색상 (기본 #3b82f6) */
  iconColor?: string;
}

/** 아이콘 원형 배지 + 라벨/값 표시 공용 컴포넌트 */
export default function MetricPill({ icon: Icon, label, value, valueColor, iconColor = '#3b82f6' }: MetricPillProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: '#e8f0fe',
          flexShrink: 0,
        }}
      >
        <Icon size={17} color={iconColor} strokeWidth={1.8} />
      </div>
      <div style={{ lineHeight: 1.3 }}>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: valueColor ?? '#1e293b' }}>{value}</div>
      </div>
    </div>
  );
}
