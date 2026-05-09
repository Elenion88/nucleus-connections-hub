// Explicit ecosystem-graph edges beyond the auto-derived affiliation/origin edges.
// These power "who knows who in Utah" — the path-finder uses both these and the affiliation edges.

export interface SeedConnection {
  id: string;
  fromKind: 'talent' | 'startup';
  fromId: string;
  toKind: 'talent' | 'startup' | 'institution';
  toId: string;
  kind: 'colleague' | 'advisor_to' | 'investor_in' | 'mentor_of' | 'lab_collaborator' | 'past_coworker' | 'cofounded_with';
  evidence?: string;
  strength?: number;
}

export const seedConnections: SeedConnection[] = [
  { id: 'c1', fromKind: 'talent', fromId: 't_dr_rashid_lee', toKind: 'startup', toId: 'st_neurotouch', kind: 'lab_collaborator', evidence: 'PI on the U of U lab where NeuroTouch was incubated', strength: 1.0 },
  { id: 'c2', fromKind: 'talent', fromId: 't_priya_anand', toKind: 'talent', toId: 't_dr_rashid_lee', kind: 'mentor_of', evidence: 'Priya was Dr. Lee\'s PhD student 2014-2018', strength: 0.95 },
  { id: 'c3', fromKind: 'talent', fromId: 't_sarah_chen', toKind: 'talent', toId: 't_lila_hashimoto', kind: 'past_coworker', evidence: 'Worked together at Recursion 2018-2023', strength: 0.9 },
  { id: 'c4', fromKind: 'talent', fromId: 't_natalie_okada', toKind: 'startup', toId: 'st_lumalign', kind: 'advisor_to', evidence: 'Currently advising on FDA strategy', strength: 0.85 },
  { id: 'c5', fromKind: 'talent', fromId: 't_devon_park', toKind: 'startup', toId: 'st_aerolith', kind: 'advisor_to', evidence: 'Informal advisor through Sarcos network', strength: 0.7 },
  { id: 'c6', fromKind: 'talent', fromId: 't_jenna_ryu', toKind: 'talent', toId: 't_devon_park', kind: 'past_coworker', evidence: 'Both at Sarcos', strength: 0.85 },
  { id: 'c7', fromKind: 'talent', fromId: 't_yoel_haddad', toKind: 'talent', toId: 't_devon_park', kind: 'past_coworker', evidence: 'Both at Sarcos', strength: 0.8 },
  { id: 'c8', fromKind: 'talent', fromId: 't_marcus_lee', toKind: 'talent', toId: 't_ben_okafor', kind: 'past_coworker', evidence: 'Both at Domo', strength: 0.7 },
  { id: 'c9', fromKind: 'talent', fromId: 't_dani_oliveira', toKind: 'talent', toId: 't_owen_vaughn', kind: 'colleague', evidence: 'Silicon Slopes meetup regulars', strength: 0.5 },
  { id: 'c10', fromKind: 'talent', fromId: 't_dr_julia_hart', toKind: 'startup', toId: 'st_terraform', kind: 'lab_collaborator', evidence: 'Co-PI on the BYU regenerative-ag lab that spun out TerraForm', strength: 1.0 },
  { id: 'c11', fromKind: 'talent', fromId: 't_dr_julia_hart', toKind: 'talent', toId: 't_mira_okonjo', kind: 'mentor_of', evidence: 'BYU CS-meets-plant-sciences research group advisor', strength: 0.7 },
  { id: 'c12', fromKind: 'talent', fromId: 't_kev_armstrong', toKind: 'startup', toId: 'st_kestrel', kind: 'mentor_of', evidence: 'Free mentor to Kestrel founders since founding', strength: 0.75 },
  { id: 'c13', fromKind: 'talent', fromId: 't_kev_armstrong', toKind: 'startup', toId: 'st_provident', kind: 'mentor_of', strength: 0.6 },
  { id: 'c14', fromKind: 'talent', fromId: 't_carlos_renteria', toKind: 'startup', toId: 'st_aerolith', kind: 'investor_in', evidence: 'Angel investor in Aerolith\'s seed', strength: 0.6 },
  { id: 'c15', fromKind: 'talent', fromId: 't_carlos_renteria', toKind: 'startup', toId: 'st_kestrel', kind: 'investor_in', strength: 0.5 },
  { id: 'c16', fromKind: 'talent', fromId: 't_quinn_blair', toKind: 'startup', toId: 'st_apex', kind: 'advisor_to', evidence: 'Regulatory advisor since pre-seed', strength: 0.85 },
  { id: 'c17', fromKind: 'talent', fromId: 't_grace_lin', toKind: 'startup', toId: 'st_aerolith', kind: 'past_coworker', evidence: 'Knew the Aerolith founders from AFWERX program-office days', strength: 0.6 },
  { id: 'c18', fromKind: 'talent', fromId: 't_morgan_ash', toKind: 'startup', toId: 'st_lumalign', kind: 'lab_collaborator', evidence: 'Huntsman Cancer Institute postdoc colleague of Lumalign founders', strength: 0.9 },
  { id: 'c19', fromKind: 'talent', fromId: 't_jared_pike', toKind: 'startup', toId: 'st_helio', kind: 'advisor_to', evidence: 'Helped close Intermountain pilot', strength: 0.7 },
  { id: 'c20', fromKind: 'talent', fromId: 't_olivia_park', toKind: 'startup', toId: 'st_neurotouch', kind: 'past_coworker', evidence: 'Worked with NeuroTouch founders at Boston Scientific', strength: 0.6 },
];
