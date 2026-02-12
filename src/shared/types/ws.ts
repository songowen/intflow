/* 이상 개체 */
export interface AbnormalPig {
  wid: number;
  thumbnail_url?: string;
  activity: number;
  feeding_time: number;
}

/* 돈방 */
export interface Pen {
  pen_id: string;
  pen_name: string;
  current_pig_count: number;
  avg_activity_level: number;
  avg_feeding_time_minutes: number;
  avg_temperature_celsius: number;
  abnormal_pigs: AbnormalPig[];
}

/* 돈사 */
export interface Piggery {
  piggery_id: string;
  piggery_name: string;
  total_pigs: number;
  pens: Pen[];
}

/* GET /pens 응답 (WS 메시지 동일 구조) */
export interface DashboardPensMessage {
  piggeies: Piggery[];
}

/* WS /ws/pens/:penId 스트림 메시지 */
export interface PenStreamMessage {
  pen_id: string;
  timestamp: string;
  data: {
    activity: number;
    feeding_time: number;
  };
}
