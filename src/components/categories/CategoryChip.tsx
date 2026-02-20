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
        "inline-flex items-center gap-1 md:gap-2 px-4 md:py-2 py-1.5 rounded-full transition-all duration-300",
        "border font-medium text-sm backdrop-blur-sm",
        isSelected 
          ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_-5px_hsl(var(--primary)/0.5)]" 
          : "border-white/10 bg-gray-200 dark:bg-white/5 hover:border-primary/50 hover:bg-gray-200 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="text-base">{category.icon}</span>
      <span className='hidden md:block'>{category.name}</span>
      {count !== undefined && (
        <span className={cn(
          "md:px-2 px-1.5 md:py-0.5 py-0.25 rounded-full md:text-xs text-xs font-semibold",
          isSelected ? "bg-primary-foreground/20" : "bg-muted"
        )}>
          {count}
        </span>
      )}
    </motion.button>
  );
}
