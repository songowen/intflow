import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Activity, Clock } from 'lucide-react';
import { getToken } from '../../auth/auth';
import { requestWithRetry, coerceArray, coerceNumber } from '../../../shared/api/http';
import { createResilientWs } from '../../../shared/ws/resilientWs';
import Skeleton from '../../../shared/ui/Skeleton';
import type { PenStreamMessage } from '../../../shared/types/ws';

const API = import.meta.env.VITE_API_BASE_URL;
const WS = import.meta.env.VITE_WS_BASE_URL;
const MAX_POINTS = 10;

interface Point {
  index: number;
  activity: number;
  feeding_time: number;
}

function coercePoint(raw: Record<string, unknown>, index: number): Point {
  return {
    index,
    activity: coerceNumber(raw.activity),
    feeding_time: coerceNumber(raw.feeding_time),
  };
}

function coerceTimeSeries(data: unknown): Point[] {
  const resp = data as Record<string, unknown> | null;
  if (!resp) return [];
  return coerceArray(resp.time_series).map(
    (p, i) => coercePoint(p as Record<string, unknown>, i + 1),
  );
}

/** 차트 섹션 헤더: 아이콘 배지 + 제목 */
function ChartHeader({ icon: Icon, title, color }: { icon: typeof Activity; title: string; color: string }) {
  return (
    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: '#e0edff',
        }}
      >
        <Icon size={18} color={color} />
      </span>
      {title}
    </h2>
  );
}

export default function PenDetailPage() {
  const { penId } = useParams<{ penId: string }>();
  const { t } = useTranslation();
  const [series, setSeries] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const counterRef = useRef(0);

  useEffect(() => {
    const token = getToken();
    if (!token || !penId) return;

    requestWithRetry<Record<string, unknown>>(`${API}/pens/${penId}/detail`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        const pts = coerceTimeSeries(data);
        counterRef.current = pts.length;
        setSeries(pts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const handle = createResilientWs({
      url: `${WS}/ws/pens/${penId}?token=${token}`,
      onMessage: (data) => {
        const raw = data as Partial<PenStreamMessage> | null;
        if (!raw) return;
        const inner = ((raw as Record<string, unknown>).data ?? raw) as Record<string, unknown>;
        const pt = coercePoint(inner, ++counterRef.current);
        // 최대 10개 유지: 오래된 것 제거 후 새 포인트 추가
        setSeries((prev) => [...prev.slice(-(MAX_POINTS - 1)), pt]);
      },
    });

    return () => handle.close();
  }, [penId]);

  if (loading) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <Skeleton width={180} height={24} style={{ marginBottom: 24 }} />
        {/* 차트 스켈레톤 ×2 */}
        {[0, 1].map((i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <Skeleton width={160} height={20} style={{ marginBottom: 12 }} />
            <Skeleton height={250} borderRadius={12} />
          </div>
        ))}
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <h1>{t('penDetail.title')}</h1>
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>{t('penDetail.empty')}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <h1>{t('penDetail.title')}</h1>

      <ChartHeader icon={Activity} title={t('penDetail.activityChart')} color="#8884d8" />
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="activity" stroke="#8884d8" dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <ChartHeader icon={Clock} title={t('penDetail.feedingChart')} color="#82ca9d" />
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="feeding_time" stroke="#82ca9d" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
