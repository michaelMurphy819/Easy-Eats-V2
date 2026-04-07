'use client';

import Link from 'next/link';

interface AuthorChipProps {
  username: string;       // The unique handle used for the URL routing
  displayName?: string;   // The pretty name to show
  avatarUrl?: string;     // URL from Supabase storage
  avatarEmoji?: string;   // Fallback emoji
  isOfficial?: boolean;   // To optionally show your OfficialBadge
}

export function AuthorChip({ 
  username, 
  displayName, 
  avatarUrl, 
  avatarEmoji = '👨‍🍳',
  isOfficial = false
}: AuthorChipProps) {
  
  // The display name defaults to the username if they haven't set a real name yet
  const showName = displayName || username;

  return (
    <Link href={`/profile/${username}`} onClick={(e) => e.stopPropagation()}>
      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-foreground/[0.03] border border-border/50 hover:bg-foreground/[0.08] hover:border-border transition-all cursor-pointer group">
        
        {/* Avatar Ring */}
        <div className="relative w-6 h-6 rounded-full overflow-hidden bg-background flex items-center justify-center text-xs border border-border group-hover:scale-105 transition-transform">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={showName} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span>{avatarEmoji}</span>
          )}
        </div>

        {/* Name */}
        <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors line-clamp-1">
          {showName}
        </span>

        {/* Optional Official Badge (You can plug in your OfficialBadge.tsx here later!) */}
        {isOfficial && (
          <div className="w-3 h-3 rounded-full bg-primary flex items-center justify-center">
            <svg className="w-2 h-2 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </Link>
  );
}