const BATTLE_STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando resposta',
  active: 'Em andamento',
  completed: 'Finalizado',
  declined: 'Recusado',
  expired: 'Expirado',
};

export function formatBattleStatus(status: string): string {
  return BATTLE_STATUS_LABELS[status] ?? status;
}

export function getBattleStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
    case 'active':
      return 'bg-primary/15 text-primary';
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
    case 'declined':
      return 'bg-destructive/15 text-destructive';
    case 'expired':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

type BattleParticipant = { id: string; name?: string | null };

export function getBattleRelationLabel(
  battle: { challenger: BattleParticipant; challenged: BattleParticipant },
  userId?: string | null,
): string {
  const challengerName = battle.challenger.name ?? 'Atleta';
  const challengedName = battle.challenged.name ?? 'Atleta';

  if (!userId) return `${challengerName} vs ${challengedName}`;
  if (battle.challenger.id === userId) return `Você desafiou ${challengedName}`;
  if (battle.challenged.id === userId) return `${challengerName} te desafiou`;
  return `${challengerName} vs ${challengedName}`;
}

export function formatBattleDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeRemaining(until: string | Date): string {
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return 'encerrado';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}min`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function getModalityLabel(modality: string): string {
  return modality === 'max_volume' ? 'Maior volume' : 'Maior peso';
}

export function getUserHandle(user: { name?: string | null; instagramUsername?: string | null }) {
  return user.instagramUsername ? `@${user.instagramUsername}` : user.name ?? 'Atleta';
}

export function getBattleResultLabel(
  battle: {
    modality: string;
    challengerBestKg: number;
    challengedBestKg: number;
    challengerBestVolume: number;
    challengedBestVolume: number;
    winner?: { id: string } | null;
  },
  userId: string,
  challengerId: string,
): string {
  const useVolume = battle.modality === 'max_volume';
  const myBest = useVolume
    ? (userId === challengerId ? battle.challengerBestVolume : battle.challengedBestVolume)
    : (userId === challengerId ? battle.challengerBestKg : battle.challengedBestKg);
  const theirBest = useVolume
    ? (userId === challengerId ? battle.challengedBestVolume : battle.challengerBestVolume)
    : (userId === challengerId ? battle.challengedBestKg : battle.challengerBestKg);
  const unit = useVolume ? ' vol.' : 'kg';
  if (!battle.winner) return `Empate · ${myBest}${unit} vs ${theirBest}${unit}`;
  const won = battle.winner.id === userId;
  return `${won ? '🏆 Vitória' : '💀 Derrota'} · ${myBest}${unit} vs ${theirBest}${unit}`;
}
