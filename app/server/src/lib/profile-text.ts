// Build the canonical text inputs we hand to the embedding model.
// Three slots per profile, intentionally orthogonal so the matcher can score per-dimension.

import type { Talent, Startup } from '../db/schema.ts';

export function embeddingTextsForTalent(t: Talent) {
  const skills = `Skills: ${pretty(t.skills)}. Functions: ${pretty(t.functions)}. Sectors: ${pretty(t.sectors)}.`;
  const mission = `Mission tags: ${pretty(t.missionTags)}. Risk tolerance: ${t.riskTolerance}. Stage preference: ${pretty(t.stagePreference)}. Comp shape: ${pretty(t.compShape)}. Availability: ${t.availability}.`;
  const experience = `${t.headline}. ${t.bio} Affiliations: ${pretty(t.affiliations)}. Years of experience: ${t.yearsExperience}.`;
  return { skills, mission, experience };
}

export function embeddingTextsForStartup(s: Startup) {
  const mission = `Mission: ${pretty(s.missionTags)}. Sector: ${s.sector}. Utah roots: ${pretty(s.utahRoots)}. Origin: ${s.origin}.`;
  const description = `${s.name} — ${s.oneliner}. ${s.description} TRL: ${s.trl ?? '?'}. Funding stage: ${s.fundingStage}.`;
  const needs = `Immediate needs: ${pretty(s.immediateNeeds)}. Funding sources: ${pretty(s.fundingSources ?? '')}. Stage: ${s.fundingStage}.`;
  return { mission, description, needs };
}

function pretty(piped: string) {
  return piped.split('|').map((s) => s.replace(/_/g, ' ')).filter(Boolean).join(', ');
}
