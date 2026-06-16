'use client';

import { useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { CREATE_REEL_COMMENT, REEL_COMMENTS } from '@/lib/graphql';
import { toast } from '@/store/toast';
import { getGraphQLErrorMessage } from '@/lib/apollo-utils';
import { Sheet } from '@/components/ui/overlay';

type Props = {
  submissionId: string;
  open: boolean;
  onClose: () => void;
};

export function ReelCommentsSheet({ submissionId, open, onClose }: Props) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; userName: string } | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data, loading, fetchMore, refetch } = useQuery(REEL_COMMENTS, {
    variables: { submissionId, offset: 0, limit },
    skip: !open,
  });

  const [createComment, { loading: sending }] = useMutation(CREATE_REEL_COMMENT, {
    refetchQueries: [{ query: REEL_COMMENTS, variables: { submissionId, offset: 0, limit } }],
    awaitRefetchQueries: true,
  });

  const page = data?.reelComments;
  const items = page?.items ?? [];
  const hasMore = page?.hasMore ?? false;
  const total = page?.total ?? 0;

  const loadMore = () => {
    const next = offset + limit;
    fetchMore({
      variables: { submissionId, offset: next, limit },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          reelComments: {
            ...fetchMoreResult.reelComments,
            items: [...prev.reelComments.items, ...fetchMoreResult.reelComments.items],
          },
        };
      },
    });
    setOffset(next);
  };

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await createComment({
        variables: {
          input: {
            submissionId,
            text: text.trim(),
            parentId: replyTo?.id,
          },
        },
      });
      setText('');
      setReplyTo(null);
      setOffset(0);
      refetch();
    } catch (err) {
      toast.error(getGraphQLErrorMessage(err, 'Erro ao comentar'));
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Comentários (${total})`}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 hide-scrollbar">
          {loading && items.length === 0 && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          {items.map((c: {
            id: string;
            userName: string;
            text: string;
            replies?: Array<{ id: string; userName: string; text: string }>;
          }) => (
            <div key={c.id}>
              <div className="flex gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
                  <div className="flex h-full items-center justify-center text-sm font-bold text-muted-foreground">
                    {c.userName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold">{c.userName}</span>
                  <p className="text-sm mt-0.5 leading-relaxed">{c.text}</p>
                  <button
                    type="button"
                    className="mt-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setReplyTo({ id: c.id, userName: c.userName })}
                  >
                    Responder
                  </button>
                </div>
              </div>
              
              {c.replies?.length ? (
                <div className="ml-12 mt-3 space-y-3 border-l-2 border-border pl-3">
                  {c.replies.map((r) => (
                    <div key={r.id} className="flex gap-2.5">
                      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">
                        <div className="flex h-full items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {r.userName?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold">{r.userName}</span>
                        <p className="text-xs mt-0.5 leading-relaxed">{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Seja o primeiro a comentar!
            </div>
          )}
          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              className="w-full rounded-full bg-muted/50 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Mostrar mais respostas
            </button>
          )}
        </div>

        <div className="border-t border-border p-4 pb-safe bg-surface">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Respondendo @{replyTo.userName}</span>
              <button type="button" className="font-semibold hover:text-foreground" onClick={() => setReplyTo(null)}>
                Cancelar
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-1 rounded-full border border-border bg-muted/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <button
              type="button"
              disabled={sending || !text.trim()}
              onClick={submit}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-black transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
