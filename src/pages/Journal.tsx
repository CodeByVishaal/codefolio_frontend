import { useState, useMemo } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { JournalCard } from '@/components/journal/JournalCard';
import { JournalFormModal } from '@/components/journal/JournalFormModal';
import { useJournal } from '@/hooks/useJournal';
import type { JournalEntry } from '@/types/sessions';

export function Journal() {
    const { entries, isLoading, error, createEntry, updateEntry, deleteEntry } = useJournal();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);
    const [filterTag, setFilterTag] = useState<string>('all');
    const [filterVis, setFilterVis] = useState<string>('all'); // 'all' | 'public' | 'private'

    const openEditModal = (e: JournalEntry) => { setEditingEntry(e); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditingEntry(undefined); };

    // Collect every unique tag across all entries for the filter dropdown
    // useMemo recalculates only when `entries` changes — not on every render
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
        return Array.from(tagSet).sort();
    }, [entries]);

    const filteredEntries = entries
        .filter((e) => filterTag === 'all' || e.tags.includes(filterTag))
        .filter((e) => {
            if (filterVis === 'public') return e.is_public;
            if (filterVis === 'private') return !e.is_public;
            return true;
        });

    return (
        <div className="p-8 space-y-6">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Journal</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'}
                        {filterTag !== 'all' || filterVis !== 'all' ? ' (filtered)' : ''}
                    </p>
                </div>
                <Button onClick={() => { setEditingEntry(undefined); setModalOpen(true); }} size="sm" className="gap-1.5">
                    <Plus size={15} /> New entry
                </Button>
            </div>

            {/* ── Filters ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
                {/* Tag filter — only shown when tags exist */}
                {allTags.length > 0 && (
                    <Select value={filterTag} onValueChange={(value) => value && setFilterTag(value)}>
                        <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue placeholder="All tags" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All tags</SelectItem>
                            {allTags.map((tag) => (
                                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <Select value={filterVis} onValueChange={(value) => value && setFilterVis(value)}>
                    <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder="All entries" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All entries</SelectItem>
                        <SelectItem value="public">Public only</SelectItem>
                        <SelectItem value="private">Private only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ── Error ───────────────────────────────────────────────────── */}
            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* ── Loading skeleton ─────────────────────────────────────────── */}
            {isLoading && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
                    ))}
                </div>
            )}

            {/* ── Empty state ─────────────────────────────────────────────── */}
            {!isLoading && !error && filteredEntries.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <BookOpen size={22} className="text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="font-medium text-foreground">
                            {entries.length === 0 ? 'No entries yet' : 'No entries match the filters'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {entries.length === 0
                                ? 'Document what you learn as you build.'
                                : 'Try clearing the filters.'}
                        </p>
                    </div>
                    {entries.length === 0 && (
                        <Button onClick={() => { setEditingEntry(undefined); setModalOpen(true); }} size="sm" variant="outline" className="gap-1.5">
                            <Plus size={14} /> Write first entry
                        </Button>
                    )}
                </div>
            )}

            {/* ── Journal grid ─────────────────────────────────────────────── */}
            {!isLoading && filteredEntries.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {filteredEntries.map((entry) => (
                        <JournalCard
                            key={entry.id}
                            entry={entry}
                            onEdit={openEditModal}
                            onDelete={deleteEntry}
                        />
                    ))}
                </div>
            )}

            <JournalFormModal
                open={modalOpen}
                onClose={closeModal}
                entry={editingEntry}
                onCreate={createEntry}
                onUpdate={updateEntry}
            />
        </div>
    );
}