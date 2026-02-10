import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getToken } from '../../auth/auth';
import { requestWithRetry, coerceArray, coerceNumber } from '../../../shared/api/http';
import { createResilientWs } from '../../../shared/ws/resilientWs';

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
    (p: Record<string, unknown>, i: number) => coercePoint(p, i + 1),
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
        const raw = data as Record<string, unknown> | null;
        if (!raw) return;
        const pt = coercePoint(raw as Record<string, unknown>, ++counterRef.current);
        // 최대 10개 유지: 오래된 것 제거 후 새 포인트 추가
        setSeries((prev) => [...prev.slice(-(MAX_POINTS - 1)), pt]);
      },
    });

    return () => handle.close();
  }, [penId]);

  if (loading) return <p>{t('penDetail.loading')}</p>;

  return (
    <div>
      <h1>{t('penDetail.title')}</h1>

      <h2>{t('penDetail.activityChart')}</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="activity" stroke="#8884d8" dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <h2>{t('penDetail.feedingChart')}</h2>
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
