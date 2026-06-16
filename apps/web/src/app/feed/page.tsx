'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Plus,
  Share2,
  Trash2,
  Flag,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  ACTIVE_CHECKINS,
  CREATE_POST,
  CREATE_POST_COMMENT,
  DELETE_POST,
  POST_COMMENTS,
  POSTS_FEED,
  REELS,
  REPORT_POST,
  TOGGLE_POST_LIKE,
} from '@/lib/graphql';
import { toast } from '@/store/toast';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { getGraphQLErrorMessage } from '@/lib/apollo-utils';
import { MentionTextarea, renderMentionContent } from '@/components/MentionTextarea';
import { BattleBanners } from '@/components/BattleBanners';
import { Sheet, Modal } from '@/components/ui/overlay';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${mins || 1} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

function renderContent(content: string) {
  return renderMentionContent(content);
}

export default function FeedPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const touchStartY = useRef(0);

  const feedVars = { page: 1 };

  const { data, loading, refetch, fetchMore } = useQuery(POSTS_FEED, {
    variables: feedVars,
    skip: !token,
    fetchPolicy: 'cache-and-network',
  });
  const { data: checkinsData } = useQuery(ACTIVE_CHECKINS, { skip: !token });

  const refetchFeed = () => refetch(feedVars);

  const mutationOpts = {
    refetchQueries: [{ query: POSTS_FEED, variables: feedVars }],
    awaitRefetchQueries: true,
  };

  const [toggleLike] = useMutation(TOGGLE_POST_LIKE, mutationOpts);
  const [deletePost] = useMutation(DELETE_POST, mutationOpts);
  const [reportPost] = useMutation(REPORT_POST);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  const posts = data?.postsFeed?.posts ?? [];
  const checkins = checkinsData?.activeCheckins ?? [];
  const hasMore = data?.postsFeed?.hasMore ?? false;

  const loadMore = () => {
    if (!hasMore) return;
    const next = page + 1;
    fetchMore({
      variables: { page: next },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          postsFeed: {
            ...fetchMoreResult.postsFeed,
            posts: [...prev.postsFeed.posts, ...fetchMoreResult.postsFeed.posts],
          },
        };
      },
    });
    setPage(next);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 80 && window.scrollY < 10) refetchFeed();
  };

  const handleLike = async (postId: string) => {
    try {
      await toggleLike({ variables: { postId } });
    } catch (err) {
      toast.error(getGraphQLErrorMessage(err, 'Erro ao curtir'));
    }
  };

  const handleShare = async (content: string) => {
    try {
      await navigator.share?.({ text: content });
    } catch {
      await navigator.clipboard.writeText(content);
      toast.success('Copiado!');
    }
  };

  if (!token) return null;

  return (
    <div className="px-2 pt-4 pb-24" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feed</h1>
          <p className="text-sm text-muted-foreground">Timeline da sua cidade</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      <BattleBanners />

      {checkins.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Treinando agora</h2>
          <ul className="space-y-2">
            {checkins.slice(0, 5).map((c: {
              id: string;
              userName: string;
              gymName: string;
              reactionCount: number;
            }) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              >
                <span>
                  🏋️ {c.userName} · {c.gymName}
                </span>
                <span className="text-xs text-muted-foreground">💪 {c.reactionCount}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {loading && posts.length === 0 && (
        <p className="text-sm text-muted-foreground">Carregando feed...</p>
      )}

      <ul className="space-y-4">
        {posts.map((post: {
          id: string;
          content: string;
          createdAt: string;
          tags: string[];
          likeCount: number;
          commentCount: number;
          likedByMe: boolean;
          isOwner: boolean;
          author: { id: string; name?: string; avatarUrl?: string; instagramUsername?: string };
          lift?: { id: string; weight: number; reps: number; exerciseName: string };
        }) => (
          <li key={post.id} className="rounded-3xl border border-white/10 bg-black/40 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl transition-all hover:bg-black/50">
            <div className="mb-4 flex items-start gap-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
                {post.author.avatarUrl ? (
                  <img src={mediaUrl(post.author.avatarUrl)!} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-bold">
                    {post.author.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/profile/${post.author.id}`} className="font-bold hover:text-primary">
                  {post.author.name ?? 'Atleta'}
                </Link>
                <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setMenuPostId(post.id)} className="rounded-full p-2 hover:bg-muted">
                <MoreVertical size={18} className="text-muted-foreground" />
              </button>
            </div>

            <p className="mb-3 whitespace-pre-wrap text-[15px] leading-relaxed">{renderContent(post.content)}</p>

            {post.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <span key={t} className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}

            {post.lift && (
              <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <p className="font-bold text-primary">{post.lift.exerciseName}</p>
                <p className="text-sm font-medium">{post.lift.weight}kg × {post.lift.reps} reps</p>
              </div>
            )}

            <div className="flex items-center gap-6 border-t border-white/10 pt-4 text-sm font-medium text-white/60">
              <button
                type="button"
                onClick={() => handleLike(post.id)}
                className={cn('flex items-center gap-1.5 transition-colors hover:text-primary', post.likedByMe && 'text-primary')}
              >
                <Heart size={18} fill={post.likedByMe ? 'currentColor' : 'none'} className={post.likedByMe ? 'scale-110 transition-transform' : ''} />
                {post.likeCount}
              </button>
              <button
                type="button"
                onClick={() => setCommentPostId(post.id)}
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <MessageCircle size={18} />
                {post.commentCount}
              </button>
              <button
                type="button"
                onClick={() => handleShare(post.content)}
                className="flex items-center gap-1.5 transition-colors hover:text-foreground ml-auto"
              >
                <Share2 size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          className="mt-4 w-full rounded-xl border border-border py-2 text-sm font-semibold"
        >
          Carregar mais
        </button>
      )}

      {showCreate && (
        <CreatePostSheet
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={() => refetchFeed()}
          feedVars={feedVars}
        />
      )}

      {commentPostId && (
        <CommentsSheet
          postId={commentPostId}
          onClose={() => setCommentPostId(null)}
          onFeedRefetch={() => refetchFeed().catch(() => {})}
        />
      )}

      <Modal open={!!menuPostId} onClose={() => setMenuPostId(null)} title="Opções">
        {posts.find((p: { id: string }) => p.id === menuPostId)?.isOwner ? (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl border border-destructive/30 px-4 py-3 text-destructive"
            onClick={async () => {
              if (!menuPostId) return;
              try {
                await deletePost({ variables: { postId: menuPostId } });
                setMenuPostId(null);
                toast.success('Post excluído');
              } catch (err) {
                toast.error(getGraphQLErrorMessage(err, 'Erro ao excluir post'));
              }
            }}
          >
            <Trash2 size={16} /> Excluir
          </button>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl border border-border px-4 py-3"
            onClick={() => {
              setReportPostId(menuPostId);
              setMenuPostId(null);
            }}
          >
            <Flag size={16} /> Denunciar
          </button>
        )}
      </Modal>

      <Modal open={!!reportPostId} onClose={() => setReportPostId(null)} title="Denunciar post">
        <ReportForm
          onSubmit={async (reason) => {
            if (!reportPostId) return;
            await reportPost({ variables: { postId: reportPostId, input: { reason } } });
            setReportPostId(null);
            toast.success('Denúncia enviada');
          }}
        />
      </Modal>
    </div>
  );
}

function CreatePostSheet({
  open,
  onClose,
  onCreated,
  feedVars,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  feedVars: { page: number };
}) {
  const [content, setContent] = useState('');
  const [liftId, setLiftId] = useState('');
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [createPost, { loading }] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: POSTS_FEED, variables: feedVars }],
    awaitRefetchQueries: true,
  });
  const { data: reelsData } = useQuery(REELS, { variables: { mineOnly: true } });

  const reels = reelsData?.getReels ?? [];

  const submit = async () => {
    if (!content.trim()) return;
    try {
      await createPost({
        variables: {
          input: {
            content: content.trim(),
            liftId: liftId || undefined,
            mentionUserIds: mentionIds,
          },
        },
      });
      toast.success('Post publicado!');
      onClose();
      onCreated();
      setContent('');
      setLiftId('');
      setMentionIds([]);
    } catch (err) {
      toast.error(getGraphQLErrorMessage(err, 'Erro ao publicar'));
    }
  };

  return (
      <Sheet open={open} onClose={onClose} title="Novo post">
        <div className="p-4">
      <MentionTextarea
        value={content}
        onChange={setContent}
        mentionIds={mentionIds}
        onMentionIdsChange={setMentionIds}
        placeholder="Conte sobre seu treino... use @ para marcar"
      />
      <p className="mb-3 text-right text-xs text-muted-foreground">{content.length}/500</p>

      {reels.length > 0 && (
        <select
          value={liftId}
          onChange={(e) => setLiftId(e.target.value)}
          className="mb-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Vincular levantamento (opcional)</option>
          {reels.map((r: { id: string; exerciseName: string; weight: number; reps?: number }) => (
            <option key={r.id} value={r.id}>
              {r.exerciseName} — {r.weight}kg
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        disabled={loading || !content.trim()}
        onClick={submit}
        className="w-full rounded-xl bg-primary py-3 font-bold text-black disabled:opacity-50"
      >
        Publicar
      </button>
        </div>
      </Sheet>
  );
}

function CommentsSheet({
  postId,
  onClose,
  onFeedRefetch,
}: {
  postId: string;
  onClose: () => void;
  onFeedRefetch?: () => void;
}) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const { data, refetch: refetchComments } = useQuery(POST_COMMENTS, { variables: { postId } });
  const [createComment] = useMutation(CREATE_POST_COMMENT, {
    refetchQueries: [{ query: POST_COMMENTS, variables: { postId } }],
    awaitRefetchQueries: true,
  });

  const comments = data?.postComments ?? [];

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await createComment({
        variables: {
          postId,
          input: {
            content: text.trim(),
            parentId: replyTo ?? undefined,
            mentionUserIds: mentionIds.length ? mentionIds : undefined,
          },
        },
      });
      setText('');
      setReplyTo(null);
      setMentionIds([]);
      refetchComments();
      onFeedRefetch?.();
    } catch (err) {
      toast.error(getGraphQLErrorMessage(err, 'Erro ao comentar'));
    }
  };

  return (
    <Sheet open onClose={onClose} title={`Comentários`}>
      <div className="flex flex-col h-full">
        <ul className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
          {comments.map((c: {
            id: string;
            content: string;
            createdAt: string;
            author: { name?: string; avatarUrl?: string };
            replies?: { id: string; content: string; author: { name?: string; avatarUrl?: string } }[];
          }) => (
            <li key={c.id}>
              <div className="flex gap-3">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                  {c.author.avatarUrl ? (
                    <img src={mediaUrl(c.author.avatarUrl)!} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-bold">
                      {c.author.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link href={`/profile/${(c.author as { id?: string }).id ?? ''}`} className="text-sm font-bold hover:text-primary">
                      {c.author.name ?? 'Atleta'}
                    </Link>
                    <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-0.5">{c.content}</p>
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setReplyTo(c.id)}
                  >
                    Responder
                  </button>
                </div>
              </div>
              
              {c.replies?.length ? (
                <div className="ml-11 mt-3 space-y-3 border-l-2 border-white/10 pl-3">
                  {c.replies.map((r) => (
                    <div key={r.id} className="flex gap-2">
                      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">
                        {r.author.avatarUrl ? (
                          <img src={mediaUrl(r.author.avatarUrl)!} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] font-bold">
                            {r.author.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold">{r.author.name ?? 'Atleta'}</span>
                        <p className="text-xs mt-0.5">{r.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
          {comments.length === 0 && (
             <div className="py-8 text-center text-sm text-muted-foreground">
               Seja o primeiro a comentar!
             </div>
          )}
        <div className="border-t border-white/10 p-4 pb-safe bg-black/20">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between text-xs text-white/60">
              <span>Respondendo comentário</span>
              <button type="button" className="font-semibold hover:text-white" onClick={() => setReplyTo(null)}>
                Cancelar
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <button
              type="button"
              disabled={!text.trim()}
              onClick={submit}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-black transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_15px_rgba(214,248,0,0.3)]"
            >
              <MessageCircle size={18} />
            </button>
          </div>
        </div></div>
      </div>
    </Sheet>
  );
}

function ReportForm({ onSubmit }: { onSubmit: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState('spam');
  return (
    <>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mb-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="spam">Spam</option>
        <option value="offensive">Conteúdo ofensivo</option>
        <option value="misinformation">Informação falsa</option>
        <option value="other">Outro</option>
      </select>
      <button
        type="button"
        onClick={() => onSubmit(reason)}
        className="w-full rounded-xl bg-destructive py-3 font-bold text-white"
      >
        Enviar denúncia
      </button>
    </>
  );
}
