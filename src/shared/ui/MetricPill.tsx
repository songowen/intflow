import type { LucideIcon } from 'lucide-react';

interface MetricPillProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** 값 색상 오버라이드 */
  valueColor?: string;
}

/** 아이콘 원형 배지 + 라벨/값 표시 공용 컴포넌트 */
export default function MetricPill({ icon: Icon, label, value, valueColor }: MetricPillProps) {
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
          backgroundColor: '#e0edff',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color="#3b82f6" />
      </div>
      <div style={{ lineHeight: 1.3 }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: valueColor }}>{value}</div>
      </div>
    </div>
  );
}
