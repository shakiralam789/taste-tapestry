import { motion } from 'framer-motion';
import { Category } from '@/types/wishbook';
import { cn } from '@/lib/utils';

interface CategoryChipProps {
  category: Category;
  isSelected?: boolean;
  onClick?: () => void;
  count?: number;
}

export function CategoryChip({ category, isSelected, onClick, count }: CategoryChipProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
        "border font-medium text-sm backdrop-blur-sm",
        isSelected 
          ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_-5px_hsl(var(--primary)/0.5)]" 
          : "border-white/10 bg-white/5 hover:border-primary/50 hover:bg-white/10 text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="text-base">{category.icon}</span>
      <span>{category.name}</span>
      {count !== undefined && (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-xs font-semibold",
          isSelected ? "bg-primary-foreground/20" : "bg-muted"
        )}>
          {count}
        </span>
      )}
    </motion.button>
  );
}
