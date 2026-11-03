'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FloorMap from './components/FloorMap';
import DestinationSearch from './components/DestinationSearch';
import DirectionsPanel from './components/DirectionsPanel';
import FloorSelector from './components/FloorSelector';
import { fetchCampusData, CampusDataset } from '../lib/database';
import { shortestPath, getNode } from '../lib/graph';
import { buildRouteDetails } from '../lib/navigation';
import { parseQrPayload } from '../lib/qr';

function HomeContent() {
  const searchParams = useSearchParams();
  const [dataset, setDataset] = useState<CampusDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation State
  const [startId, setStartId] = useState('GATE_MAIN');
  const [destinationId, setDestinationId] = useState('F1_S34');
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [activeFloor, setActiveFloor] = useState(0);

  // Checkpoint Ingestion & Verification State
  const [checkpointStatus, setCheckpointStatus] = useState<{
    type: 'recognized' | 'invalid' | 'direct';
    nodeId?: string;
    message: string;
  }>({
    type: 'direct',
    message: 'Opened directly. Select your starting checkpoint below or scan an entrance QR with your phone camera.',
  });

  // Initial Data Fetch & Direct URL Parameter Ingestion
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchCampusData();
        if (!mounted) return;
        setDataset(data);

        // Read query parameters from native phone scan (e.g. ?node=GATE_MAIN or ?s=GATE_MAIN)
        const rawNode = searchParams.get('node') || searchParams.get('s');
        const rawTo = searchParams.get('to') || searchParams.get('destination');
        const rawAcc = searchParams.get('accessible');

        if (rawNode) {
          const parsedId = parseQrPayload(rawNode);
          const recognizedNode = parsedId ? getNode(parsedId, data.nodes) : undefined;

          if (recognizedNode) {
            setStartId(recognizedNode.id);
            setActiveFloor(recognizedNode.floor);
            setCheckpointStatus({
              type: 'recognized',
              nodeId: recognizedNode.id,
              message: `Starting location recognized: ${recognizedNode.name} (Floor ${recognizedNode.floor})`,
            });
          } else {
            setCheckpointStatus({
              type: 'invalid',
              nodeId: rawNode,
              message: `Checkpoint "${rawNode}" from scanned QR was not found on this campus map. Please select a valid checkpoint below.`,
            });
          }
        } else if (typeof window !== 'undefined') {
          // Restore last selected origin checkpoint on page refresh when no URL override is provided
          const savedStart = localStorage.getItem('campuspath_start');
          if (savedStart) {
            const parsedSaved = parseQrPayload(savedStart);
            const savedNode = parsedSaved ? getNode(parsedSaved, data.nodes) : undefined;
            if (savedNode) {
              setStartId(savedNode.id);
              setActiveFloor(savedNode.floor);
            }
          }
        }

        if (rawTo) {
          const parsedTo = parseQrPayload(rawTo);
          const recognizedDest = parsedTo ? getNode(parsedTo, data.nodes) : undefined;
          if (recognizedDest) {
            setDestinationId(recognizedDest.id);
          }
        } else if (typeof window !== 'undefined') {
          // Restore last selected destination on page refresh
          const savedTarget = localStorage.getItem('campuspath_target');
          if (savedTarget) {
            const parsedTarget = parseQrPayload(savedTarget);
            const savedDest = parsedTarget ? getNode(parsedTarget, data.nodes) : undefined;
            if (savedDest) {
              setDestinationId(savedDest.id);
            }
          }
        }

        if (rawAcc === '1' || rawAcc === 'true') {
          setAccessibleOnly(true);
        }
      } catch (err) {
        console.error('Failed to load campus dataset:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const nodes = useMemo(() => dataset?.nodes || [], [dataset]);
  const edges = useMemo(() => dataset?.edges || [], [dataset]);
  const floors = useMemo(() => dataset?.floors || [], [dataset]);
  const places = useMemo(() => dataset?.places || [], [dataset]);

  const startNode = useMemo(() => getNode(startId, nodes), [startId, nodes]);
  const destinationNode = useMemo(() => getNode(destinationId, nodes), [destinationId, nodes]);

  // Compute Shortest Path via Dijkstra Algorithm
  const path = useMemo(() => {
    if (!startId || !destinationId || nodes.length === 0) return [];
    return shortestPath(startId, destinationId, accessibleOnly, nodes, edges);
  }, [startId, destinationId, accessibleOnly, nodes, edges]);

  // Build Turn-by-Turn Route Details & Walking Stats
  const route = useMemo(() => {
    if (path.length < 2) return null;
    return buildRouteDetails(path, nodes, edges);
  }, [path, nodes, edges]);

  const isAlreadyAtDestination = useMemo(() => {
    return Boolean(startNode && destinationNode && startNode.id === destinationNode.id);
  }, [startNode, destinationNode]);

  // Automatically update active floor tab to match starting floor on route change
  useEffect(() => {
    if (route && route.floorsTraversed.length > 0) {
      if (!route.floorsTraversed.includes(activeFloor)) {
        setActiveFloor(route.floorsTraversed[0]);
      }
    }
  }, [route, activeFloor]);

  // Synchronize active route to localStorage for the destination verification page
  useEffect(() => {
    if (typeof window !== 'undefined' && destinationId) {
      localStorage.setItem('campuspath_target', destinationId);
      localStorage.setItem('campuspath_start', startId);
    }
  }, [destinationId, startId]);

  if (isLoading) {
    return (
      <main className="app-container">
        <header className="app-header">
          <div className="brand-wrapper">
            <div className="brand-logo-badge">🧭</div>
            <div className="brand-info">
              <div className="brand-title-row">
                <h1 className="brand-name">CampusPath</h1>
                <span className="college-pill">SCET</span>
              </div>
              <p className="brand-tagline">Suryodaya College of Engineering &amp; Technology</p>
            </div>
          </div>
        </header>
        <div className="card-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
          <p style={{ fontWeight: 700, color: 'var(--color-brand-navy)' }}>Loading SCET campus floor plans and navigation graph...</p>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px', display: 'block' }}>
            Preparing verified Dijkstra pathfinding engine
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="app-container">
      {/* Top Header & Branding */}
      <header className="app-header">
        <Link href="/" className="brand-wrapper">
          <div className="brand-logo-badge" aria-hidden="true">🧭</div>
          <div className="brand-info">
            <div className="brand-title-row">
              <h1 className="brand-name">CampusPath</h1>
              <span className="college-pill">SCET</span>
            </div>
            <p className="brand-tagline">Suryodaya College of Engineering &amp; Technology</p>
          </div>
        </Link>

        <div className="header-badges">
          <span className={`badge-source ${dataset?.source === 'demo' ? 'demo' : ''}`}>
            {dataset?.source === 'database' ? '🟢 Supabase Live' : '🟢 Offline Demo Mode'}
          </span>
          <span className="badge-demo-warn">DEMO DATA</span>
        </div>
      </header>

      {/* Checkpoint Status Banner (Recognized vs. Missing/Invalid) */}
      <div
        className="card-panel"
        style={{
          backgroundColor:
            checkpointStatus.type === 'recognized'
              ? 'var(--color-success-bg)'
              : checkpointStatus.type === 'invalid'
              ? 'var(--color-danger-bg)'
              : 'var(--color-surface)',
          borderColor:
            checkpointStatus.type === 'recognized'
              ? 'var(--color-success-border)'
              : checkpointStatus.type === 'invalid'
              ? 'var(--color-danger-border)'
              : 'var(--color-border)',
          padding: '14px 18px',
          marginBottom: '20px',
        }}
        role="status"
        aria-live="polite"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }} aria-hidden="true">
            {checkpointStatus.type === 'recognized'
              ? '📍'
              : checkpointStatus.type === 'invalid'
              ? '⚠️'
              : 'ℹ️'}
          </span>
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color:
                  checkpointStatus.type === 'recognized'
                    ? 'var(--color-success-dark)'
                    : checkpointStatus.type === 'invalid'
                    ? 'var(--color-danger-dark)'
                    : 'var(--color-brand-navy)',
              }}
            >
              {checkpointStatus.type === 'recognized'
                ? 'Starting Checkpoint Identified'
                : checkpointStatus.type === 'invalid'
                ? 'Unrecognized Checkpoint ID'
                : 'Welcome to SCET Campus Navigation'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
              {checkpointStatus.message}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop 2-Column Responsive Layout */}
      <div className="desktop-split-grid">
        {/* Left Column: Origin Selection & Destination Search Controls */}
        <div className="desktop-split-sidebar">
          {/* Step 1: Starting Checkpoint */}
          <section className="card-panel">
            <div className="card-title-row">
              <span className="card-step-badge">1. Starting Checkpoint</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Set via Entrance QR
              </span>
            </div>

            {/* Current Origin Display */}
            <div className="checkpoint-row">
              <div className="checkpoint-info">
                <div className="checkpoint-pin-box" aria-hidden="true">
                  📍
                </div>
                <div>
                  <span className="checkpoint-label">Current Start Location:</span>
                  <div className="checkpoint-name">
                    {startNode?.name || startId}{' '}
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      (Floor {startNode?.floor ?? 0})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fallback Checkpoint Dropdown */}
            <div style={{ marginTop: '12px' }}>
              <label
                htmlFor="start-checkpoint-select"
                style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}
              >
                Change starting checkpoint:
              </label>
              <select
                id="start-checkpoint-select"
                className="search-input"
                style={{ padding: '8px 12px', marginTop: '6px' }}
                value={startId}
                onChange={(e) => {
                  const selected = e.target.value;
                  setStartId(selected);
                  const node = getNode(selected, nodes);
                  if (node) {
                    setActiveFloor(node.floor);
                    setCheckpointStatus({
                      type: 'recognized',
                      nodeId: node.id,
                      message: `Starting location updated: ${node.name} (Floor ${node.floor})`,
                    });
                  }
                }}
              >
                {nodes
                  .filter((n) => n.type === 'gate' || n.type === 'junction' || n.type === 'room')
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} (Floor {n.floor}) — {n.id}
                    </option>
                  ))}
              </select>
            </div>
          </section>

          {/* Step 2: Destination Selection */}
          <section className="card-panel">
            <div className="card-title-row">
              <span className="card-step-badge">2. Choose Destination</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Rooms, Labs &amp; Offices
              </span>
            </div>

            <DestinationSearch
              places={places}
              nodes={nodes}
              selectedNodeId={destinationId}
              onSelectDestination={(id) => setDestinationId(id)}
            />

            {/* Accessibility Toggle */}
            <label className="accessibility-toggle-row" htmlFor="acc-toggle">
              <div className="acc-label-group">
                <span className="acc-icon" aria-hidden="true">♿</span>
                <div>
                  <span className="acc-text-main">Wheelchair Accessible Route</span>
                  <div className="acc-text-sub">Avoids stairs; strictly routes through elevators &amp; ramps</div>
                </div>
              </div>
              <div className="switch">
                <input
                  type="checkbox"
                  id="acc-toggle"
                  checked={accessibleOnly}
                  onChange={(e) => setAccessibleOnly(e.target.checked)}
                />
                <span className="slider" />
              </div>
            </label>

            {/* Start Navigation Action Button */}
            <div style={{ marginTop: '18px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', minHeight: '48px', fontSize: '15px' }}
                onClick={() => {
                  const navElem = document.getElementById('navigation-view');
                  if (navElem) {
                    navElem.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                🚀 Start Navigation
              </button>
            </div>
          </section>

          {/* Step-by-Step Directions in sidebar for desktop */}
          {route && (
            <div className="desktop-directions-block" style={{ marginTop: '4px' }}>
              <DirectionsPanel
                route={route}
                activeFloor={activeFloor}
                onSelectFloor={(floorId) => setActiveFloor(floorId)}
              />
            </div>
          )}
        </div>

        {/* Right Column: Interactive Floor Map & Route View */}
        <div className="desktop-split-main" id="navigation-view">
          {route ? (
            <section className="card-panel">
              <div className="card-title-row">
                <span className="card-step-badge" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-dark)', borderColor: 'var(--color-success-border)' }}>
                  3. Active Walk Route
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-navy)' }}>
                  {route.startNode.name} → {route.destinationNode.name}
                </span>
              </div>

              {/* Multi-Floor Selector Tabs */}
              <FloorSelector
                floors={floors}
                activeFloor={activeFloor}
                routeFloors={route.floorsTraversed}
                onSelectFloor={(floorId) => setActiveFloor(floorId)}
              />

              {/* Interactive SVG Floor Map */}
              <FloorMap
                floor={activeFloor}
                floorName={floors.find((f) => f.id === activeFloor)?.name || `Floor ${activeFloor}`}
                path={path}
                startNodeId={startId}
                destinationNodeId={destinationId}
                nodes={nodes}
                edges={edges}
                onSelectNode={(nodeId) => {
                  const node = getNode(nodeId, nodes);
                  if (node && (node.type === 'room' || node.type === 'lab' || node.type === 'office')) {
                    setDestinationId(node.id);
                  }
                }}
              />

              {/* Mobile View Directions Panel fallback if not on desktop */}
              <div className="mobile-only-directions" style={{ display: 'none' }}>
                <DirectionsPanel
                  route={route}
                  activeFloor={activeFloor}
                  onSelectFloor={(floorId) => setActiveFloor(floorId)}
                />
              </div>

              {/* Link to Dedicated Navigation HUD */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link
                  href={`/navigation?node=${encodeURIComponent(startId)}&to=${encodeURIComponent(destinationId)}${accessibleOnly ? '&accessible=1' : ''}`}
                  className="btn-secondary"
                  style={{ flex: 1, minHeight: '44px' }}
                >
                  📱 Open Full-Screen Guidance HUD
                </Link>
                <Link
                  href={`/verify?target=${encodeURIComponent(destinationId)}`}
                  className="btn-primary"
                  style={{ flex: 1, minHeight: '44px' }}
                >
                  ✅ Verify Arrival at Room
                </Link>
              </div>
            </section>
          ) : isAlreadyAtDestination ? (
            <section
              className="card-panel"
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                backgroundColor: 'var(--color-success-bg)',
                borderColor: 'var(--color-success-border)',
              }}
            >
              <span style={{ fontSize: '36px' }} aria-hidden="true">🎯</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-success-dark)', marginTop: '12px' }}>
                You are already at your destination!
              </h3>
              <p style={{ fontSize: '13px', color: '#166534', marginTop: '6px' }}>
                Your current checkpoint <strong>{startNode?.name}</strong> matches your selected room.
              </p>
              <div style={{ marginTop: '20px' }}>
                <Link
                  href={`/verify?target=${encodeURIComponent(destinationId)}`}
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  ✅ Verify Destination QR Code
                </Link>
              </div>
            </section>
          ) : (
            <section
              className="card-panel"
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                backgroundColor: 'var(--color-warning-bg)',
                borderColor: 'var(--color-warning-border)',
              }}
            >
              <span style={{ fontSize: '36px' }} aria-hidden="true">🚧</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-warning-dark)', marginTop: '12px' }}>
                No Walkable Path Found
              </h3>
              <p style={{ fontSize: '13px', color: '#92400e', marginTop: '6px', maxWidth: '440px', margin: '6px auto 0 auto' }}>
                {accessibleOnly
                  ? 'No wheelchair-accessible path exists between these points without stairs. Try turning off "Wheelchair Accessible" if you are able to use stairs.'
                  : 'These two campus locations are not connected in the current floor graph.'}
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar — Direct link to destination verification on mobile */}
      <div className="bottom-nav-bar">
        <div className="nav-bar-inner">
          <Link
            href={`/verify?target=${encodeURIComponent(destinationId)}`}
            className="btn-primary"
            style={{ width: '100%', textDecoration: 'none' }}
          >
            ✅ I&apos;ve Arrived · Verify Destination QR
          </Link>
        </div>
      </div>

      {/* Footer & Disclaimer */}
      <footer className="app-footer">
        <p>
          <strong>CampusPath</strong> · Suryodaya College of Engineering &amp; Technology (SCET).
        </p>
        <p style={{ marginTop: '4px' }}>
          Entrance QR codes open this site directly with your starting checkpoint set. In-app camera scanning is used only at your destination room to verify arrival.
        </p>
        <p style={{ marginTop: '10px' }}>
          <Link href="/admin/qr" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
            🖨️ Admin: Generate &amp; Print QR Checkpoint Signage
          </Link>
        </p>
      </footer>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="app-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
          <p style={{ fontWeight: 600 }}>Loading SCET CampusPath...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
