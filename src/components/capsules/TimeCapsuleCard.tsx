import { motion } from 'framer-motion';
import { TimeCapsule } from '@/types/wishbook';
import { Calendar, Lock, Unlock } from 'lucide-react';

interface TimeCapsuleCardProps {
  capsule: TimeCapsule;
  onClick?: () => void;
}

export function TimeCapsuleCard({ capsule, onClick }: TimeCapsuleCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="elevated-card overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Image Header */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={capsule.image}
          alt={capsule.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
        
        {/* Period Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium">{capsule.period}</span>
        </div>

        {/* Title */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-display text-xl font-semibold text-primary-foreground">
            {capsule.title}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {capsule.description}
        </p>

        {/* Emotions */}
        <div className="flex flex-wrap gap-1.5">
          {capsule.emotions.map((emotion) => (
            <span 
              key={emotion}
              className="px-2 py-1 text-xs rounded-full bg-accent text-accent-foreground"
            >
              {emotion}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {capsule.favorites.length} memories
          </span>
          <Unlock className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
}
