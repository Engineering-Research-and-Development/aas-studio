import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export const isMobile = (): boolean => window.innerWidth < 768;

const DEFAULT_COLORS = ['#6366F1', '#10B981', '#F5A623', '#F05252', '#3B82F6', '#A855F7', '#14B8A6', '#F97316'];
export const getDefaultColor = (index: number): string => DEFAULT_COLORS[index % DEFAULT_COLORS.length];

export const formatReceivedAt = (timestamp: string): string => {
  const now = dayjs();
  const receivedTime = dayjs(timestamp);
  const diffInHours = now.diff(receivedTime, 'hour');
  if (diffInHours < 1) return receivedTime.fromNow();
  return receivedTime.format('DD/MM/YYYY HH:mm');
};