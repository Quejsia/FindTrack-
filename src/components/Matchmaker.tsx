import React, { useState, useEffect } from 'react';
import { Item, Match } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BrainCircuit, CheckSquare, XCircle, AlertCircle, RefreshCw, Check } from 'lucide-react';

interface MatchmakerProps {
  item: Item;
  allOppositeItems: Item[]; // Items of opposite type (lost <=> found)
  onResolveItem: (itemId: string, matchingItemId: string) => Promise<void>;
  userUid?: string;
}

interface AIMatch {
  itemId: string;
  confidenceScore: number;
  matchReason: string;
}

export default function Matchmaker({ item, allOppositeItems, onResolveItem, userUid }: MatchmakerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [aiMatches, setAiMatches] = useState<AIMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Trigger matches recalculation via Gemini AI on item load/change
  const triggerAIMatch = async () => {
    if (!item || allOppositeItems.length === 0) {
      setAiMatches([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-matchmaker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemToMatch: item,
          candidates: allOppositeItems.filter(i => i.status === 'active'),
        }),
      });

      if (!response.ok) {
        throw new Error('Could not compute similarity profile via Gemini.');
      }

      const data = await response.json();
      setAiMatches(data.matches || []);
    } catch (err) {
      console.error('Matchmaker request exception:', err);
      setError('Failed to compute recommendations. Please check system key configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    triggerAIMatch();
  }, [item, allOppositeItems]);

  const handleConfirmMatch = async (matchedItem: Item) => {
    setResolvingId(matchedItem.id);
    try {
      await onResolveItem(item.id, matchedItem.id);
    } catch (err) {
      console.error('Core match resolution failed:', err);
    } finally {
      setResolvingId(null);
    }
  };

  // Find matching full items configurations
  const renderMatches = aiMatches
    .map(match => {
      const matchedRecord = allOppositeItems.find(i => i.id === match.itemId);
      if (!matchedRecord || matchedRecord.status !== 'active') return null;
      return {
        ...match,
        item: matchedRecord,
      };
    })
    .filter((m): m is AIMatch & { item: Item } => m !== null);

  const isOwner = item.userId === userUid;

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4" id="matchmaker-section">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="h-5 w-5 text-indigo-600" />
          <h4 className="font-sans text-sm font-bold text-slate-900">Gemini AI Matchmaker</h4>
        </div>

        <button
          onClick={triggerAIMatch}
          disabled={loading || allOppositeItems.length === 0}
          title="Recalculate Matches"
          className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-all shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <p className="font-sans text-xs text-slate-500 mb-4 leading-relaxed">
        Our server-side cognitive models compare descriptions, locations, times, and categories in real-time to find links.
      </p>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <Sparkles className="h-6 w-6 text-indigo-500 animate-spin" />
          <p className="font-sans text-xs font-medium text-indigo-600">Generating cognitive similarity correlations...</p>
        </div>
      ) : error ? (
        <div className="flex items-start bg-red-50/85 p-3 rounded-lg border border-red-100 text-red-700 font-sans text-xs space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      ) : allOppositeItems.length === 0 ? (
        <div className="flex items-center bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-500 font-sans text-xs space-x-2">
          <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
          <span>No opposite registry elements are currently available for matchmaking comparison.</span>
        </div>
      ) : renderMatches.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-white">
          <Sparkles className="h-5 w-5 text-slate-300 mx-auto mb-1.5" />
          <p className="font-sans text-xs text-slate-400">No matching items resolved confidence score &gt; 35%.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {renderMatches.map(match => {
              const scoreColor = 
                match.confidenceScore >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                match.confidenceScore >= 60 ? 'text-amber-600 bg-amber-50 border-amber-100' :
                'text-indigo-600 bg-indigo-50 border-indigo-100';

              const progressColor = 
                match.confidenceScore >= 80 ? 'bg-emerald-500' :
                match.confidenceScore >= 60 ? 'bg-amber-400' :
                'bg-indigo-500';

              return (
                <motion.div
                  key={match.item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-indigo-300 transition-all"
                  id={`ai-match-card-${match.item.id}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h5 className="font-sans text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                        {match.item.title}
                      </h5>
                      <span className="font-mono text-[9px] text-indigo-600 uppercase font-bold">
                        {match.item.category} • {match.item.location}
                      </span>
                    </div>

                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border shrink-0 ${scoreColor}`}>
                      {match.confidenceScore}% Match
                    </span>
                  </div>

                  <p className="font-sans text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic leading-relaxed mb-3">
                    {match.matchReason}
                  </p>

                  <div className="flex items-center gap-3">
                    {/* Linear score meter bar */}
                    <div className="flex-1 h-1.5 bg-slate-150 rounded-full overflow-hidden">
                      <div className={`h-full ${progressColor}`} style={{ width: `${match.confidenceScore}%` }}></div>
                    </div>

                    {isOwner ? (
                      <button
                        onClick={() => handleConfirmMatch(match.item)}
                        disabled={resolvingId !== null}
                        className="inline-flex items-center space-x-1 rounded bg-slate-900 hover:bg-slate-850 px-2 py-1 font-sans text-[10px] font-bold text-white shrink-0 shadow-sm transition-all"
                      >
                        {resolvingId === match.item.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3 text-emerald-400" />
                        )}
                        <span>Resolve Match</span>
                      </button>
                    ) : (
                      <span className="font-sans text-[10px] text-slate-450 shrink-0 italic">
                        Login as creator to resolve
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
