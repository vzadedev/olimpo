'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { AtSign, LogOut, Moon, Sun, Upload, User as UserIcon, Image } from 'lucide-react';
import type { User } from '@gymrank/types';
import { useAuthStore } from '@/store/auth';
import { useThemeStore, applyTheme } from '@/store/theme';
import { toast } from '@/store/toast';
import { API_URL } from '@/lib/config';
import { mediaUrl } from '@/lib/media';
import { ME, UPDATE_PROFILE } from '@/lib/graphql';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const cachedUser = useAuthStore((s) => s.user);
  const { theme, setTheme } = useThemeStore();

  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [appIconUrl, setAppIconUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'wallpaper' | 'icon' | null>(null);

  const { data, loading } = useQuery<{ me: User }>(ME, { skip: !token });
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  useEffect(() => {
    const user = data?.me ?? cachedUser;
    if (user) {
      setName(user.name ?? '');
      setInstagram(user.instagramUsername ?? '');
      setWallpaperUrl(user.wallpaperUrl ?? null);
      setAppIconUrl(user.appIconUrl ?? null);
      if (user.theme) setTheme(user.theme as 'dark' | 'light');
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
      toast.success(type === 'wallpaper' ? 'Wallpaper carregado' : 'Ícone carregado');
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
    toast.success('Logout realizado');
    router.replace('/login');
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  if (!token) return null;

  const user = data?.me ?? cachedUser;
  const wallpaper = mediaUrl(wallpaperUrl);
  const appIcon = mediaUrl(appIconUrl);

  return (
    <div className="px-2 pb-8">
      <h1 className="mb-6 text-2xl font-bold">Configurações</h1>

      <div className="relative mb-6 h-40 overflow-hidden rounded-2xl bg-surface">
        {wallpaper ? (
          <img src={wallpaper} alt="Wallpaper" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-surface text-muted-foreground">
            Sem wallpaper
          </div>
        )}
        <label className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
          <Upload size={14} />
          {uploading === 'wallpaper' ? 'Enviando...' : 'Wallpaper'}
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
        <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-primary">
          {appIcon ? (
            <img src={appIcon} alt="Ícone" className="h-full w-full object-cover" />
          ) : (
            <UserIcon size={28} />
          )}
          <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-black">
            <Image size={12} />
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
              Rank global: {user.globalRank} ({user.globalScore} pts)
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
            placeholder="Seu nome"
          />
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
            Em breve: vincular e publicar reels no Instagram.
          </p>
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
