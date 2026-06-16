'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import { AtSign, LogOut, Moon, Sun, Upload, User as UserIcon, Image } from 'lucide-react';
import type { User } from '@gymrank/types';
import { useAuthStore } from '@/store/auth';
import { useThemeStore, applyTheme } from '@/store/theme';
import { toast } from '@/store/toast';
import { API_URL } from '@/lib/config';
import { mediaUrl } from '@/lib/media';
import { ME, MY_PRIVACY_SETTINGS, UPDATE_PRIVACY_SETTINGS, UPDATE_PROFILE } from '@/lib/graphql';
import { cn } from '@/lib/utils';
import { CityPicker } from '@/components/CityPicker';

export default function SettingsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const cachedUser = useAuthStore((s) => s.user);
  const { theme, setTheme } = useThemeStore();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [sex, setSex] = useState('');
  const [instagram, setInstagram] = useState('');
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [appIconUrl, setAppIconUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'wallpaper' | 'icon' | null>(null);

  const { data, loading, refetch } = useQuery<{ me: User }>(ME, { skip: !token });
  const { data: privacyData } = useQuery(MY_PRIVACY_SETTINGS, { skip: !token });
  const [updateProfile] = useMutation(UPDATE_PROFILE);
  const [updatePrivacy] = useMutation(UPDATE_PRIVACY_SETTINGS);

  const privacy = privacyData?.myPrivacySettings;

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  useEffect(() => {
    const user = data?.me ?? cachedUser;
    if (user) {
      setName(user.name ?? '');
      setCity((user as { city?: string }).city ?? '');
      setHeightCm(String((user as { heightCm?: number }).heightCm ?? ''));
      setWeightKg(String((user as { weightKg?: number }).weightKg ?? ''));
      setSex((user as { sex?: string }).sex ?? '');
      setInstagram(user.instagramUsername ?? '');
      setWallpaperUrl(user.wallpaperUrl ?? null);
      setAppIconUrl(user.appIconUrl ?? null);
      if (user.theme) {
        setTheme(user.theme as 'dark' | 'light');
        applyTheme(user.theme as 'dark' | 'light');
      }
      setUser(user);
    }
  }, [data, cachedUser, setUser, setTheme]);

  const uploadFile = async (file: File, type: 'wallpaper' | 'icon') => {
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Falha no upload');
      const { url } = await res.json();
      if (type === 'wallpaper') setWallpaperUrl(url);
      else setAppIconUrl(url);
      toast.success(type === 'wallpaper' ? 'Papel de parede atualizado' : 'Ícone atualizado');
    } catch {
      toast.error('Erro no upload');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: result } = await updateProfile({
        variables: {
          input: {
            name: name.trim() || null,
            city: city.trim() || null,
            heightCm: heightCm ? parseFloat(heightCm) : null,
            weightKg: weightKg ? parseFloat(weightKg) : null,
            sex: sex || null,
            instagramUsername: instagram.replace('@', '').trim() || null,
            wallpaperUrl: wallpaperUrl || null,
            appIconUrl: appIconUrl || null,
            theme,
          },
        },
      });
      if (result?.updateProfile) {
        setUser(result.updateProfile);
        applyTheme(theme);
        await refetch();
        toast.success('Perfil salvo com sucesso!');
      }
    } catch (err: unknown) {
      const gqlError =
        err &&
        typeof err === 'object' &&
        'graphQLErrors' in err &&
        Array.isArray((err as { graphQLErrors: { message: string }[] }).graphQLErrors)
          ? (err as { graphQLErrors: { message: string }[] }).graphQLErrors[0]?.message
          : null;
      toast.error(gqlError ?? 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Até a próxima, atleta!');
    router.replace('/login');
  };

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try {
      await updateProfile({ variables: { input: { theme: next } } });
    } catch {
      toast.error('Erro ao salvar tema');
    }
  };

  if (!token) return null;

  const user = data?.me ?? cachedUser;
  const wallpaper = mediaUrl(wallpaperUrl);
  const appIcon = mediaUrl(appIconUrl);

  return (
    <div className="px-2 pb-8">
      <h1 className="mb-6 text-2xl font-bold">Configurações</h1>

      <div className="mb-6 grid grid-cols-2 gap-2">
        {[
          { href: '/metrics', label: 'Métricas' },
          { href: '/workouts', label: 'Meus Treinos' },
          { href: '/calendar', label: 'Calendário' },
          { href: '/my-videos', label: 'Meus Vídeos' },
          { href: '/rankings', label: 'Rankings' },
          { href: '/diet', label: 'Dieta' },
          { href: '/feed', label: 'Feed' },
          { href: '/battles', label: 'Duelos' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-border bg-surface px-3 py-3 text-center text-sm font-semibold"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {user?.role === 'admin' && (
        <Link
          href="/admin/reports"
          className="mb-6 block rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-center text-sm font-semibold text-primary"
        >
          Painel de moderação
        </Link>
      )}

      <div className="relative mb-6 h-40 overflow-hidden rounded-2xl bg-surface">
        {wallpaper ? (
          <img src={wallpaper} alt="Papel de parede" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-surface text-muted-foreground">
            Sem papel de parede
          </div>
        )}
        <label className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
          <Upload size={14} />
          {uploading === 'wallpaper' ? 'Enviando...' : 'Papel de parede'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={!!uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file, 'wallpaper');
            }}
          />
        </label>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-primary">
            {appIcon ? (
              <img src={appIcon} alt="Ícone" className="h-full w-full object-cover" />
            ) : (
              <UserIcon size={28} />
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-black shadow-md">
            <Image size={14} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!!uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file, 'icon');
              }}
            />
          </label>
        </div>
        <div>
          <p className="font-bold">{user?.name || 'Atleta'}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {user?.globalRank && (
            <p className="mt-1 text-xs font-semibold text-primary">
              Ranking global: {user.globalRank} ({user.globalScore} pts)
            </p>
          )}
        </div>
      </div>

      {user?.exerciseTitles && user.exerciseTitles.length > 0 && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="mb-2 text-sm font-bold text-primary">Títulos conquistados</p>
          <ul className="space-y-1">
            {user.exerciseTitles.map((t) => (
              <li key={`${t.gymId}-${t.exerciseId}`} className="text-sm">
                🏆 {t.title} — {t.gymName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && <p className="mb-4 text-sm text-muted-foreground">Carregando...</p>}

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Seu nome de atleta"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Cidade</label>
          <CityPicker value={city} onChange={setCity} />
          <p className="mt-2 text-xs text-muted-foreground">
            Usada nos rankings da cidade e no feed social.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-3 text-sm font-semibold">Corpo & métricas</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Altura (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder="175"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder="75"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs text-muted-foreground">Sexo</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Não informado</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
              <option value="other">Outro</option>
            </select>
          </div>
          {(user as { bmi?: number })?.bmi != null && (
            <p className="mt-2 text-xs text-primary">
              IMC atual: {(user as { bmi?: number }).bmi}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Usado para metas de dieta com IA e evolução em Métricas.
          </p>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <AtSign size={14} /> Instagram
          </label>
          <div className="flex items-center rounded-xl border border-border bg-surface px-4">
            <span className="text-muted-foreground">@</span>
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
              className="w-full bg-transparent py-3 pl-1 outline-none"
              placeholder="seu_usuario"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Em breve: vincular e publicar seus destaques no Instagram.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Privacidade</label>
          <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
            {[
              { key: 'publicCheckin', label: 'Check-in público' },
              { key: 'publicProfile', label: 'Perfil público' },
              { key: 'showInRankings', label: 'Aparecer nos rankings' },
              { key: 'autoBattlePosts', label: 'Post automático ao vencer duelo' },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={privacy?.[item.key as keyof typeof privacy] ?? false}
                  onChange={async (e) => {
                    try {
                      await updatePrivacy({
                        variables: {
                          input: { [item.key]: e.target.checked },
                        },
                      });
                    } catch {
                      toast.error('Erro ao salvar privacidade');
                    }
                  }}
                  className="h-4 w-4 accent-primary"
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Tema</label>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              {theme === 'dark' ? 'Modo escuro' : 'Modo claro'}
            </span>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold',
                theme === 'dark' ? 'bg-primary text-black' : 'bg-muted',
              )}
            >
              Alternar
            </span>
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-black disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar perfil'}
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 font-medium text-destructive"
        >
          <LogOut size={18} />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
