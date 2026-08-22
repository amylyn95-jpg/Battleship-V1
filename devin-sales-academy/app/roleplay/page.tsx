"use client";

import Link from "next/link";
import { useState } from "react";
import { GradeCard } from "@/components/score";
import { personas } from "@/content";
import {
  reportRoleplay,
  respond,
  startRoleplay,
  type RoleplayReport,
  type RoleplayState,
} from "@/lib/roleplay";
import { useProgress } from "@/lib/use-progress";
import type { Persona } from "@/lib/types";

export default function RoleplayPage() {
  const { recordPractice } = useProgress();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [state, setState] = useState<RoleplayState | null>(null);
  const [draft, setDraft] = useState("");
  const [report, setReport] = useState<RoleplayReport | null>(null);

  function begin(next: Persona) {
    setPersona(next);
    setState(startRoleplay(next));
    setReport(null);
    setDraft("");
  }

  function send() {
    if (!persona || !state || draft.trim().length === 0) return;
    setState(respond(persona, state, draft.trim()));
    setDraft("");
  }

  function end() {
    if (!persona || !state) return;
    const next = reportRoleplay(persona, state);
    setReport(next);
    recordPractice("roleplayAttempts", {
      refId: persona.id,
      overall: next.grade.overall,
      skills: ["spin", "meddiccc", "empathy"],
    });
  }

  if (!persona || !state) {
    return (
      <div className="grid gap-6">
        <header className="grid gap-3">
          <h1 className="text-3xl font-semibold">Role-play</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Pick a buyer. They start guarded and only reveal what is really going
            on if you ask open questions about things they care about. Pitch too
            early and they will push back. Overclaim and they will challenge you.
          </p>
        </header>
        <div className="grid gap-3 md:grid-cols-2">
          {personas.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => begin(option)}
              className="card text-left transition-colors hover:border-[var(--accent)]"
            >
              <p className="font-medium">{option.name}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{option.role}</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Cares about: {option.priorities.slice(0, 3).join(", ")}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Urgency: {option.urgency} · {option.decisionAuthority}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{persona.name}</h1>
            <p className="text-sm text-[var(--muted)]">{persona.role}</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setPersona(null)}>
            Change buyer
          </button>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Discovered {state.unlockedTopics.length} of {persona.layers.length} things
          they are holding back.
        </p>
      </header>

      <div className="grid gap-3">
        <div className="card">
          <p className="label">{persona.name}</p>
          <p className="prose-body mt-2">{persona.opening}</p>
        </div>

        {state.turns.map((turn, index) => (
          <div key={index} className="grid gap-3">
            <div className="card-muted ml-auto max-w-[85%] border-[var(--accent)]/40">
              <p className="label">You</p>
              <p className="prose-body mt-2">{turn.learner}</p>
            </div>
            <div className="card max-w-[85%]">
              <p className="label">{persona.name}</p>
              <p className="prose-body mt-2">{turn.personaReply}</p>
              <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
                Coach: {turn.coachNote}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!report && (
        <div className="grid gap-3">
          <textarea
            className="field min-h-28"
            placeholder="What do you say next?"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={draft.trim().length === 0}
              onClick={send}
            >
              Say it
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={state.turns.length === 0}
              onClick={end}
            >
              End call and get graded
            </button>
          </div>
        </div>
      )}

      {report && (
        <section className="grid gap-5">
          <GradeCard grade={report.grade} title="Call grading" />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card">
              <p className="label">What you uncovered</p>
              {report.discovered.length === 0 ? (
                <p className="prose-body mt-2 text-[var(--muted)]">
                  Nothing. They left the call holding everything that mattered.
                </p>
              ) : (
                <ul className="mt-2 grid list-disc gap-1.5 pl-4">
                  {report.discovered.map((topic) => (
                    <li key={topic} className="prose-body">
                      {topic}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card">
              <p className="label">What they never told you</p>
              <ul className="mt-2 grid list-disc gap-1.5 pl-4">
                {report.missed.map((topic) => (
                  <li key={topic} className="prose-body">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card">
            <p className="label">Their hidden pain</p>
            <p className="prose-body mt-2">{persona.hiddenPain}</p>
            <p className="label mt-4">What they needed to see to buy</p>
            <ul className="mt-2 grid list-disc gap-1.5 pl-4">
              {persona.buyingCriteria.map((criterion) => (
                <li key={criterion} className="prose-body">
                  {criterion}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => begin(persona)}>
              Run it again
            </button>
            <button type="button" className="btn-secondary" onClick={() => setPersona(null)}>
              Try a different buyer
            </button>
            <Link href="/progress" className="btn-secondary">
              Track improvement
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
