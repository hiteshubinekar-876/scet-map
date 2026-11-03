import { Node, Edge, getNode, edgeBetween } from './graph';

export type NavigationStepIcon = 'start' | 'walk' | 'stairs' | 'lift' | 'arrive';

export type NavigationStep = {
  id: string;
  index: number;
  fromNode: Node;
  toNode: Node;
  action: 'depart' | 'walk' | 'stairs' | 'lift' | 'arrive';
  instruction: string;
  distanceMeters: number;
  floorChange?: { from: number; to: number };
  icon: NavigationStepIcon;
};

export type FloorSegment = {
  floor: number;
  nodeIds: string[];
  distanceMeters: number;
};

export type RouteDetails = {
  path: string[];
  startNode: Node;
  destinationNode: Node;
  totalDistanceMeters: number;
  estimatedTimeSeconds: number;
  estimatedTimeFormatted: string;
  floorsTraversed: number[];
  floorSegments: FloorSegment[];
  steps: NavigationStep[];
  hasFloorTransitions: boolean;
};

/**
 * Generate full navigation instructions, floor segments, and turn directions from a Dijkstra node path.
 */
export function buildRouteDetails(
  path: string[],
  graphNodes: Node[],
  graphEdges: Edge[]
): RouteDetails | null {
  if (!path || path.length < 2) return null;

  const startNode = getNode(path[0], graphNodes);
  const destinationNode = getNode(path[path.length - 1], graphNodes);

  if (!startNode || !destinationNode) return null;

  let totalDistanceMeters = 0;
  const steps: NavigationStep[] = [];
  const floorsSet = new Set<number>();

  for (let i = 0; i < path.length - 1; i++) {
    const from = getNode(path[i], graphNodes);
    const to = getNode(path[i + 1], graphNodes);
    if (!from || !to) continue;

    floorsSet.add(from.floor);
    floorsSet.add(to.floor);

    const edge = edgeBetween(from.id, to.id, graphEdges);
    const dist = edge ? edge.distance : 10;
    totalDistanceMeters += dist;

    let action: NavigationStep['action'] = 'walk';
    let icon: NavigationStepIcon = 'walk';
    let instruction = `Follow corridor toward ${to.name}`;
    let floorChange: { from: number; to: number } | undefined;

    if (i === 0 && path.length === 2) {
      instruction = `Walk ${dist}m to ${to.name}`;
    }

    if (from.floor !== to.floor) {
      floorChange = { from: from.floor, to: to.floor };
      if (edge?.type === 'lift') {
        action = 'lift';
        icon = 'lift';
        instruction = `Take the elevator from Floor ${from.floor} to Floor ${to.floor}`;
      } else {
        action = 'stairs';
        icon = 'stairs';
        instruction = `Take the stairs from Floor ${from.floor} to Floor ${to.floor}`;
      }
    } else if (i === path.length - 2) {
      action = 'arrive';
      icon = 'arrive';
      instruction = `Arrive at ${to.name} on Floor ${to.floor}`;
    }

    steps.push({
      id: `${from.id}_${to.id}_${i}`,
      index: i + 1,
      fromNode: from,
      toNode: to,
      action,
      instruction,
      distanceMeters: dist,
      floorChange,
      icon,
    });
  }

  // Group node paths into floor-specific segments for multi-floor map tab display
  const floorSegments: FloorSegment[] = [];
  let currentSegment: FloorSegment | null = null;

  for (const nodeId of path) {
    const node = getNode(nodeId, graphNodes);
    if (!node) continue;

    if (!currentSegment || currentSegment.floor !== node.floor) {
      currentSegment = {
        floor: node.floor,
        nodeIds: [nodeId],
        distanceMeters: 0,
      };
      floorSegments.push(currentSegment);
    } else {
      currentSegment.nodeIds.push(nodeId);
      const prevId = currentSegment.nodeIds[currentSegment.nodeIds.length - 2];
      const e = edgeBetween(prevId, nodeId, graphEdges);
      if (e) currentSegment.distanceMeters += e.distance;
    }
  }

  // Estimated walking time: average adult indoor pace ~ 1.1 - 1.2 m/s
  // Plus 15 seconds per floor transition (waiting for lift / stair climb)
  const floorChangeCount = steps.filter((s) => s.floorChange).length;
  const rawSeconds = Math.round(totalDistanceMeters / 1.1) + floorChangeCount * 20;

  const minutes = Math.floor(rawSeconds / 60);
  const seconds = rawSeconds % 60;
  const estimatedTimeFormatted =
    minutes === 0 ? `${seconds} sec` : seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds}s`;

  return {
    path,
    startNode,
    destinationNode,
    totalDistanceMeters,
    estimatedTimeSeconds: rawSeconds,
    estimatedTimeFormatted,
    floorsTraversed: Array.from(floorsSet).sort((a, b) => a - b),
    floorSegments,
    steps,
    hasFloorTransitions: floorChangeCount > 0,
  };
}

