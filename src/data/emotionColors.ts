import type { EmotionColorKey } from '@/types/wishbook';

export interface EmotionColorPreset {
  id: EmotionColorKey;
  label: string;
  color: string;
  colorSecondary?: string;
  emoji: string;
}

export const EMOTION_COLOR_PRESETS: EmotionColorPreset[] = [
  { id: 'happy', label: 'Happy', color: '#E6C600', colorSecondary: '#B38600', emoji: '😊' },
  { id: 'sad', label: 'Sad', color: '#7BAEFF', colorSecondary: '#064080', emoji: '😢' },
  { id: 'angry', label: 'Angry', color: '#FF7B7B', colorSecondary: '#660000', emoji: '😠' },
  { id: 'scary', label: 'Scary', color: '#B899FF', colorSecondary: '#2F1A66', emoji: '😱' },
  { id: 'funny', label: 'Funny', color: '#FFB36A', colorSecondary: '#6A2F00', emoji: '😂' },
  { id: 'peaceful', label: 'Peaceful', color: '#8FE0B3', colorSecondary: '#14532D', emoji: '😌' },
  { id: 'excited', label: 'Excited', color: '#FF80C8', colorSecondary: '#66003A', emoji: '🤩' },
  { id: 'nostalgic', label: 'Nostalgic', color: '#FFD17A', colorSecondary: '#8C5500', emoji: '🥹' },
  { id: 'mix', label: 'Mix', color: '#C9B3FF', colorSecondary: '#321E66', emoji: '🌈' },
  { id: 'neutral', label: 'Neutral', color: '#D1D5DB', colorSecondary: '#1F2937', emoji: '😐' },
];

const COLOR_BY_KEY: Record<EmotionColorKey, string> = EMOTION_COLOR_PRESETS.reduce(
  (acc, p) => {
    acc[p.id] = p.color;
    return acc;
  },
  {} as Record<EmotionColorKey, string>
);

/** Returns CSS fill for a segment (hex color). */
export function getEmotionFill(key: EmotionColorKey | undefined): string {
  if (!key) return '';
  return COLOR_BY_KEY[key] ?? '';
}

export function getEmotionPreset(key: EmotionColorKey | undefined): EmotionColorPreset | undefined {
  if (!key) return undefined;
  return EMOTION_COLOR_PRESETS.find((p) => p.id === key);
}
