export type NodeType =
  | 'gate'
  | 'junction'
  | 'room'
  | 'stairs'
  | 'lift'
  | 'office'
  | 'lab'
  | 'restroom';

export type EdgeType = 'walk' | 'stairs' | 'lift';

export type Node = {
  id: string;
  floor: number;
  name: string;
  x: number;
  y: number;
  type: NodeType;
  accessible?: boolean;
  description?: string;
};

export type Edge = {
  id?: number | string;
  a: string;
  b: string;
  distance: number;
  type: EdgeType;
  accessible?: boolean;
  directed?: boolean;
};

export type Floor = {
  id: number;
  name: string;
  map_url?: string | null;
  notes?: string | null;
};

export type PlaceCategory = 'classroom' | 'lab' | 'office' | 'restroom' | 'facility';

export type Place = {
  id?: number | string;
  node_id: string;
  name: string;
  aliases: string[];
  department?: string | null;
  category: PlaceCategory;
};

// ============================================================================
// DEMO DATA (Clearly identified as synthetic & unsurveyed)
// Provides realistic campus geometry for multi-floor navigation testing
// ============================================================================

export const demoFloors: Floor[] = [
  { id: 0, name: 'Ground Floor', notes: 'Main entrance, lecture halls, administration' },
  { id: 1, name: 'First Floor', notes: 'Classrooms, CS department, faculty cabins' },
  { id: 2, name: 'Second Floor', notes: 'Computing labs, AI research lab, library' },
];

export const nodes: Node[] = [
  // --- Ground Floor (Floor 0) ---
  { id: 'GATE', floor: 0, name: 'Main Gate', x: 80, y: 330, type: 'gate', accessible: true },
  { id: 'GATE_MAIN', floor: 0, name: 'Main Campus Entrance', x: 80, y: 330, type: 'gate', accessible: true },
  { id: 'G_J1', floor: 0, name: 'Ground corridor junction', x: 260, y: 330, type: 'junction', accessible: true },
  { id: 'G_CORR_WEST', floor: 0, name: 'Ground West Junction', x: 170, y: 330, type: 'junction', accessible: true },
  { id: 'G_STAIRS', floor: 0, name: 'Ground Stairs', x: 440, y: 330, type: 'stairs', accessible: false },
  { id: 'G_LIFT', floor: 0, name: 'Ground Elevator', x: 440, y: 375, type: 'lift', accessible: true },
  { id: 'G_F16', floor: 0, name: 'Room F-16 (Lecture Hall 101)', x: 260, y: 170, type: 'room', accessible: true },
  { id: 'G_F21', floor: 0, name: 'Room F-21 (Physics Seminar)', x: 440, y: 170, type: 'room', accessible: true },
  { id: 'G_ADMIN', floor: 0, name: 'Administration Office', x: 170, y: 170, type: 'office', accessible: true },
  { id: 'G_RESTROOM', floor: 0, name: 'Ground Floor Restrooms', x: 80, y: 170, type: 'restroom', accessible: true },

  // --- First Floor (Floor 1) ---
  { id: 'F1_STAIRS', floor: 1, name: 'First floor stairs', x: 440, y: 330, type: 'stairs', accessible: false },
  { id: 'F1_LIFT', floor: 1, name: 'First floor elevator', x: 440, y: 375, type: 'lift', accessible: true },
  { id: 'F1_J1', floor: 1, name: 'First floor junction', x: 260, y: 330, type: 'junction', accessible: true },
  { id: 'F1_CORR_WEST', floor: 1, name: 'First floor west junction', x: 170, y: 330, type: 'junction', accessible: true },
  { id: 'F1_S34', floor: 1, name: 'Room S-34 (Multimedia Class)', x: 260, y: 170, type: 'room', accessible: true },
  { id: 'F1_S36', floor: 1, name: 'Room S-36 (Electronics Class)', x: 80, y: 170, type: 'room', accessible: true },
  { id: 'F1_DEPT_CS', floor: 1, name: 'Computer Science Dept Office', x: 170, y: 170, type: 'office', accessible: true },
  { id: 'F1_RESTROOM', floor: 1, name: 'First floor restrooms', x: 80, y: 240, type: 'restroom', accessible: true },

  // --- Second Floor (Floor 2) ---
  { id: 'F2_STAIRS', floor: 2, name: 'Second floor stairs', x: 440, y: 330, type: 'stairs', accessible: false },
  { id: 'F2_LIFT', floor: 2, name: 'Second floor elevator', x: 440, y: 375, type: 'lift', accessible: true },
  { id: 'F2_J1', floor: 2, name: 'Second floor junction', x: 260, y: 330, type: 'junction', accessible: true },
  { id: 'F2_LAB', floor: 2, name: 'Computer Lab 201', x: 260, y: 170, type: 'lab', accessible: true },
  { id: 'F2_LAB_204', floor: 2, name: 'AI & Robotics Lab 204', x: 440, y: 170, type: 'lab', accessible: true },
  { id: 'F2_LIBRARY', floor: 2, name: 'Digital Reading Library', x: 80, y: 170, type: 'room', accessible: true },
];

export const edges: Edge[] = [
  // --- Floor 0 Internal Walkways ---
  { a: 'GATE', b: 'G_J1', distance: 18, type: 'walk', accessible: true },
  { a: 'GATE_MAIN', b: 'GATE', distance: 1, type: 'walk', accessible: true },
  { a: 'GATE_MAIN', b: 'G_J1', distance: 18, type: 'walk', accessible: true },
  { a: 'GATE_MAIN', b: 'G_CORR_WEST', distance: 9, type: 'walk', accessible: true },
  { a: 'GATE', b: 'G_CORR_WEST', distance: 9, type: 'walk', accessible: true },
  { a: 'G_CORR_WEST', b: 'G_J1', distance: 9, type: 'walk', accessible: true },
  { a: 'G_CORR_WEST', b: 'G_ADMIN', distance: 12, type: 'walk', accessible: true },
  { a: 'GATE', b: 'G_RESTROOM', distance: 12, type: 'walk', accessible: true },
  { a: 'G_J1', b: 'G_STAIRS', distance: 18, type: 'walk', accessible: true },
  { a: 'G_J1', b: 'G_LIFT', distance: 19, type: 'walk', accessible: true },
  { a: 'G_STAIRS', b: 'G_LIFT', distance: 4, type: 'walk', accessible: true },
  { a: 'G_J1', b: 'G_F16', distance: 12, type: 'walk', accessible: true },
  { a: 'G_STAIRS', b: 'G_F21', distance: 12, type: 'walk', accessible: true },

  // --- Floor Transitions (Stairs vs. Lifts) ---
  { a: 'G_STAIRS', b: 'F1_STAIRS', distance: 6, type: 'stairs', accessible: false },
  { a: 'F1_STAIRS', b: 'F2_STAIRS', distance: 6, type: 'stairs', accessible: false },
  { a: 'G_LIFT', b: 'F1_LIFT', distance: 8, type: 'lift', accessible: true },
  { a: 'F1_LIFT', b: 'F2_LIFT', distance: 8, type: 'lift', accessible: true },

  // --- Floor 1 Internal Walkways ---
  { a: 'F1_STAIRS', b: 'F1_J1', distance: 18, type: 'walk', accessible: true },
  { a: 'F1_LIFT', b: 'F1_J1', distance: 19, type: 'walk', accessible: true },
  { a: 'F1_STAIRS', b: 'F1_LIFT', distance: 4, type: 'walk', accessible: true },
  { a: 'F1_J1', b: 'F1_CORR_WEST', distance: 9, type: 'walk', accessible: true },
  { a: 'F1_J1', b: 'F1_S34', distance: 12, type: 'walk', accessible: true },
  { a: 'F1_J1', b: 'F1_S36', distance: 18, type: 'walk', accessible: true },
  { a: 'F1_CORR_WEST', b: 'F1_DEPT_CS', distance: 12, type: 'walk', accessible: true },
  { a: 'F1_CORR_WEST', b: 'F1_RESTROOM', distance: 10, type: 'walk', accessible: true },

  // --- Floor 2 Internal Walkways ---
  { a: 'F2_STAIRS', b: 'F2_J1', distance: 18, type: 'walk', accessible: true },
  { a: 'F2_LIFT', b: 'F2_J1', distance: 19, type: 'walk', accessible: true },
  { a: 'F2_STAIRS', b: 'F2_LIFT', distance: 4, type: 'walk', accessible: true },
  { a: 'F2_J1', b: 'F2_LAB', distance: 12, type: 'walk', accessible: true },
  { a: 'F2_STAIRS', b: 'F2_LAB_204', distance: 12, type: 'walk', accessible: true },
  { a: 'F2_J1', b: 'F2_LIBRARY', distance: 18, type: 'walk', accessible: true },
];

export const demoPlaces: Place[] = [
  {
    node_id: 'GATE',
    name: 'Main Campus Gate',
    aliases: ['Entrance', 'Security Check', 'Gate 1'],
    department: 'Campus Security',
    category: 'facility',
  },
  {
    node_id: 'G_F16',
    name: 'Room F-16 (Lecture Hall 101)',
    aliases: ['F16', 'Room F16', 'Lecture Hall 1', 'Class 101'],
    department: 'General Academics',
    category: 'classroom',
  },
  {
    node_id: 'G_F21',
    name: 'Room F-21 (Physics Seminar)',
    aliases: ['F21', 'Room F21', 'Physics Lab', 'Seminar Hall'],
    department: 'Physics Department',
    category: 'classroom',
  },
  {
    node_id: 'G_ADMIN',
    name: 'Dean / Administrative Office',
    aliases: ['Dean Office', 'Administration', 'Principal', 'Accounts', 'Registrar'],
    department: 'Administration',
    category: 'office',
  },
  {
    node_id: 'G_RESTROOM',
    name: 'Ground Floor Restrooms',
    aliases: ['Washroom', 'Toilet', 'Lavatory'],
    department: 'Facilities',
    category: 'restroom',
  },
  {
    node_id: 'F1_S34',
    name: 'Room S-34 (CS Classroom)',
    aliases: ['S34', 'Room S34', 'Classroom S-34', 'CS Class 1'],
    department: 'Computer Science',
    category: 'classroom',
  },
  {
    node_id: 'F1_S36',
    name: 'Room S-36 (Electronics Classroom)',
    aliases: ['S36', 'Room S36', 'Electronics Room', 'EC Class'],
    department: 'Electronics',
    category: 'classroom',
  },
  {
    node_id: 'F1_DEPT_CS',
    name: 'Computer Science Department Office',
    aliases: ['HOD CS', 'CS Staff', 'CS Faculty Room', 'CS Dept'],
    department: 'Computer Science',
    category: 'office',
  },
  {
    node_id: 'F1_RESTROOM',
    name: 'First Floor Restrooms',
    aliases: ['Washroom', 'Toilet', 'Restroom 1st Floor'],
    department: 'Facilities',
    category: 'restroom',
  },
  {
    node_id: 'F2_LAB',
    name: 'Computer Science Lab 201',
    aliases: ['Lab 1', 'CS Lab', 'Programming Lab', 'Linux Lab'],
    department: 'Computer Science',
    category: 'lab',
  },
  {
    node_id: 'F2_LAB_204',
    name: 'AI & Robotics Lab 204',
    aliases: ['Robotics Lab', 'AI Lab', 'Machine Learning Lab', 'Lab 204'],
    department: 'Computer Science / AI',
    category: 'lab',
  },
  {
    node_id: 'F2_LIBRARY',
    name: 'Digital Library & Reading Room',
    aliases: ['Library', 'Reading Hall', 'Quiet Study Area', 'Books'],
    department: 'Library Services',
    category: 'facility',
  },
];

// Helper to look up a node in the default or supplied node set
export function getNode(id: string, customNodes = nodes): Node | undefined {
  const direct = customNodes.find((n) => n.id === id);
  if (direct) return direct;
  // Robust alias matching for physical signage formats (e.g. S34 -> F1_S34)
  const normalized = id.trim().toUpperCase().replace(/-/g, '_');
  if (
    normalized === 'S34' ||
    normalized === 'F1_ROOM_S34' ||
    normalized === 'ROOM_S34' ||
    normalized === 'S_34' ||
    normalized === 'F1_S34'
  ) {
    return customNodes.find((n) => n.id === 'F1_S34') || customNodes.find((n) => n.id === 'F1_ROOM_S34');
  }
  if (
    normalized === 'S36' ||
    normalized === 'F1_ROOM_S36' ||
    normalized === 'ROOM_S36' ||
    normalized === 'S_36' ||
    normalized === 'F1_S36'
  ) {
    return customNodes.find((n) => n.id === 'F1_S36') || customNodes.find((n) => n.id === 'F1_ROOM_S36');
  }
  if (normalized === 'GATE' || normalized === 'GATE_MAIN' || normalized === 'MAIN_GATE') {
    return customNodes.find((n) => n.id === 'GATE_MAIN') || customNodes.find((n) => n.id === 'GATE');
  }
  if (
    normalized === 'F16' ||
    normalized === 'ROOM_F16' ||
    normalized === 'G_F16' ||
    normalized === 'G_ROOM_101' ||
    normalized === '101' ||
    normalized === 'ROOM_101'
  ) {
    return customNodes.find((n) => n.id === 'G_F16') || customNodes.find((n) => n.id === 'G_ROOM_101');
  }
  if (
    normalized === 'F21' ||
    normalized === 'ROOM_F21' ||
    normalized === 'G_F21' ||
    normalized === 'G_ROOM_102' ||
    normalized === '102' ||
    normalized === 'ROOM_102'
  ) {
    return customNodes.find((n) => n.id === 'G_F21') || customNodes.find((n) => n.id === 'G_ROOM_102');
  }
  if (
    normalized === 'LAB_201' ||
    normalized === 'F2_LAB' ||
    normalized === 'F2_LAB_201' ||
    normalized === '201' ||
    normalized === 'CS_LAB'
  ) {
    return customNodes.find((n) => n.id === 'F2_LAB') || customNodes.find((n) => n.id === 'F2_LAB_201');
  }
  return undefined;
}

// Helper to find an edge between two nodes
export function edgeBetween(a: string, b: string, customEdges = edges): Edge | undefined {
  const aNode = getNode(a);
  const bNode = getNode(b);
  const aId = aNode ? aNode.id : a;
  const bId = bNode ? bNode.id : b;

  return customEdges.find(
    (e) => (e.a === aId && e.b === bId) || (!e.directed && e.a === bId && e.b === aId)
  );
}

// Calculate total walking distance in meters for a path
export function getRouteDistance(path: string[], customEdges = edges): number {
  if (path.length <= 1) return 0;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const e = edgeBetween(path[i], path[i + 1], customEdges);
    if (e) total += e.distance;
  }
  return total;
}

/**
 * Dijkstra Shortest Path Engine
 * - Computes the shortest walkable path across floors
 * - Respects directed edges
 * - When accessible=true, strictly excludes stairs and any edge marked accessible: false
 * - Returns ordered array of canonical node IDs: [start, ..., end]
 */
export function shortestPath(
  start: string,
  end: string,
  accessible = false,
  graphNodes = nodes,
  graphEdges = edges
): string[] {
  const startNode = getNode(start, graphNodes);
  const endNode = getNode(end, graphNodes);

  if (!startNode || !endNode) return [];
  const sId = startNode.id;
  const eId = endNode.id;
  if (sId === eId) return [sId];

  const dist: Record<string, number> = Object.fromEntries(
    graphNodes.map((n) => [n.id, Infinity])
  );
  const prev: Record<string, string | undefined> = {};
  const remaining = new Set(graphNodes.map((n) => n.id));

  dist[sId] = 0;

  while (remaining.size > 0) {
    let current: string | undefined;
    let best = Infinity;

    for (const id of remaining) {
      if (dist[id] < best) {
        best = dist[id];
        current = id;
      }
    }

    if (!current || best === Infinity) break;
    remaining.delete(current);
    if (current === eId) break;

    for (const e of graphEdges) {
      // Guard against non-positive/corrupt edge distance
      if (e.distance < 0) continue;

      // Accessibility check: exclude stairs and non-accessible edges
      if (accessible && (e.type === 'stairs' || e.accessible === false)) {
        continue;
      }

      // Check edge connectivity considering direction
      let next: string | undefined;
      if (e.a === current) {
        next = e.b;
      } else if (!e.directed && e.b === current) {
        next = e.a;
      }

      if (!next || !remaining.has(next)) continue;

      const candidate = dist[current] + e.distance;
      if (candidate < dist[next]) {
        dist[next] = candidate;
        prev[next] = current;
      }
    }
  }

  if (!prev[eId]) return [];

  const path = [eId];
  let cursor = eId;
  while (cursor !== sId) {
    const p = prev[cursor];
    if (!p) return [];
    path.unshift(p);
    cursor = p;
  }

  return path;
}
