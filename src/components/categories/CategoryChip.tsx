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
        "inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
        "border-2 font-medium text-sm",
        isSelected 
          ? "border-primary bg-primary text-primary-foreground shadow-medium" 
          : "border-border bg-card hover:border-primary/50 text-foreground"
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
