// Per-talent personal roadmap. Tasks live in localStorage so the demo
// works without auth. Each task came from a "Close the gap" suggestion
// on a specific match — we keep the source so the user can see which
// match it would help most.

export interface RoadmapTask {
  id: string;                 // local uuid
  title: string;
  body: string;
  dimension: string;
  points: number;
  sourceStartupId: string;    // where the suggestion came from
  done: boolean;
  addedAt: number;            // epoch ms
}

const KEY = (talentId: string) => `nucleus.roadmap.${talentId}`;

function read(talentId: string): RoadmapTask[] {
  try {
    const raw = localStorage.getItem(KEY(talentId));
    if (!raw) return [];
    return JSON.parse(raw) as RoadmapTask[];
  } catch {
    return [];
  }
}

function write(talentId: string, tasks: RoadmapTask[]) {
  localStorage.setItem(KEY(talentId), JSON.stringify(tasks));
  // Notify listeners on this tab — storage events only fire across tabs natively.
  window.dispatchEvent(new CustomEvent('nucleus:roadmap', { detail: { talentId } }));
}

export const roadmap = {
  list: read,
  has(talentId: string, suggestion: { title: string; sourceStartupId: string }): boolean {
    return read(talentId).some(
      (t) => t.title === suggestion.title && t.sourceStartupId === suggestion.sourceStartupId,
    );
  },
  add(talentId: string, task: Omit<RoadmapTask, 'id' | 'done' | 'addedAt'>): RoadmapTask {
    const all = read(talentId);
    const existing = all.find(
      (t) => t.title === task.title && t.sourceStartupId === task.sourceStartupId,
    );
    if (existing) return existing;
    const next: RoadmapTask = {
      ...task,
      id: crypto.randomUUID?.() ?? String(Date.now()),
      done: false,
      addedAt: Date.now(),
    };
    all.unshift(next);
    write(talentId, all);
    return next;
  },
  toggle(talentId: string, taskId: string) {
    const all = read(talentId);
    const idx = all.findIndex((t) => t.id === taskId);
    if (idx < 0) return;
    all[idx] = { ...all[idx], done: !all[idx].done };
    write(talentId, all);
  },
  remove(talentId: string, taskId: string) {
    const all = read(talentId).filter((t) => t.id !== taskId);
    write(talentId, all);
  },
};
