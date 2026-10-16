/**
 * Local JEE test analysis engine.
 * Deterministic calculations only: no network requests, API keys, or AI claims.
 */

const SUBJECTS = [
  { key: "physics", label: "Physics" },
  { key: "chemistry", label: "Chemistry" },
  { key: "maths", label: "Mathematics" },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

function classifyScore(score) {
  if (score === null) return "Not provided";
  if (score >= 80) return "Strong";
  if (score >= 60) return "Developing well";
  if (score >= 40) return "Needs focused practice";
  return "High-priority improvement";
}

export function analyzeJeeTest(input) {
  const subjects = SUBJECTS.map(({ key, label }) => {
    const score = numberOrNull(input[key]);
    const valid = score !== null && score >= 0 && score <= 100;
    return {
      key,
      label,
      score: valid ? score : null,
      status: classifyScore(valid ? score : null),
      weakness: valid ? Math.round(100 - score) : null,
    };
  });

  const suppliedTotal = numberOrNull(input.total);
  const validTotal = suppliedTotal !== null && suppliedTotal >= 0 && suppliedTotal <= 300;
  const providedSubjectScores = subjects.filter((s) => s.score !== null);
  const calculatedTotal = providedSubjectScores.length === 3
    ? providedSubjectScores.reduce((sum, s) => sum + s.score, 0)
    : null;
  const total = validTotal ? suppliedTotal : calculatedTotal;
  const scorePercent = total === null ? null : Math.round((total / 300) * 1000) / 10;

  const suppliedAccuracy = numberOrNull(input.accuracy);
  const accuracy = suppliedAccuracy !== null && suppliedAccuracy >= 0 && suppliedAccuracy <= 100
    ? suppliedAccuracy
    : null;

  // When accuracy is supplied, use it to refine subject priority. If not, score-based
  // weakness is used alone; do not invent question counts or error rates.
  const rankedSubjects = subjects
    .filter((s) => s.score !== null)
    .map((s) => {
      const scoreWeakness = (100 - s.score) / 100;
      const accuracyWeakness = accuracy === null ? null : (100 - accuracy) / 100;
      const priority = accuracyWeakness === null
        ? scoreWeakness
        : 0.7 * scoreWeakness + 0.3 * accuracyWeakness;
      return { ...s, priority: Math.round(priority * 100) / 100 };
    })
    .sort((a, b) => b.priority - a.priority);

  const weakAreas = String(input.report || "")
    .split(/\n|[.;•]/)
    .map((item) => item.trim().replace(/^[-*•\s]+/, ""))
    .filter(Boolean)
    .slice(0, 12);

  const recommendations = [];
  const lowest = rankedSubjects[0];
  const strongest = [...rankedSubjects].sort((a, b) => a.priority - b.priority)[0];

  if (lowest) {
    if (lowest.score < 40) {
      recommendations.push(`Start with ${lowest.label}: revise core concepts, then solve 10–15 basic questions before moving to timed practice.`);
    } else if (lowest.score < 60) {
      recommendations.push(`Prioritize ${lowest.label}: review mistakes and complete a focused set of 20–30 topic-wise questions.`);
    } else if (lowest.score < 80) {
      recommendations.push(`Improve ${lowest.label} with timed topic-wise practice and a written error log.`);
    } else {
      recommendations.push(`Maintain ${lowest.label} with mixed timed questions and regular revision; avoid neglecting the other subjects.`);
    }
  }

  if (accuracy !== null) {
    if (accuracy < 50) {
      recommendations.push("Accuracy is below 50%: slow down, attempt fewer uncertain questions, and review why each wrong answer happened.");
    } else if (accuracy < 70) {
      recommendations.push("Accuracy has room to improve: classify mistakes as concept gap, calculation error, or time pressure before the next test.");
    } else {
      recommendations.push("Protect your accuracy: review skipped questions and check whether additional attempts would be worth the negative-marking risk.");
    }
  } else {
    recommendations.push("Enter test accuracy to refine the analysis; accuracy cannot be calculated reliably from marks alone.");
  }

  if (strongest && lowest && strongest.key !== lowest.key) {
    recommendations.push(`Keep ${strongest.label} warm with short revision sessions while giving more practice time to ${lowest.label}.`);
  }

  if (weakAreas.length) {
    recommendations.push("Use the weak-area notes below as your topic-level revision checklist; topic-level accuracy needs question-wise data to be calculated.");
  } else {
    recommendations.push("Add chapter/topic-wise weak areas from the test report to get a more specific revision checklist.");
  }

  return {
    total,
    scorePercent,
    accuracy,
    subjects,
    rankedSubjects,
    weakAreas,
    recommendations,
    dataLimitations: [
      "Score percentages are not the same as accuracy.",
      "Topic-level accuracy, attempt rate, negative marks, and time-management analysis require question-wise counts or a detailed test report.",
      "Improvement trends require at least two saved test records; this screen currently analyzes the test entered here.",
    ],
  };
}
