import type { EmotionColorKey } from '@/types/wishbook';

export interface EmotionColorPreset {
  id: EmotionColorKey;
  label: string;
  color: string;
  emoji: string;
}

export const EMOTION_COLOR_PRESETS: EmotionColorPreset[] = [
  { id: 'happy', label: 'Happy', color: '#facc15', emoji: '😊' },
  { id: 'sad', label: 'Sad', color: '#3b82f6', emoji: '😢' },
  { id: 'angry', label: 'Angry', color: '#ef4444', emoji: '😠' },
  { id: 'scary', label: 'Scary', color: '#7c3aed', emoji: '😱' },
  { id: 'funny', label: 'Funny', color: '#f97316', emoji: '😂' },
  { id: 'peaceful', label: 'Peaceful', color: '#22c55e', emoji: '😌' },
  { id: 'excited', label: 'Excited', color: '#ec4899', emoji: '🤩' },
  { id: 'nostalgic', label: 'Nostalgic', color: '#d97706', emoji: '🥹' },
  { id: 'mix', label: 'Mix', color: '#a78bfa', emoji: '🌈' },
  { id: 'neutral', label: 'Neutral', color: '#94a3b8', emoji: '😐' },
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
