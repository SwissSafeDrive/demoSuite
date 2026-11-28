import { useEffect, useState } from "react";
import { flagPass, getPass, submitDecision } from "./api";
import { reviewStateLabels } from "./candidate-display";
import RecordedPlayer from "./media/RecordedPlayer";
import { observationSummary } from "./observation-summary";
import type { Decision, Pass, PassSelection, ReviewState } from "./types";
import "./case-analysis.css";

type CaseAnalysisProps = {
  selection: PassSelection;
  onOpenPass: (selection: PassSelection) => void;
  onBack: () => void;
};

const reviewActions = [
  { state: "discarded", label: "Discard" },
  { state: "reviewed", label: "Mark for review" },
  { state: "confirmed", label: "Confirm infraction" },
] as const;

export default function CaseAnalysis({ selection, onOpenPass, onBack }: CaseAnalysisProps) {
  const { passId, clipId, seekTime } = selection;
  const [pass, setPass] = useState<(Pass & Decision) | "error" | null>(null);
  const [saving, setSaving] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<"saved" | "error" | null>(null);
  const [flagError, setFlagError] = useState(false);

  useEffect(() => {
    let active = true;
    void getPass(passId).then(
      (loaded) => {
        if (active) setPass(loaded);
      },
      () => {
        if (active) setPass("error");
      },
    );
    return () => {
      active = false;
    };
  }, [passId]);

  async function saveDecision(state: ReviewState) {
    setSaving(true);
    setDecisionFeedback(null);
    try {
      const updated = await submitDecision(passId, state);
      setPass((current) => (current && current !== "error" ? { ...current, ...updated } : current));
      setDecisionFeedback("saved");
    } catch {
      setDecisionFeedback("error");
    } finally {
      setSaving(false);
    }
  }

  async function saveFlag() {
    setSaving(true);
    setFlagError(false);
    try {
      const { flagged_manually } = await flagPass(passId);
      setPass((current) => (current && current !== "error" ? { ...current, flagged_manually } : current));
    } catch {
      setFlagError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="case-analysis">
      <header>
        <button className="case-back" type="button" onClick={onBack} disabled={saving}>
          ← Back to Candidate list
        </button>
        <h2>Single Case Analysis</h2>
        <p>
          {passId} · {clipId}
        </p>
      </header>
      {pass === "error" ? (
        <p role="alert">Could not open this Pass.</p>
      ) : pass ? (
        <>
          <RecordedPlayer
            pass={pass}
            seekTime={seekTime}
            onOpenPass={(target) => {
              if (!saving && target.passId !== passId) onOpenPass(target);
            }}
            flagControls={{ onFlag: () => void saveFlag(), flagDisabled: saving, flagError }}
          />
          <section className="case-review" aria-label="Operator decision">
            <h3>Operator decision</h3>
            <p>The system provides preliminary technical assistance. The human operator makes the final decision.</p>
            <p role="status">
              {decisionFeedback === "saved" ? "Decision saved" : "Review state"} · {reviewStateLabels[pass.state]}
            </p>
            {decisionFeedback === "error" && <p role="alert">The review decision could not be saved.</p>}
            <div className="case-actions">
              {reviewActions.map(({ state, label }) => (
                <button key={state} type="button" disabled={saving} onClick={() => void saveDecision(state)}>
                  {label}
                </button>
              ))}
            </div>
          </section>
          <section className="case-observation" aria-label="Observation summary">
            <h3>Observation summary</h3>
            <p>
              <strong>SIMULATED SIGNAL</strong> identifies simulated behaviour and related signals.
            </p>
            <ul>
              {observationSummary(pass).map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p role="status">Loading Pass…</p>
      )}
    </div>
  );
}
