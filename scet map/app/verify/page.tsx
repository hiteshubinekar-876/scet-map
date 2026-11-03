'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Scanner from '../components/Scanner';
import { fetchCampusData, CampusDataset } from '../../lib/database';
import { getNode } from '../../lib/graph';
import { verifyDestinationQr, QrVerificationResult } from '../../lib/qr';

function VerifyContent() {
  const searchParams = useSearchParams();
  const [dataset, setDataset] = useState<CampusDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Expected target room ID
  const [targetId, setTargetId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [verificationResult, setVerificationResult] = useState<QrVerificationResult | null>(null);

  // Initialize dataset and read query parameters
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchCampusData();
        if (!mounted) return;
        setDataset(data);

        // Determine target destination
        const queryTarget = searchParams.get('target');
        const queryScanned = searchParams.get('node') || searchParams.get('s');
        const savedTarget = typeof window !== 'undefined' ? localStorage.getItem('campuspath_target') : null;

        const effectiveTarget = queryTarget || savedTarget || 'F1_S34';
        setTargetId(effectiveTarget);

        // If the QR directly encoded both target and scanned node (e.g. /verify?target=F1_S34&node=F1_S34)
        if (queryScanned) {
          const res = verifyDestinationQr(queryScanned, effectiveTarget, data.nodes);
          setVerificationResult(res);
        }
      } catch (err) {
        console.error('Failed to load campus data for verification:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const nodes = useMemo(() => dataset?.nodes || [], [dataset]);
  const targetNode = useMemo(() => getNode(targetId, nodes), [targetId, nodes]);

  // Handle scanned destination QR
  const handleScanRoomQr = useCallback(
    (rawScanned: string) => {
      if (!targetId) return;
      const result = verifyDestinationQr(rawScanned, targetId, nodes);
      setVerificationResult(result);
      setShowScanner(false);

      if (result.status === 'MATCH') {
        localStorage.setItem(
          'campuspath_verified',
          JSON.stringify({
            targetId,
            time: new Date().toISOString(),
          })
        );
      }
    },
    [targetId, nodes]
  );

  if (isLoading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
        <p style={{ fontWeight: 700, color: 'var(--color-brand-navy)' }}>Loading SCET destination verification system...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <Link href="/" className="brand-wrapper" style={{ textDecoration: 'none' }}>
          <div className="brand-logo-badge" aria-hidden="true">←</div>
          <div className="brand-info">
            <div className="brand-title-row">
              <h1 className="brand-name" style={{ fontSize: '18px' }}>Destination Verification</h1>
              <span className="college-pill">ARRIVAL CHECK</span>
            </div>
            <p className="brand-tagline">Suryodaya College of Engineering &amp; Technology</p>
          </div>
        </Link>
        <div className="header-badges">
          <span className="badge-demo-warn">DEMO VERIFY</span>
        </div>
      </header>

      {/* Target Destination Card */}
      <section className="card-panel">
        <div className="card-title-row">
          <span className="card-step-badge">Expected Target</span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Scan the official sign outside the classroom door
          </span>
        </div>

        <div className="checkpoint-row" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="checkpoint-info">
            <div
              className="checkpoint-pin-box"
              style={{ backgroundColor: '#fef3c7', borderColor: '#fcd34d', color: '#b45309' }}
              aria-hidden="true"
            >
              🎯
            </div>
            <div>
              <span className="checkpoint-label" style={{ color: '#b45309' }}>Target Room:</span>
              <div className="checkpoint-name">
                {targetNode?.name || targetId}{' '}
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  (Floor {targetNode?.floor ?? 1})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Target Dropdown */}
        <div style={{ marginTop: '14px' }}>
          <label
            htmlFor="target-change-select"
            style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}
          >
            Change target room:
          </label>
          <select
            id="target-change-select"
            className="search-input"
            style={{ padding: '8px 12px', marginTop: '6px' }}
            value={targetId}
            onChange={(e) => {
              setTargetId(e.target.value);
              setVerificationResult(null);
            }}
          >
            {nodes
              .filter((n) => n.type === 'room' || n.type === 'lab' || n.type === 'office' || n.type === 'restroom')
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} (Floor {n.floor}) — {n.id}
                </option>
              ))}
          </select>
        </div>

        {/* Trigger Scanner Button */}
        <div style={{ marginTop: '18px' }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', minHeight: '48px', fontSize: '15px' }}
            onClick={() => setShowScanner(true)}
          >
            📷 Scan Classroom Door QR Code
          </button>
        </div>
      </section>

      {/* Verification Result Feedback */}
      {verificationResult && (
        <section
          className={`verification-result-box ${
            verificationResult.status === 'MATCH'
              ? 'match'
              : verificationResult.status === 'MISMATCH'
              ? 'mismatch'
              : 'unknown'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="res-header">
            <span style={{ fontSize: '32px' }} aria-hidden="true">
              {verificationResult.status === 'MATCH'
                ? '✅'
                : verificationResult.status === 'MISMATCH'
                ? '❌'
                : '⚠️'}
            </span>
            <div>
              <h2 className="res-title">
                {verificationResult.status === 'MATCH'
                  ? 'Congratulations! You have reached your destination.'
                  : verificationResult.status === 'MISMATCH'
                  ? 'Wrong destination. Please check your classroom.'
                  : 'Unrecognized Checkpoint QR'}
              </h2>
              <p className="res-msg">
                {verificationResult.status === 'MATCH'
                  ? `Verified arrival at ${verificationResult.scannedNode?.name || targetNode?.name || targetId} (Floor ${verificationResult.scannedNode?.floor ?? targetNode?.floor ?? 1}).`
                  : verificationResult.status === 'MISMATCH'
                  ? `You scanned: ${verificationResult.scannedNode?.name || verificationResult.scannedId} (Floor ${verificationResult.scannedNode?.floor ?? '?'}). Expected destination: ${targetNode?.name || targetId} (Floor ${targetNode?.floor ?? '?'}).`
                  : verificationResult.message}
              </p>
            </div>
          </div>

          {/* Action buttons depending on result */}
          {verificationResult.status === 'MATCH' && (
            <div className="res-success-actions">
              <Link href="/" className="btn-primary" style={{ textDecoration: 'none' }}>
                🎉 Done · Return to Campus Map
              </Link>
            </div>
          )}

          {verificationResult.status === 'MISMATCH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-navy)' }}>
                Would you like to calculate a new route starting from where you are right now?
              </p>
              <Link
                href={`/?node=${encodeURIComponent(
                  verificationResult.scannedId || ''
                )}&to=${encodeURIComponent(targetId)}`}
                className="res-reroute-btn"
                style={{ textDecoration: 'none' }}
              >
                🔄 Re-route to {targetNode?.name || targetId} from here
              </Link>
              <button
                type="button"
                className="btn-secondary"
                style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                onClick={() => setShowScanner(true)}
              >
                📷 Retry Scanning
              </button>
            </div>
          )}

          {verificationResult.status !== 'MATCH' && verificationResult.status !== 'MISMATCH' && (
            <button
              type="button"
              className="btn-secondary"
              style={{ alignSelf: 'flex-start', marginTop: '10px' }}
              onClick={() => setShowScanner(true)}
            >
              📷 Try Scanning Again
            </button>
          )}
        </section>
      )}

      {/* Camera Scanner Modal */}
      {showScanner && (
        <Scanner
          title="Scan Room QR Code"
          helperText="Scan the official QR code located at the room door."
          onScan={handleScanRoomQr}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Information & Regulatory Notice */}
      <section className="card-panel" style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-brand-navy)', marginBottom: '8px' }}>
          About Destination Verification
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Official classroom QR markers contain permanent node IDs (e.g. <code>F1_S34</code>).
          The CampusPath engine compares the scanned node with the target room selected during route calculation.
          <br />
          <strong>Important:</strong> Static QR codes serve as navigational arrival assistance only and do not constitute cryptographically secure proof of attendance or identity.
        </p>
      </section>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="app-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
          <p style={{ fontWeight: 600 }}>Loading destination verification...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
