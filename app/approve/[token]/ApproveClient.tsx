'use client';

import React, { useState, useTransition } from 'react';
import { recordApproval } from '@/lib/deliverables/approval-actions';
import { CheckCircle2, MessageSquare } from 'lucide-react';

type Props = {
  token: string;
  deliverableTitle: string;
  deliverableType: string;
  brandName: string;
};

type SubmitState = 'idle' | 'approved' | 'revision_requested';

export function ApproveClient({ token, deliverableTitle, deliverableType, brandName }: Props) {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await recordApproval(token, 'approved');
      if ('error' in result) {
        setErrorMsg(result.error);
        return;
      }
      setSubmitState('approved');
    });
  };

  const handleRevision = () => {
    if (!showNotes) {
      setShowNotes(true);
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const result = await recordApproval(token, 'revision_requested', notes.trim() || undefined);
      if ('error' in result) {
        setErrorMsg(result.error);
        return;
      }
      setSubmitState('revision_requested');
    });
  };

  if (submitState === 'approved') {
    return (
      <div className="rounded-xl p-10 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD7CE' }}>
        <CheckCircle2 className="mx-auto mb-4 h-10 w-10" style={{ color: '#5A8A6A' }} />
        <p className="mb-2 text-xl font-medium" style={{ color: '#1A1714', fontFamily: 'var(--font-fraunces, serif)' }}>Approved!</p>
        <p className="text-sm" style={{ color: '#A09890', lineHeight: '1.6' }}>
          Your approval has been recorded. Your social media manager will be notified.
        </p>
      </div>
    );
  }

  if (submitState === 'revision_requested') {
    return (
      <div className="rounded-xl p-10 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD7CE' }}>
        <MessageSquare className="mx-auto mb-4 h-10 w-10" style={{ color: '#C4909A' }} />
        <p className="mb-2 text-xl font-medium" style={{ color: '#1A1714', fontFamily: 'var(--font-fraunces, serif)' }}>Revision notes sent</p>
        <p className="text-sm" style={{ color: '#A09890', lineHeight: '1.6' }}>
          Your feedback has been recorded. Your social media manager will follow up with revisions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Deliverable card */}
      <div className="rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDD7CE' }}>
        <div style={{ height: '3px', backgroundColor: '#C4909A', borderRadius: '12px 12px 0 0' }} />
        <div className="px-6 py-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.10em]" style={{ color: '#A09890' }}>
            {brandName ? `${brandName} — ` : ''}{deliverableType}
          </p>
          <p className="text-2xl font-medium" style={{ fontFamily: 'var(--font-fraunces, serif)', color: '#1A1714' }}>
            {deliverableTitle}
          </p>
          <p className="mt-3 text-sm" style={{ color: '#6B6560', lineHeight: '1.6' }}>
            Your social media manager has submitted this content for your review. Please approve it or request changes below.
          </p>
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FBF0EE', border: '1px solid rgba(192,90,72,0.2)', color: '#C05A48' }}>
          {errorMsg}
        </div>
      )}

      {/* Notes textarea (shown when revision requested) */}
      {showNotes && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-[0.06em]" style={{ color: '#A09890' }}>
            Revision notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what you'd like changed…"
            rows={4}
            className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DDD7CE',
              color: '#1A1714',
              fontFamily: 'inherit',
              lineHeight: '1.5',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#C4909A'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#DDD7CE'; }}
            disabled={isPending}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending || showNotes}
          className="flex-1 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: showNotes ? '#E8E2D9' : '#5A8A6A', color: showNotes ? '#A09890' : '#ffffff' }}
        >
          {isPending && !showNotes ? 'Submitting…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={handleRevision}
          disabled={isPending}
          className="flex-1 rounded-lg px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50"
          style={{
            backgroundColor: showNotes ? '#C4909A' : '#FAF7F4',
            color: showNotes ? '#ffffff' : '#6B6560',
            border: '1px solid #DDD7CE',
          }}
        >
          {isPending && showNotes
            ? 'Submitting…'
            : showNotes
            ? 'Send revision notes'
            : 'Request revisions'}
        </button>
      </div>

      {showNotes && (
        <button
          type="button"
          onClick={() => { setShowNotes(false); setNotes(''); }}
          className="text-center text-xs"
          style={{ color: '#A09890' }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
