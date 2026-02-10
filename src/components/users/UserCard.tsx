import { motion } from 'framer-motion';
import { User } from '@/types/wishbook';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, Users } from 'lucide-react';

interface UserCardProps {
  user: User;
  onClick?: () => void;
}

export function UserCard({ user, onClick }: UserCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="elevated-card p-5 cursor-pointer border rounded-lg"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center">
        <Avatar className="w-20 h-20 ring-4 ring-primary/20 mb-4">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="text-xl">{user.name[0]}</AvatarFallback>
        </Avatar>

        <h3 className="font-semibold text-foreground mb-1">{user.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">@{user.username}</p>

        {user.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3 h-3" />
            <span>{user.location}</span>
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {user.bio}
        </p>

        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="text-center">
            <p className="font-semibold text-foreground">{user.followers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="font-semibold text-foreground">{user.following.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>

        <Button variant="gradient" className="w-full" size="sm">
          <Users className="w-4 h-4" />
          Follow
        </Button>
      </div>
    </motion.div>
  );
}
