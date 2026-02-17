import React, { useCallback, useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import NewsList from '../../components/news/NewsList.jsx';
import { newsApi } from '../../api/news.api.js';
import { RefreshCcw } from 'lucide-react';

export default function AdminNews() {
    const [news, setNews] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        const res = await newsApi.list();
        setNews(res.data.news || []);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await newsApi.refresh();
            await load();
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <Card className="rounded-3xl border border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_0_0_1px_rgba(125,211,252,0.35),inset_0_-18px_32px_-26px_rgba(6,95,130,0.28)] dark:border-slate-700 dark:bg-slate-900/40 dark:bg-none dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.08),inset_0_0_0_1px_rgba(56,189,248,0.18),inset_0_-20px_34px_-24px_rgba(15,118,110,0.22)]">
            <div className="space-y-4">
                <Card className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Administracion</p>
                            <h2 className="text-2xl font-bold">Noticias y Tendencias</h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Las noticias se actualizan automaticamente cada dia. Tambien puedes refrescar manualmente.
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 self-start rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110 disabled:opacity-50 sm:self-auto"
                        >
                            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refrescando...' : 'Refrescar'}
                        </button>
                    </div>
                </Card>
                <NewsList items={news} limit={20} />
            </div>
        </Card>
    );
}
