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
      className="group relative overflow-hidden rounded-2xl bg-card/40 border border-white/5 backdrop-blur-sm hover:border-primary/30 transition-colors"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10" />
      
      {/* Image Header */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={capsule.image}
          alt={capsule.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:blur-[2px]"
        />
        
        {/* Period Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 z-20">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-white">{capsule.period}</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-5 z-20 -mt-12">
        <h3 className="font-display text-xl font-bold text-white mb-2 drop-shadow-lg">
           {capsule.title}
        </h3>
        <p className="text-sm text-gray-300 line-clamp-2 mb-4 h-10">
          {capsule.description}
        </p>

        {/* Emotions */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {capsule.emotions.slice(0, 3).map((emotion) => (
            <span 
              key={emotion}
              className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-sm bg-primary/10 text-primary border border-primary/20"
            >
              {emotion}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-primary transition-colors">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {capsule.favorites.length} memories locked
          </div>
          <Unlock className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
