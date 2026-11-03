'use client';

import { useEffect, useId, useState } from 'react';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
  title?: string;
  helperText?: string;
}

export default function Scanner({
  onScan,
  onClose,
  title = 'Scan Campus QR Code',
  helperText = 'Point camera at the QR sign on the wall, entrance gate or door frame.',
}: ScannerProps) {
  const containerId = 'qr-reader-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let scannerInstance: any = null;
    let isActive = true;

    async function initCamera() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isActive) return;

        scannerInstance = new Html5Qrcode(containerId);

        const scanSuccessCallback = (decoded: string) => {
          if (isActive) {
            onScan(decoded);
            if (scannerInstance?.isScanning) {
              scannerInstance.stop().catch(() => {});
            }
          }
        };

        const config = {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1.0,
        };

        // Try rear environment camera first, then fall back to user camera (for desktop/laptop webcams)
        try {
          await scannerInstance.start({ facingMode: 'environment' }, config, scanSuccessCallback, () => {});
        } catch {
          if (!isActive) return;
          await scannerInstance.start({ facingMode: 'user' }, config, scanSuccessCallback, () => {});
        }

        if (isActive) {
          setIsInitializing(false);
        } else if (scannerInstance?.isScanning) {
          scannerInstance.stop().catch(() => {}).finally(() => {
            try { scannerInstance.clear(); } catch {}
          });
        }
      } catch (err: unknown) {
        if (isActive) {
          setIsInitializing(false);
          const msg = err instanceof Error ? err.message : String(err);
          setError(
            `Camera could not be started (${msg}). Please verify camera permissions in your browser, ensure HTTPS/localhost is used, or enter the code manually below.`
          );
        }
      }
    }

    initCamera();

    return () => {
      isActive = false;
      if (scannerInstance?.isScanning) {
        scannerInstance.stop().catch(() => {}).finally(() => {
          try { scannerInstance.clear(); } catch {}
        });
      }
    };
  }, [containerId, onScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = manualInput.trim();
    if (val) {
      onScan(val);
    }
  };

  return (
    <div className="scanner-modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="scanner-card">
        <div className="scanner-header">
          <div className="scanner-title-group">
            <span className="scanner-icon" aria-hidden="true">📷</span>
            <h3 className="scanner-title">{title}</h3>
          </div>
          {onClose && (
            <button
              type="button"
              className="scanner-close-btn"
              onClick={onClose}
              aria-label="Close scanner"
            >
              ✕
            </button>
          )}
        </div>

        <p className="scanner-helper">{helperText}</p>

        {/* Viewfinder element for html5-qrcode */}
        <div className="scanner-viewfinder-container">
          <div id={containerId} className="scanner-viewfinder" />
          {isInitializing && !error && (
            <div className="scanner-loading-overlay">
              <div className="spinner" />
              <span>Initializing secure camera stream...</span>
            </div>
          )}
        </div>

        {error ? (
          <div className="scanner-error-box" role="alert">
            <span className="error-icon" aria-hidden="true">⚠️</span>
            <p className="error-text">{error}</p>
          </div>
        ) : (
          <div className="scanner-status-tip">
            <span>Keep the QR code steady inside the viewfinder frame.</span>
          </div>
        )}

        {/* Manual fallback input for environments without cameras */}
        <form onSubmit={handleManualSubmit} className="scanner-manual-form">
          <label htmlFor="manual-qr-input" className="manual-label">
            Or enter QR code / URL manually:
          </label>
          <div className="manual-input-row">
            <input
              id="manual-qr-input"
              type="text"
              className="manual-input"
              placeholder="e.g. GATE_MAIN, F1_S34, or https://.../?node=..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <button type="submit" className="manual-submit-btn" disabled={!manualInput.trim()}>
              Submit
            </button>
          </div>
        </form>

        {/* Quick simulation buttons for desktop and development testing */}
        <div className="quick-test-shortcuts">
          <span className="shortcuts-label">Simulate Checkpoint Scan:</span>
          <div className="shortcuts-row">
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => onScan('GATE_MAIN')}
            >
              Main Gate
            </button>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => onScan('F1_STAIRS')}
            >
              Floor 1 Stairs
            </button>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => onScan('F1_S34')}
            >
              Room S-34
            </button>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => onScan('F2_LAB')}
            >
              Lab 201
            </button>
          </div>
        </div>

        {onClose && (
          <button type="button" className="scanner-cancel-full-btn" onClick={onClose}>
            Cancel and Return
          </button>
        )}
      </div>
    </div>
  );
}
