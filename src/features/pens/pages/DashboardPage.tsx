import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getToken } from '../../auth/auth';
import { requestWithRetry, coerceArray, coerceNumber, coerceString } from '../../../shared/api/http';
import { createResilientWs } from '../../../shared/ws/resilientWs';

const API = import.meta.env.VITE_API_BASE_URL;
const WS = import.meta.env.VITE_WS_BASE_URL;

interface AbnormalPig {
  wid: number;
  activity: number;
  feeding_time: number;
}

interface Pen {
  pen_id: string;
  pen_name: string;
  current_pig_count: number;
  avg_activity_level: number;
  avg_feeding_time_minutes: number;
  avg_temperature_celsius: number;
  abnormal_pigs: AbnormalPig[];
}

interface Piggery {
  piggery_id: string;
  piggery_name: string;
  total_pigs: number;
  pens: Pen[];
}

interface PenListResponse {
  piggeies: Piggery[];
}

// pen_id에서 숫자 부분 추출 (예: "pen_3" → "3")
function penIdToParam(penId: string): string {
  const m = penId.match(/(\d+)/);
  return m ? m[1] : penId;
}

function coercePen(raw: Record<string, unknown>): Pen {
  return {
    pen_id: coerceString(raw.pen_id),
    pen_name: coerceString(raw.pen_name),
    current_pig_count: coerceNumber(raw.current_pig_count),
    avg_activity_level: coerceNumber(raw.avg_activity_level),
    avg_feeding_time_minutes: coerceNumber(raw.avg_feeding_time_minutes),
    avg_temperature_celsius: coerceNumber(raw.avg_temperature_celsius),
    abnormal_pigs: coerceArray(raw.abnormal_pigs),
  };
}

function coercePiggeries(data: unknown): Piggery[] {
  const resp = data as Record<string, unknown> | null;
  if (!resp) return [];

  // 서버 키 오타/변형 방어: piggeies / piggeries 둘 다 지원
  const raw = (resp.piggeies ?? resp.piggeries) as unknown;

  return coerceArray(raw).map((p) => {
    const pr = p as Record<string, unknown>;
    return {
      piggery_id: coerceString(pr.piggery_id),
      piggery_name: coerceString(pr.piggery_name),
      total_pigs: coerceNumber(pr.total_pigs),
      pens: coerceArray(pr.pens).map((pen) => coercePen(pen as Record<string, unknown>)),
    };
  });
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [piggeries, setPiggeries] = useState<Piggery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    requestWithRetry<PenListResponse>(`${API}/pens`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => setPiggeries(coercePiggeries(data)))
      .catch(() => {})
      .finally(() => setLoading(false));

    const handle = createResilientWs({
      url: `${WS}/ws/pens?token=${token}`,
      onMessage: (data) => setPiggeries(coercePiggeries(data)),
    });

    return () => handle.close();
  }, []);

  if (loading) return <p>{t('dashboard.loading')}</p>;

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      {piggeries.map((pg) => (
        <section key={pg.piggery_id} style={{ marginBottom: 24 }}>
          <h2>{pg.piggery_name} ({t('dashboard.totalPigs')}: {pg.total_pigs})</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {pg.pens.map((pen) => (
              <div
                key={pen.pen_id}
                onClick={() => navigate(`/pens/${penIdToParam(pen.pen_id)}`)}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: 12,
                  width: 200,
                  cursor: 'pointer',
                }}
              >
                <strong>{pen.pen_name}</strong>
                <p>{t('dashboard.stock')}: {pen.current_pig_count}</p>
                <p>{t('dashboard.activity')}: {pen.avg_activity_level.toFixed(1)}</p>
                <p>{t('dashboard.feedingTime')}: {pen.avg_feeding_time_minutes.toFixed(1)}</p>
                <p>{t('dashboard.temperature')}: {pen.avg_temperature_celsius.toFixed(1)}°C</p>
                {pen.abnormal_pigs.length > 0 && (
                  <p style={{ color: 'red' }}>
                    {t('dashboard.abnormal')}: {pen.abnormal_pigs.length}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
