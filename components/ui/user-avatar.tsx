import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import React from 'react'

interface UserAvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  color,
  size = 'md',
  className,
}) => {
  const initial = name.charAt(0).toUpperCase()

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return (
    <div className={cn('relative group', className)}>
      <div
        className="absolute inset-0 rounded-full opacity-20 animate-pulse group-hover:animate-none group-hover:opacity-30 transition-all"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute -inset-1 rounded-full opacity-10 group-hover:opacity-20 transition-all animate-pulse group-hover:animate-none"
        style={{ backgroundColor: color }}
      />
      <Avatar
        className={cn(
          'relative border-2 transition-transform group-hover:scale-105 bg-background',
          sizeClasses[size]
        )}
        style={{
          borderColor: color + '50',
        }}
      >
        <AvatarFallback style={{ color }}>{initial}</AvatarFallback>
      </Avatar>
    </div>
  )
}

export default UserAvatar
