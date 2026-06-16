'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { Bell } from 'lucide-react';
import {
  MARK_NOTIFICATIONS_READ,
  MY_NOTIFICATIONS,
  UNREAD_NOTIFICATION_COUNT,
} from '@/lib/graphql';
import { Sheet } from '@/components/ui/overlay';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  mention_post: 'Mencionou você em um post',
  mention_comment: 'Mencionou você em um comentário',
  like_post: 'Curtiu seu post',
  comment_post: 'Comentou no seu post',
  battle_invite: 'Convite de duelo',
  battle_accepted: 'Seu desafio foi aceito',
  battle_started: 'Sua batalha começou!',
  battle_result: 'Duelo encerrado',
  goal_completed: 'Meta atingida',
  badge_earned: 'Nova conquista',
  ranking_change: 'Mudança no ranking',
  checkin_reaction: 'Reagiu ao seu check-in',
};

function notificationHref(n: { type: string; referenceType: string }) {
  if (n.type.startsWith('battle')) return '/battles';
  if (n.type === 'goal_completed' || n.type === 'badge_earned') return '/metrics';
  if (n.referenceType === 'checkin') return '/feed';
  return '/feed';
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: countData, refetch: refetchCount } = useQuery(UNREAD_NOTIFICATION_COUNT, {
    pollInterval: 30000,
    skip: typeof window === 'undefined',
  });
  const { data, refetch } = useQuery(MY_NOTIFICATIONS, { skip: !open });
  const [markRead] = useMutation(MARK_NOTIFICATIONS_READ);

  const unread = countData?.unreadNotificationCount ?? 0;
  const notifications = data?.myNotifications ?? [];

  const openSheet = async () => {
    setOpen(true);
    await markRead({ variables: {} });
    refetchCount();
  };

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Notificações">
        <div className="p-4">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma notificação.</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n: {
                id: string;
                type: string;
                referenceType: string;
                read: boolean;
                createdAt: string;
              }) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(notificationHref(n));
                    }}
                    className={cn(
                      'block w-full rounded-xl border border-border p-3 text-left text-sm',
                      !n.read && 'bg-primary/5',
                    )}
                  >
                    <p>{TYPE_LABELS[n.type] ?? n.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Sheet>
    </>
  );
}
