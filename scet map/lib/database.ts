import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import {
  Floor,
  Node,
  Edge,
  Place,
  demoFloors,
  nodes as demoNodes,
  edges as demoEdges,
  demoPlaces,
} from './graph';

export type CampusDataset = {
  floors: Floor[];
  nodes: Node[];
  edges: Edge[];
  places: Place[];
  source: 'database' | 'demo';
  error?: string;
};

// Cached dataset in memory to minimize network churn across component lifecycles
let memoryCache: CampusDataset | null = null;

/**
 * Fetch campus navigation graph data.
 * Tries Supabase if configured; automatically falls back to offline demo data on failure.
 */
export async function fetchCampusData(forceRefresh = false): Promise<CampusDataset> {
  if (memoryCache && !forceRefresh) {
    return memoryCache;
  }

  const fallbackDemo = (errMsg?: string): CampusDataset => {
    const result: CampusDataset = {
      floors: demoFloors,
      nodes: demoNodes,
      edges: demoEdges,
      places: demoPlaces,
      source: 'demo',
      error: errMsg,
    };
    memoryCache = result;
    return result;
  };

  const client = getSupabaseClient();
  if (!isSupabaseConfigured || !client) {
    return fallbackDemo('Supabase is not configured. Running with built-in demo campus data.');
  }

  try {
    const [floorsRes, nodesRes, edgesRes, placesRes] = await Promise.all([
      client.from('floors').select('*').order('id', { ascending: true }),
      client.from('nodes').select('*'),
      client.from('edges').select('*'),
      client.from('places').select('*'),
    ]);

    if (floorsRes.error || nodesRes.error || edgesRes.error || placesRes.error) {
      const err =
        floorsRes.error?.message ||
        nodesRes.error?.message ||
        edgesRes.error?.message ||
        placesRes.error?.message;
      console.warn('[CampusPath] Supabase query error, falling back to demo graph:', err);
      return fallbackDemo(`Database query error: ${err}`);
    }

    const dbFloors: Floor[] = (floorsRes.data || []).map((f) => ({
      id: Number(f.id),
      name: String(f.name),
      map_url: f.map_url || null,
      notes: f.notes || null,
    }));

    const dbNodes: Node[] = (nodesRes.data || []).map((n) => ({
      id: String(n.id),
      floor: Number(n.floor_id),
      name: String(n.name),
      x: Number(n.x),
      y: Number(n.y),
      type: n.type,
      accessible: n.accessible !== false,
      description: n.description || undefined,
    }));

    const dbEdges: Edge[] = (edgesRes.data || []).map((e) => ({
      id: e.id,
      a: String(e.a),
      b: String(e.b),
      distance: Number(e.distance_m),
      type: e.type,
      accessible: e.accessible !== false,
      directed: Boolean(e.directed),
    }));

    const dbPlaces: Place[] = (placesRes.data || []).map((p) => ({
      id: p.id,
      node_id: String(p.node_id),
      name: String(p.name),
      aliases: Array.isArray(p.aliases) ? p.aliases : [],
      department: p.department || null,
      category: p.category || 'classroom',
    }));

    // If database tables are empty, fall back to demo dataset
    if (dbNodes.length === 0 || dbEdges.length === 0) {
      return fallbackDemo('Connected to Supabase, but navigation tables are empty. Showing demo data.');
    }

    const result: CampusDataset = {
      floors: dbFloors.length > 0 ? dbFloors : demoFloors,
      nodes: dbNodes,
      edges: dbEdges,
      places: dbPlaces.length > 0 ? dbPlaces : demoPlaces,
      source: 'database',
    };

    memoryCache = result;
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[CampusPath] Network exception while fetching campus data:', message);
    return fallbackDemo(`Network error: ${message}`);
  }
}

