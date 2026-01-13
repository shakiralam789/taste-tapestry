import { motion } from 'framer-motion';
import { MoodOption } from '@/types/wishbook';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  moods: MoodOption[];
  selectedMood: string | null;
  onSelect: (moodId: string) => void;
}

const moodGradients: Record<string, string> = {
  happy: 'from-amber-400 to-orange-400',
  sad: 'from-blue-400 to-indigo-500',
  nostalgic: 'from-orange-400 to-amber-600',
  motivated: 'from-coral to-rose',
  chill: 'from-teal to-cyan-500',
  lonely: 'from-indigo-400 to-purple-500',
  heartbroken: 'from-rose-400 to-pink-500',
  excited: 'from-yellow-400 to-amber-500',
  peaceful: 'from-emerald-400 to-teal',
};

export function MoodSelector({ moods, selectedMood, onSelect }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {moods.map((mood, index) => {
        const isSelected = selectedMood === mood.id;
        const gradient = moodGradients[mood.id] || 'from-primary to-secondary';
        
        return (
          <motion.button
            key={mood.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(mood.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200",
              "border-2 group",
              isSelected 
                ? "border-transparent shadow-elevated" 
                : "border-border bg-card hover:border-primary/30"
            )}
          >
            {/* Gradient Background */}
            <div className={cn(
              "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-200",
              gradient,
              isSelected ? "opacity-100" : "group-hover:opacity-10"
            )} />
            
            {/* Content */}
            <div className="relative z-10">
              <span className={cn(
                "text-3xl transition-transform duration-200",
                isSelected && "scale-110"
              )}>
                {mood.emoji}
              </span>
              <p className={cn(
                "text-sm font-medium mt-1 transition-colors",
                isSelected ? "text-primary-foreground" : "text-foreground"
              )}>
                {mood.name}
              </p>
            </div>
            
            {/* Selection Ring */}
            {isSelected && (
              <motion.div
                layoutId="mood-selector"
                className="absolute inset-0 rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-background"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
