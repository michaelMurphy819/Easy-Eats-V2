import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  /** Optional custom color, defaults to the theme's primary blue */
  color?: string;
}

export const Avatar = ({ name, size = 'md', color }: AvatarProps) => {
  const dimensions = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-[30px] h-[30px] text-[11px]",
    lg: "w-[74px] h-[74px] text-[26px]",
  };

  return (
    <div 
      className={`
        ${dimensions[size]} 
        rounded-full flex items-center justify-center font-black 
        text-background flex-shrink-0
        ${!color ? 'bg-primary' : ''}
      `}
      style={color ? { backgroundColor: color } : {}}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
};