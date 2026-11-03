'use client';

import { useMemo, useState } from 'react';
import { Node, Edge, getNode } from '../../lib/graph';

interface FloorMapProps {
  floor: number;
  floorName?: string;
  path: string[];
  startNodeId: string;
  destinationNodeId: string;
  nodes: Node[];
  edges: Edge[];
  onSelectNode?: (nodeId: string) => void;
}

export default function FloorMap({
  floor,
  floorName = `Floor ${floor}`,
  path,
  startNodeId,
  destinationNodeId,
  nodes,
  edges,
  onSelectNode,
}: FloorMapProps) {
  // Zoom & Pan ViewBox state
  const [zoomLevel, setZoomLevel] = useState(1);

  // Filter nodes belonging to this specific floor
  const floorNodes = useMemo(() => nodes.filter((n) => n.floor === floor), [nodes, floor]);

  // Extract path nodes that exist on this floor
  const pathNodes = useMemo(
    () => path.map((id) => getNode(id, nodes)).filter((n): n is Node => n !== undefined),
    [path, nodes]
  );

  // SVG route path polyline for this floor
  const routePolyline = useMemo(() => {
    if (!pathNodes || pathNodes.length < 2) return '';
    // Build path segments where both consecutive nodes are on this floor
    const segments: string[] = [];
    for (let i = 0; i < pathNodes.length - 1; i++) {
      const from = pathNodes[i];
      const to = pathNodes[i + 1];
      if (from.floor === floor && to.floor === floor) {
        segments.push(`M ${from.x} ${from.y} L ${to.x} ${to.y}`);
      }
    }
    return segments.join(' ');
  }, [pathNodes, floor]);

  // Edges on this floor for rendering corridor walkways
  const floorCorridorEdges = useMemo(() => {
    return edges.filter((e) => {
      const aNode = getNode(e.a, nodes);
      const bNode = getNode(e.b, nodes);
      return aNode && bNode && aNode.floor === floor && bNode.floor === floor;
    });
  }, [edges, nodes, floor]);

  // Dynamic viewBox based on zoom
  const viewBox = useMemo(() => {
    const baseW = 540;
    const baseH = 430;
    const w = baseW / zoomLevel;
    const h = baseH / zoomLevel;
    const x = (baseW - w) / 2;
    const y = (baseH - h) / 2;
    return `${x} ${y} ${w} ${h}`;
  }, [zoomLevel]);

  return (
    <div className="floor-map-wrapper">
      {/* Floor Map Header */}
      <div className="floor-map-header">
        <div className="floor-title">
          <span className="floor-badge">{floor === 0 ? 'Ground' : `Level ${floor}`}</span>
          <span className="floor-name">{floorName} — Building Interior</span>
        </div>
        <span className="demo-badge">⚠️ DEMO MAP (Unsurveyed)</span>
      </div>

      {/* SVG Container with Zoom Controls Overlay */}
      <div className="floor-svg-container">
        {/* Floating Zoom Controls */}
        <div className="map-controls-overlay" role="toolbar" aria-label="Map zoom controls">
          <button
            type="button"
            className="map-control-btn"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.0))}
            aria-label="Zoom in"
            title="Zoom in"
          >
            ➕
          </button>
          <button
            type="button"
            className="map-control-btn"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
            aria-label="Zoom out"
            title="Zoom out"
          >
            ➖
          </button>
          {zoomLevel !== 1 && (
            <button
              type="button"
              className="map-control-btn"
              onClick={() => setZoomLevel(1)}
              aria-label="Reset zoom"
              title="Reset view"
              style={{ fontSize: '11px', fontWeight: 800 }}
            >
              1x
            </button>
          )}
        </div>

        <svg
          className="floor-svg"
          viewBox={viewBox}
          role="img"
          aria-label={`${floorName} indoor layout and route guide`}
        >
          <defs>
            {/* Subtle engineering grid pattern */}
            <pattern id="campus-grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>

            {/* Drop shadow for pins */}
            <filter id="pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="3.5" floodColor="#0f172a" floodOpacity="0.22" />
            </filter>

            {/* Linear gradient for active route glow */}
            <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Building Outer Perimeter Shell */}
          <rect x="25" y="45" width="490" height="345" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" />
          <rect x="26" y="46" width="488" height="343" rx="17" fill="url(#campus-grid)" />

          {/* Room Blocks (North Wing & South Wing) */}
          <rect x="48" y="65" width="444" height="75" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="48" y="275" width="444" height="95" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />

          {/* Physical Walkable Corridor Backbones */}
          <path
            d="M 65 330 L 475 330 M 170 120 L 170 330 M 260 120 L 260 330 M 440 120 L 440 375"
            stroke="#e2e8f0"
            strokeWidth="38"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Corridor Center Guidelines */}
          <path
            d="M 65 330 L 475 330 M 170 120 L 170 330 M 260 120 L 260 330 M 440 120 L 440 375"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            fill="none"
          />

          {/* Dynamic Corridor Edges between mapped nodes */}
          {floorCorridorEdges.map((e, idx) => {
            const a = getNode(e.a, nodes);
            const b = getNode(e.b, nodes);
            if (!a || !b) return null;
            return (
              <line
                key={`edge-${idx}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#e2e8f0"
                strokeWidth="24"
                strokeLinecap="round"
              />
            );
          })}

          {/* ACTIVE HIGH-PERFORMANCE BLUE ROUTE LINE */}
          {routePolyline && (
            <>
              {/* Outer Cyan/Blue Glow */}
              <path
                d={routePolyline}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.45"
              />
              {/* Core Solid Navigation Line */}
              <path
                d={routePolyline}
                fill="none"
                stroke="url(#route-gradient)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Animated White Pulse Dash along route */}
              <path
                d={routePolyline}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="route-animated-dash"
              />
            </>
          )}

          {/* Nodes, Checkpoints, and Room Pins */}
          {floorNodes.map((n) => {
            const isStart = n.id === startNodeId;
            const isDest = n.id === destinationNodeId;
            const isOnPath = path.includes(n.id);

            // Styling based on semantic type and role
            let fillColor = '#64748b';
            let radius = 8;
            let strokeColor = '#ffffff';
            let strokeWidth = 2.5;

            if (isStart) {
              fillColor = '#10b981'; // Green Start Pin
              radius = 15;
              strokeWidth = 3.5;
            } else if (isDest) {
              fillColor = '#ef4444'; // Red Destination Pin
              radius = 15;
              strokeWidth = 3.5;
            } else if (n.type === 'stairs') {
              fillColor = '#8b5cf6'; // Purple Stairs
              radius = 11;
            } else if (n.type === 'lift') {
              fillColor = '#06b6d4'; // Cyan Lift
              radius = 11;
            } else if (n.type === 'room' || n.type === 'lab') {
              fillColor = isOnPath ? '#2563eb' : '#f59e0b'; // Amber / Blue if on route
              radius = 9.5;
            } else if (n.type === 'office') {
              fillColor = '#3b82f6';
              radius = 9.5;
            } else if (n.type === 'restroom') {
              fillColor = '#10b981';
              radius = 8;
            } else if (n.type === 'junction') {
              fillColor = isOnPath ? '#2563eb' : '#cbd5e1';
              radius = isOnPath ? 6 : 4;
            }

            return (
              <g
                key={n.id}
                className="map-node-group"
                onClick={() => onSelectNode && onSelectNode(n.id)}
                style={{ cursor: onSelectNode ? 'pointer' : 'default' }}
                role="button"
                tabIndex={0}
                aria-label={`${n.name} (${n.type})`}
              >
                {/* Pulsing ring for Start and Destination markers */}
                {(isStart || isDest) && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={radius + 7}
                    fill="none"
                    stroke={isStart ? '#10b981' : '#ef4444'}
                    strokeWidth="2.5"
                    opacity="0.4"
                  />
                )}

                {/* Primary Pin Circle */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={radius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  filter="url(#pin-shadow)"
                />

                {/* Inner Icon Glyphs inside Start / Target pins */}
                {isStart && (
                  <text x={n.x} y={n.y + 4.5} fontSize="12" textAnchor="middle" fill="#ffffff" fontWeight="800">
                    A
                  </text>
                )}
                {isDest && (
                  <text x={n.x} y={n.y + 4.5} fontSize="12" textAnchor="middle" fill="#ffffff" fontWeight="800">
                    B
                  </text>
                )}
                {n.type === 'stairs' && !isStart && !isDest && (
                  <text x={n.x} y={n.y + 4} fontSize="10" textAnchor="middle" fill="#ffffff" fontWeight="bold">
                    🪜
                  </text>
                )}
                {n.type === 'lift' && !isStart && !isDest && (
                  <text x={n.x} y={n.y + 4} fontSize="10" textAnchor="middle" fill="#ffffff" fontWeight="bold">
                    🛗
                  </text>
                )}

                {/* Room and Landmark Text Labels */}
                {n.type !== 'junction' && (
                  <text
                    x={n.x}
                    y={n.y > 250 ? n.y + 22 : n.y - 14}
                    fontSize="11"
                    textAnchor="middle"
                    fill="#0f172a"
                    fontWeight={isStart || isDest || isOnPath ? '800' : '600'}
                    className="map-label"
                  >
                    {n.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* Clean Legend Ribbon */}
          <g transform="translate(30, 368)" className="map-legend">
            <rect width="480" height="24" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx="20" cy="12" r="5" fill="#10b981" />
            <text x="30" y="16" fontSize="10" fontWeight="600" fill="#475569">Start (A)</text>
            <circle cx="82" cy="12" r="5" fill="#ef4444" />
            <text x="92" y="16" fontSize="10" fontWeight="600" fill="#475569">Target (B)</text>
            <line x1="148" y1="12" x2="168" y2="12" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
            <text x="174" y="16" fontSize="10" fontWeight="600" fill="#475569">Route</text>
            <circle cx="220" cy="12" r="5" fill="#8b5cf6" />
            <text x="230" y="16" fontSize="10" fontWeight="600" fill="#475569">Stairs</text>
            <circle cx="275" cy="12" r="5" fill="#06b6d4" />
            <text x="285" y="16" fontSize="10" fontWeight="600" fill="#475569">Lift</text>
            <circle cx="330" cy="12" r="5" fill="#f59e0b" />
            <text x="340" y="16" fontSize="10" fontWeight="600" fill="#475569">Room/Lab</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
