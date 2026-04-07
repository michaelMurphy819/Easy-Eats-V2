'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/db/queries/client';
import { CommentItem, type CommentData } from './CommentItem';

const supabase = createClient();

interface CommentThreadProps {
  recipeId: string;
}

function buildTree(rows: CommentData[]): CommentData[] {
  const byId = new Map<string, CommentData>();
  const roots: CommentData[] = [];
  rows.forEach((r) => byId.set(r.id, { ...r, replies: [] }));
  rows.forEach((r) => {
    const node = byId.get(r.id)!;
    const parentId = (r as any).parent_id as string | null;
    if (parentId && byId.has(parentId)) byId.get(parentId)!.replies!.push(node);
    else roots.push(node);
  });
  return roots;
}

export function CommentThread({ recipeId }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('User');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
  // Explicitly typing the destructured response
  supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
    if (data.user) {
      setUserId(data.user.id);
      setAuthorName(
        data.user.user_metadata?.username ?? 
        data.user.email?.split('@')[0] ?? 
        'User'
      );
    }
  });
}, []);

  const fetchComments = useCallback(async () => {
    if (!recipeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`id, body, created_at, parent_id, author_id, profiles!comments_author_id_fkey (*)`)
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: true });

      if (!error) {
        const shaped = (data ?? []).map((row: any) => ({
          id: row.id,
          author_name: row.profiles?.username || 'User',
          body: row.body,
          created_at: row.created_at,
          parent_id: row.parent_id,
        }));
        setComments(buildTree(shaped));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => { fetchComments(); }, [recipeId, fetchComments]);

  const postComment = async () => {
    const trimmed = body.trim();
    if (!trimmed || submitting || !userId) return;
    setSubmitting(true);

    const { error } = await supabase.from('comments').insert({
      recipe_id: recipeId,
      author_id: userId,
      body: trimmed,
      parent_id: null,
    });

    if (!error) {
      setBody('');
      fetchComments();
    }
    setSubmitting(false);
  };

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      {totalCount > 0 && (
        <p className="text-[10px] text-foreground/40 uppercase tracking-[0.2em] font-black">
          {totalCount} {totalCount === 1 ? 'comment' : 'comments'}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={20} /></div>
      ) : comments.length === 0 ? (
        <p className="text-center py-10 text-foreground/30 text-sm italic">No comments yet.</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} onReply={() => fetchComments()} />
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-6 border-t border-border mt-8">
        <input
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={userId ? "Add a comment..." : "Login to comment"}
          disabled={!userId}
          className="flex-1 bg-foreground/[0.03] border border-border rounded-2xl px-5 py-3 text-sm text-foreground placeholder:text-foreground/20 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
        />
        <button
          onClick={postComment}
          disabled={!body.trim() || submitting || !userId}
          className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-background shadow-lg shadow-primary/20 disabled:opacity-30 transition-transform active:scale-90"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}