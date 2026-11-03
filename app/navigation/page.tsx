'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FloorMap from '../components/FloorMap';
import DirectionsPanel from '../components/DirectionsPanel';
import FloorSelector from '../components/FloorSelector';
import Scanner from '../components/Scanner';
import { fetchCampusData, CampusDataset } from '../../lib/database';
import { shortestPath, getNode } from '../../lib/graph';
import { buildRouteDetails } from '../../lib/navigation';
import { parseQrPayload } from '../../lib/qr';

function NavigationContent() {
  const searchParams = useSearchParams();
  const [dataset, setDataset] = useState<CampusDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ingest and sanitize URL params
  const rawStart = searchParams.get('node') || searchParams.get('s');
  const rawTo = searchParams.get('to') || searchParams.get('destination');
  const initialStart = (rawStart ? parseQrPayload(rawStart) : null) || 'GATE_MAIN';
  const initialTo = (rawTo ? parseQrPayload(rawTo) : null) || 'F1_S34';
  const initialAcc = searchParams.get('accessible') === '1' || searchParams.get('accessible') === 'true';

  const [startId, setStartId] = useState(initialStart);
  const [destinationId, setDestinationId] = useState(initialTo);
  const [accessibleOnly, setAccessibleOnly] = useState(initialAcc);
  const [activeFloor, setActiveFloor] = useState(0);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchCampusData();
        if (mounted) {
          setDataset(data);
          const startNode = getNode(startId, data.nodes);
          if (startNode) setActiveFloor(startNode.floor);
        }
      } catch (err) {
        console.error('Failed to load navigation data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [startId]);

  const nodes = useMemo(() => dataset?.nodes || [], [dataset]);
  const edges = useMemo(() => dataset?.edges || [], [dataset]);
  const floors = useMemo(() => dataset?.floors || [], [dataset]);

  const path = useMemo(() => {
    if (!startId || !destinationId || nodes.length === 0) return [];
    return shortestPath(startId, destinationId, accessibleOnly, nodes, edges);
  }, [startId, destinationId, accessibleOnly, nodes, edges]);

  const route = useMemo(() => {
    if (path.length < 2) return null;
    return buildRouteDetails(path, nodes, edges);
  }, [path, nodes, edges]);

  const handleUpdateLocation = (scannedRaw: string) => {
    const id = parseQrPayload(scannedRaw);
    if (id && getNode(id, nodes)) {
      setStartId(id);
      const n = getNode(id, nodes);
      if (n) setActiveFloor(n.floor);
      setShowScanner(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
        <p style={{ fontWeight: 700, color: 'var(--color-brand-navy)' }}>Loading SCET Active Navigation HUD...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <Link href="/" className="brand-wrapper" style={{ textDecoration: 'none' }}>
          <div className="brand-logo-badge" aria-hidden="true">←</div>
          <div className="brand-info">
            <div className="brand-title-row">
              <h1 className="brand-name" style={{ fontSize: '18px' }}>Active Navigation HUD</h1>
              <span className="college-pill">GUIDANCE MODE</span>
            </div>
            <p className="brand-tagline">Suryodaya College of Engineering &amp; Technology</p>
          </div>
        </Link>
        <div className="header-badges">
          <span className="badge-demo-warn">DEMO HUD</span>
        </div>
      </header>

      {route ? (
        <>
          {/* Top Route Summary Banner */}
          <div
            className="card-panel"
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--color-primary-subtle)',
              borderColor: 'var(--color-primary-border)',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Heading to Destination:
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-brand-navy)', marginTop: '2px' }}>
                  {route.destinationNode.name}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Floor {route.destinationNode.floor} · {route.totalDistanceMeters}m ({route.estimatedTimeFormatted})
                  {accessibleOnly && ' · ♿ Wheelchair Accessible'}
                </div>
              </div>
              <button
                type="button"
                className="btn-scan"
                onClick={() => setShowScanner(true)}
              >
                📷 Update Position
              </button>
            </div>
          </div>

          {/* Desktop Two-Column View */}
          <div className="desktop-split-grid">
            {/* Left Column: Turn-by-Turn Directions */}
            <div className="desktop-split-sidebar">
              <DirectionsPanel
                route={route}
                activeFloor={activeFloor}
                onSelectFloor={(f) => setActiveFloor(f)}
              />
            </div>

            {/* Right Column: Multi-Floor Selector & Interactive Map */}
            <div className="desktop-split-main">
              <FloorSelector
                floors={floors}
                activeFloor={activeFloor}
                routeFloors={route.floorsTraversed}
                onSelectFloor={(f) => setActiveFloor(f)}
              />

              <FloorMap
                floor={activeFloor}
                floorName={floors.find((f) => f.id === activeFloor)?.name || `Floor ${activeFloor}`}
                path={path}
                startNodeId={startId}
                destinationNodeId={destinationId}
                nodes={nodes}
                edges={edges}
              />
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="bottom-nav-bar">
            <div className="nav-bar-inner">
              <Link
                href={`/verify?target=${encodeURIComponent(destinationId)}`}
                className="btn-primary"
                style={{ width: '100%', textDecoration: 'none' }}
              >
                ✅ Verify Arrival at Room
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="card-panel" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <span style={{ fontSize: '32px' }} aria-hidden="true">⚠️</span>
          <p style={{ fontWeight: 800, color: 'var(--color-danger-dark)', marginTop: '10px' }}>
            No walkable route found between these locations.
          </p>
          <Link href="/" className="btn-secondary" style={{ display: 'inline-flex', marginTop: '16px' }}>
            Return to Campus Search
          </Link>
        </div>
      )}

      {showScanner && (
        <Scanner
          title="Scan Checkpoint QR"
          helperText="Scan any corridor QR code or junction sign to recalculate route from your current position."
          onScan={handleUpdateLocation}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

export default function NavigationPage() {
  return (
    <Suspense
      fallback={
        <div className="app-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
          <p style={{ fontWeight: 600 }}>Initializing navigation HUD...</p>
        </div>
      }
    >
      <NavigationContent />
    </Suspense>
  );
}
