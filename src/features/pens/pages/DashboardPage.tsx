import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PiggyBank, Activity, Clock, Thermometer,
  ChevronDown, ChevronRight, ClipboardList, Search, X,
} from 'lucide-react';
import { getToken } from '../../auth/auth';
import { requestWithRetry, coerceArray, coerceNumber, coerceString } from '../../../shared/api/http';
import { createResilientWs } from '../../../shared/ws/resilientWs';
import MetricPill from '../../../shared/ui/MetricPill';
import Skeleton from '../../../shared/ui/Skeleton';
import type { AbnormalPig, Pen, Piggery, DashboardPensMessage } from '../../../shared/types/ws';

const API = import.meta.env.VITE_API_BASE_URL;
const WS = import.meta.env.VITE_WS_BASE_URL;

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

/* ── 스타일 ── */

const tabBase: CSSProperties = {
  padding: '8px 22px',
  borderRadius: 9999,
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const tabActive: CSSProperties = { ...tabBase, background: '#1e293b', color: '#fff' };
const tabInactive: CSSProperties = { ...tabBase, background: '#fff', color: '#64748b' };

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: '#fff',
  borderRadius: 12,
  padding: '14px 20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  gap: 12,
};

const detailBtn: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  cursor: 'pointer',
  color: '#64748b',
  flexShrink: 0,
};

const abnormalCard: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: '#fff',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  padding: '10px 14px',
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [piggeries, setPiggeries] = useState<Piggery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [expandedPen, setExpandedPen] = useState<string | null>(null);
  const [selectedPig, setSelectedPig] = useState<AbnormalPig | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    requestWithRetry<DashboardPensMessage>(`${API}/pens`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        const parsed = coercePiggeries(data);
        setPiggeries(parsed);
        if (parsed.length > 0 && !activeTab) setActiveTab(parsed[0].piggery_id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const handle = createResilientWs({
      url: `${WS}/ws/pens?token=${token}`,
      onMessage: (data) => {
        const parsed = coercePiggeries(data);
        setPiggeries(parsed);
        setActiveTab((prev) => {
          if (prev && parsed.some((p) => p.piggery_id === prev)) return prev;
          return parsed[0]?.piggery_id ?? null;
        });
      },
    });

    return () => handle.close();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '16px 0' }}>
        {/* 탭 스켈레톤 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <Skeleton width={90} height={38} borderRadius={9999} />
          <Skeleton width={90} height={38} borderRadius={9999} />
        </div>
        {/* 행 스켈레톤 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ ...row, justifyContent: 'space-between' }}>
              <Skeleton width={120} height={18} />
              <div style={{ display: 'flex', gap: 24 }}>
                <Skeleton width={80} height={14} />
                <Skeleton width={80} height={14} />
                <Skeleton width={80} height={14} />
                <Skeleton width={80} height={14} />
              </div>
              <Skeleton width={36} height={36} borderRadius={8} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const current = piggeries.find((pg) => pg.piggery_id === activeTab);

  return (
    <div style={{ padding: '16px 0' }}>
      {/* 탭 pill */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {piggeries.map((pg) => (
          <button
            key={pg.piggery_id}
            onClick={() => setActiveTab(pg.piggery_id)}
            style={pg.piggery_id === activeTab ? tabActive : tabInactive}
          >
            {pg.piggery_name}
          </button>
        ))}
      </div>

      {/* 돈방 행 리스트 */}
      {current && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {current.pens.map((pen) => {
            const hasAbnormal = pen.abnormal_pigs.length > 0;
            const isExpanded = expandedPen === pen.pen_id && hasAbnormal;

            return (
              <div key={pen.pen_id}>
                {/* 행 */}
                <div
                  style={row}
                  onClick={() => hasAbnormal && setExpandedPen(isExpanded ? null : pen.pen_id)}
                >
                  {/* 접기/펼치기 아이콘 */}
                  <div style={{ width: 22, flexShrink: 0, color: '#94a3b8' }}>
                    {hasAbnormal && (isExpanded
                      ? <ChevronDown size={20} />
                      : <ChevronRight size={20} />)}
                  </div>

                  {/* 돈방 이름 + 이상 뱃지 */}
                  <div style={{ minWidth: 150, flexShrink: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {pen.pen_name}
                      {hasAbnormal && (
                        <span style={{
                          background: '#ef4444',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 10px',
                          borderRadius: 9999,
                        }}>
                          {pen.abnormal_pigs.length}{t('dashboard.countUnit')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 지표 가로 배치 */}
                  <div style={{ display: 'flex', flex: 1, justifyContent: 'space-around' }}>
                    <MetricPill
                      icon={PiggyBank}
                      label={t('dashboard.stock')}
                      value={`${pen.current_pig_count}${t('dashboard.countUnit')}`}
                    />
                    <MetricPill
                      icon={Activity}
                      label={t('dashboard.activity')}
                      value={pen.avg_activity_level ? `${pen.avg_activity_level.toFixed(1)}` : t('dashboard.noDevice')}
                      valueColor={pen.avg_activity_level ? undefined : '#94a3b8'}
                    />
                    <MetricPill
                      icon={Clock}
                      label={t('dashboard.feedingTime')}
                      value={`${pen.avg_feeding_time_minutes.toFixed(1)}${t('dashboard.feedingUnit')}`}
                    />
                    <MetricPill
                      icon={Thermometer}
                      label={t('dashboard.temperature')}
                      value={pen.avg_temperature_celsius ? `${pen.avg_temperature_celsius.toFixed(1)}°C` : t('dashboard.noDevice')}
                      valueColor={pen.avg_temperature_celsius ? undefined : '#94a3b8'}
                    />
                  </div>

                  {/* 상세 버튼 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/pens/${penIdToParam(pen.pen_id)}`); }}
                    style={detailBtn}
                  >
                    <ClipboardList size={18} />
                  </button>
                </div>

                {/* 이상 개체 확장 영역 */}
                {isExpanded && (
                  <div style={{ padding: '14px 20px 4px 54px' }}>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10, fontWeight: 500 }}>
                      {t('dashboard.abnormalList')} ({pen.abnormal_pigs.length}{t('dashboard.countUnit')})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                      {pen.abnormal_pigs.map((pig, i) => (
                        <div key={pig.wid ?? i} style={abnormalCard}>
                          {/* 썸네일 */}
                          {pig.thumbnail_url ? (
                            <img
                              src={pig.thumbnail_url}
                              alt={`#${pig.wid}`}
                              style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f1f5f9', flexShrink: 0 }} />
                          )}

                          {/* wid + 빨간 점 */}
                          <span style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', position: 'relative', marginRight: 4 }}>
                            {pig.wid}
                            <span style={{
                              position: 'absolute', top: -2, right: -7,
                              width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
                            }} />
                          </span>

                          {/* 지표 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', color: '#475569', fontSize: 13 }}>
                            <Activity size={14} color="#3b82f6" />
                            <span>{pig.activity}m</span>
                            <Clock size={14} color="#3b82f6" style={{ marginLeft: 6 }} />
                            <span>{pig.feeding_time}{t('dashboard.feedingUnit')}</span>
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPig(pig); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', padding: 4 }}
                          >
                            <Search size={16} color="#94a3b8" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 이상 개체 상세 모달 */}
      {selectedPig && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSelectedPig(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 18, padding: 28,
              width: '100%', maxWidth: 360,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{t('dashboard.pigDetail')}</h3>
              <button
                onClick={() => setSelectedPig(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 썸네일 */}
            {selectedPig.thumbnail_url ? (
              <img
                src={selectedPig.thumbnail_url}
                alt={`#${selectedPig.wid}`}
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }}
              />
            ) : (
              <div style={{ width: '100%', height: 200, borderRadius: 12, background: '#f1f5f9', marginBottom: 20 }} />
            )}

            {/* 개체 번호 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 20 }}>{selectedPig.wid}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            </div>

            {/* 지표 카드 */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{t('dashboard.activity')}</div>
                <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Activity size={16} color="#3b82f6" />
                  {selectedPig.activity}
                </div>
              </div>
              <div style={{ flex: 1, background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{t('dashboard.feedingTime')}</div>
                <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} color="#3b82f6" />
                  {selectedPig.feeding_time}{t('dashboard.feedingUnit')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
