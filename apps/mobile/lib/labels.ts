import type { Tone } from '@/constants/theme';
import type {
  EmotionTag,
  IndicatorType,
  PrincipleCategory,
  TradeOutcome,
} from '@/types';

export const emotionOptions: { value: EmotionTag; label: string; tone: Tone }[] = [
  { value: 'analysis', label: 'Analysis', tone: 'info' },
  { value: 'confident', label: 'Confident', tone: 'positive' },
  { value: 'anxious', label: 'Anxious', tone: 'warning' },
  { value: 'fomo', label: 'FOMO', tone: 'negative' },
  { value: 'recommended', label: 'Recommended', tone: 'violet' },
];

export function emotionMeta(tag: string | null | undefined) {
  return (
    emotionOptions.find((o) => o.value === tag) ?? {
      value: tag ?? '',
      label: 'Untagged',
      tone: 'neutral' as Tone,
    }
  );
}

export const outcomeOptions: { value: TradeOutcome; label: string; tone: Tone }[] = [
  { value: 'holding', label: 'Holding', tone: 'neutral' },
  { value: 'profit', label: 'Profit', tone: 'positive' },
  { value: 'loss', label: 'Loss', tone: 'negative' },
];

export function outcomeMeta(outcome: string | null | undefined) {
  return outcomeOptions.find((o) => o.value === outcome) ?? outcomeOptions[0];
}

export const categoryOptions: { value: PrincipleCategory; label: string; tone: Tone }[] = [
  { value: 'entry', label: 'Entry', tone: 'info' },
  { value: 'takeprofit', label: 'Take Profit', tone: 'positive' },
  { value: 'stoploss', label: 'Stop Loss', tone: 'negative' },
  { value: 'position', label: 'Position', tone: 'warning' },
  { value: 'psychology', label: 'Psychology', tone: 'violet' },
];

export function categoryMeta(category: string | null | undefined) {
  return (
    categoryOptions.find((o) => o.value === category) ?? {
      value: category ?? '',
      label: 'General',
      tone: 'neutral' as Tone,
    }
  );
}

// Same thresholds as the web Market page.
export function marketSignal(type: IndicatorType, value: number): { label: string; tone: Tone } {
  if (type === 'yield_spread') {
    if (value < 0) return { label: 'Inverted', tone: 'negative' };
    if (value < 0.5) return { label: 'Flattening', tone: 'warning' };
    return { label: 'Normal', tone: 'positive' };
  }
  if (type === 'fed_funds') {
    if (value >= 5) return { label: 'Restrictive', tone: 'negative' };
    if (value >= 3) return { label: 'Neutral', tone: 'warning' };
    return { label: 'Accommodative', tone: 'positive' };
  }
  if (value >= 6) return { label: 'Distressed', tone: 'negative' };
  if (value >= 4) return { label: 'Elevated', tone: 'warning' };
  return { label: 'Tight', tone: 'positive' };
}

export const indicatorOrder: IndicatorType[] = ['yield_spread', 'fed_funds', 'credit_spread'];

export const indicatorInfo: Record<IndicatorType, { title: string; short: string; description: string }> = {
  yield_spread: {
    title: 'Yield Curve',
    short: '10Y − 2Y',
    description: '10Y − 2Y Treasury spread. Negative = recession warning.',
  },
  fed_funds: {
    title: 'Fed Funds Rate',
    short: 'Policy rate',
    description: 'Federal Reserve benchmark rate. Higher = tighter financial conditions.',
  },
  credit_spread: {
    title: 'HY Credit Spread',
    short: 'HY OAS',
    description: 'HY bond spread over Treasuries. Rising = credit stress increasing.',
  },
};
