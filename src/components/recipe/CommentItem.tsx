'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface CommentData {
  id: string;
  author_name: string;
  author_avatar?: string;
  body: string;
  created_at: string;
  replies?: CommentData[];
}

interface CommentItemProps {
  comment: CommentData;
  depth?: number;
  onReply: (parentId: string, body: string) => Promise<void>;
}

function avatarColor(name: string): string {
  const palette = [
    'bg-amber-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-sky-500',
    'bg-orange-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return palette[hash % palette.length];
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CommentItem({ comment, depth = 0, onReply }: CommentItemProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isNested = depth > 0;
  const color = avatarColor(comment.author_name);

  const submitReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    await onReply(comment.id, trimmed);
    setReplyText('');
    setReplyOpen(false);
    setSubmitting(false);
  };

  return (
    <div className={isNested ? 'pl-6 border-l border-border ml-2' : ''}>
      <div className="flex gap-3 group py-1">
        {/* Avatar - Text-background ensures white initials on the colored circle */}
        <div
          className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-background shadow-sm ${color}`}
        >
          {comment.author_avatar ? (
            <img
              src={comment.author_avatar}
              alt={comment.author_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials(comment.author_name)
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-xs font-bold text-foreground/80">
              {comment.author_name}
            </span>
            <span className="text-[10px] text-foreground/30 font-medium">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          <p className="text-sm text-foreground/70 leading-relaxed font-medium">
            {comment.body}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            {/* Like */}
            <button
              onClick={() => {
                setLiked((l) => !l);
                setLikeCount((c) => c + (liked ? -1 : 1));
              }}
              className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${
                liked ? 'text-primary' : 'text-foreground/25 hover:text-primary'
              }`}
            >
              <Heart
                size={12}
                className={liked ? 'fill-primary' : ''}
              />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {/* Reply */}
            {depth === 0 && (
              <button
                onClick={() => setReplyOpen((o) => !o)}
                className="flex items-center gap-1 text-[11px] font-bold text-foreground/25 hover:text-foreground/60 transition-colors"
              >
                <CornerDownRight size={12} />
                Reply
              </button>
            )}
          </div>

          {/* Inline reply input */}
          <AnimatePresence>
            {replyOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="flex gap-2 p-1 bg-foreground/[0.03] rounded-2xl border border-border">
                  <input
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitReply();
                      }
                    }}
                    placeholder={`Reply to ${comment.author_name}…`}
                    className="flex-1 bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 outline-none"
                  />
                  <button
                    onClick={submitReply}
                    disabled={!replyText.trim() || submitting}
                    className="px-4 py-1.5 rounded-xl bg-primary text-background text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {submitting ? '…' : 'Post'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}