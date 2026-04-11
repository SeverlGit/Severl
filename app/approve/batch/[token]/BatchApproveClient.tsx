'use client';

import React, { useState, useTransition } from 'react';
import { recordBatchItemApproval } from '@/lib/deliverables/batch-approval-actions';
import type { BatchDeliverable } from '@/lib/deliverables/batch-approval-actions';
import { CheckCircle2, MessageSquare, Clock } from 'lucide-react';

type Props = {
  token: string;
  clientName: string;
  deliverables: BatchDeliverable[];
};

type ItemState = {
  decision: 'approved' | 'revision_requested' | null;
  showNotes: boolean;
  notes: string;
  pending: boolean;
  error: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  not_started: '#A09890',
  in_progress: '#C4909A',
  pending_approval: '#D4A017',
  approved: '#5A8A6A',
  published: '#5A8A6A',
};

export function BatchApproveClient({ token, clientName, deliverables: initial }: Props) {
  const [items, setItems] = useState<ItemState[]>(
    initial.map(() => ({ decision: null, showNotes: false, notes: '', pending: false, error: null }))
  );

  const allDone = items.every((s) => s.decision !== null);
  const approvedCount = items.filter((s) => s.decision === 'approved').length;

  const update = (i: number, patch: Partial<ItemState>) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const handleApprove = (i: number) => {
    update(i, { pending: true, error: null });
    recordBatchItemApproval({ token, deliverableId: initial[i].id, decision: 'approved' }).then(
      (res) => {
        if ('error' in res) {
          update(i, { pending: false, error: res.error });
        } else {
          update(i, { pending: false, decision: 'approved' });
        }
      }
    );
  };

  const handleRevisionToggle = (i: number) => {
    if (!items[i].showNotes) {
      update(i, { showNotes: true });
    } else {
      update(i, { pending: true, error: null });
      recordBatchItemApproval({
        token,
        deliverableId: initial[i].id,
        decision: 'revision_requested',
        notes: items[i].notes.trim() || undefined,
      }).then((res) => {
        if ('error' in res) {
          update(i, { pending: false, error: res.error });
        } else {
          update(i, { pending: false, decision: 'revision_requested' });
        }
      });
    }
  };

  const handleApproveAll = () => {
    items.forEach((state, i) => {
      if (state.decision === null) handleApprove(i);
    });
  };

  if (allDone) {
    return (
      <div
        className="rounded-xl p-10 text-center"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD7CE' }}
      >
        <CheckCircle2 className="mx-auto mb-4 h-10 w-10" style={{ color: '#5A8A6A' }} />
        <p
          className="mb-2 text-xl font-medium"
          style={{ color: '#1A1714', fontFamily: 'var(--font-fraunces, serif)' }}
        >
          All done!
        </p>
        <p className="text-sm" style={{ color: '#A09890', lineHeight: '1.6' }}>
          {approvedCount} of {initial.length} approved. Your social media manager has been notified.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.10em]" style={{ color: '#A09890' }}>
            {clientName}
          </p>
          <p
            className="text-2xl font-medium"
            style={{ fontFamily: 'var(--font-fraunces, serif)', color: '#1A1714' }}
          >
            {initial.length} items for review
          </p>
        </div>
        <button
          type="button"
          onClick={handleApproveAll}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: '#5A8A6A' }}
        >
          Approve all
        </button>
      </div>

      {/* Item cards */}
      {initial.map((d, i) => {
        const state = items[i];
        const isResolved = state.decision !== null;

        return (
          <div
            key={d.id}
            className="rounded-xl"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD7CE' }}
          >
            <div
              style={{
                height: '3px',
                backgroundColor: isResolved
                  ? state.decision === 'approved'
                    ? '#5A8A6A'
                    : '#C4909A'
                  : '#C4909A',
                borderRadius: '12px 12px 0 0',
              }}
            />
            <div className="px-5 py-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.08em]"
                    style={{ color: '#A09890' }}
                  >
                    {d.type}
                  </p>
                  <p className="text-lg font-medium" style={{ color: '#1A1714' }}>
                    {d.title}
                  </p>
                </div>
                {isResolved && (
                  <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium">
                    {state.decision === 'approved' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" style={{ color: '#5A8A6A' }} />
                        <span style={{ color: '#5A8A6A' }}>Approved</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4" style={{ color: '#C4909A' }} />
                        <span style={{ color: '#C4909A' }}>Revisions requested</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {!isResolved && (
                <>
                  {state.error && (
                    <div
                      className="mb-3 rounded-lg px-3 py-2 text-sm"
                      style={{
                        backgroundColor: '#FBF0EE',
                        border: '1px solid rgba(192,90,72,0.2)',
                        color: '#C05A48',
                      }}
                    >
                      {state.error}
                    </div>
                  )}

                  {state.showNotes && (
                    <div className="mb-3 flex flex-col gap-2">
                      <label
                        className="text-xs font-medium uppercase tracking-[0.06em]"
                        style={{ color: '#A09890' }}
                      >
                        Revision notes
                      </label>
                      <textarea
                        value={state.notes}
                        onChange={(e) => update(i, { notes: e.target.value })}
                        placeholder="Describe what you'd like changed…"
                        rows={3}
                        className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                        style={{
                          backgroundColor: '#FAF7F4',
                          border: '1px solid #DDD7CE',
                          color: '#1A1714',
                          lineHeight: '1.5',
                        }}
                        disabled={state.pending}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(i)}
                      disabled={state.pending || state.showNotes}
                      className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      style={{
                        backgroundColor: state.showNotes ? '#E8E2D9' : '#5A8A6A',
                        color: state.showNotes ? '#A09890' : '#ffffff',
                      }}
                    >
                      {state.pending && !state.showNotes ? 'Submitting…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevisionToggle(i)}
                      disabled={state.pending}
                      className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                      style={{
                        backgroundColor: state.showNotes ? '#C4909A' : '#FAF7F4',
                        color: state.showNotes ? '#ffffff' : '#6B6560',
                        border: '1px solid #DDD7CE',
                      }}
                    >
                      {state.pending && state.showNotes
                        ? 'Submitting…'
                        : state.showNotes
                        ? 'Send notes'
                        : 'Request revisions'}
                    </button>
                  </div>

                  {state.showNotes && (
                    <button
                      type="button"
                      onClick={() => update(i, { showNotes: false, notes: '' })}
                      className="mt-2 w-full text-center text-xs"
                      style={{ color: '#A09890' }}
                    >
                      Cancel
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
