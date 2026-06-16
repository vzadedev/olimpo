'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { SEARCH_USERS } from '@/lib/graphql';
import { cn } from '@/lib/utils';

export type MentionUser = {
  id: string;
  name?: string;
  instagramUsername?: string;
};

function displayHandle(user: MentionUser) {
  return (user.instagramUsername ?? user.name?.replace(/\s+/g, '_').toLowerCase() ?? 'user').replace(/^@/, '');
}

function getMentionQuery(text: string, cursor: number) {
  const before = text.slice(0, cursor);
  const match = before.match(/@([\w.]*)$/);
  return match ? match[1] : null;
}

export function MentionTextarea({
  value,
  onChange,
  mentionIds,
  onMentionIdsChange,
  className,
  placeholder,
  rows = 4,
  maxLength = 500,
}: {
  value: string;
  onChange: (value: string) => void;
  mentionIds: string[];
  onMentionIdsChange: (ids: string[]) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionMap, setMentionMap] = useState<Map<string, string>>(new Map());

  const { data } = useQuery(SEARCH_USERS, {
    variables: { q: mentionQuery ?? '' },
    skip: !mentionQuery || mentionQuery.length < 1,
  });

  const suggestions: MentionUser[] = data?.searchUsers ?? [];

  const handleChange = (text: string) => {
    onChange(text);
    const cursor = textareaRef.current?.selectionStart ?? text.length;
    setMentionQuery(getMentionQuery(text, cursor));
  };

  const insertMention = (user: MentionUser) => {
    const handle = displayHandle(user);
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const replaced = before.replace(/@[\w.]*$/, `@${handle} `);
    const next = replaced + after;
    onChange(next);
    const nextMap = new Map(mentionMap);
    nextMap.set(handle.toLowerCase(), user.id);
    setMentionMap(nextMap);
    const ids = Array.from(new Set([...mentionIds, user.id]));
    onMentionIdsChange(ids);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const pos = replaced.length;
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onClick={(e) => {
          const t = e.currentTarget;
          setMentionQuery(getMentionQuery(t.value, t.selectionStart));
        }}
        onKeyUp={(e) => {
          const t = e.currentTarget;
          setMentionQuery(getMentionQuery(t.value, t.selectionStart));
        }}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary',
          className,
        )}
      />
      {mentionQuery !== null && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {suggestions.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(u);
                }}
              >
                <span className="font-semibold text-primary">@{displayHandle(u)}</span>
                {u.name && <span className="text-muted-foreground">{u.name}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function renderMentionContent(content: string) {
  const parts = content.split(/(@[\w.]+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="font-semibold text-primary">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
