'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { nodes } from '../../../lib/graph';
import {
  buildCampusSignageDirectory,
  generateQrSvg,
  getAppBaseUrl,
  CheckpointCategory,
} from '../../../lib/qr-generator';

export default function QrManagementPage() {
  const [baseUrl, setBaseUrl] = useState(getAppBaseUrl());
  const [selectedCategory, setSelectedCategory] = useState<CheckpointCategory | 'all'>('all');
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Set default baseUrl to window.location.origin when mounted in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const directory = useMemo(() => {
    return buildCampusSignageDirectory(nodes, baseUrl.trim() || 'https://campuspath.edu');
  }, [baseUrl]);

  const filteredDirectory = useMemo(() => {
    return directory.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedFloor !== 'all' && item.floor !== selectedFloor) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesId = item.nodeId.toLowerCase().includes(q);
        return matchesName || matchesId;
      }
      return true;
    });
  }, [directory, selectedCategory, selectedFloor, searchQuery]);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDownloadSvg = (svgMarkup: string, filename: string) => {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container" style={{ maxWidth: '1240px' }}>
      {/* Top Header */}
      <header className="app-header no-print">
        <Link href="/" className="brand-wrapper" style={{ textDecoration: 'none' }}>
          <div className="brand-logo-badge" aria-hidden="true">←</div>
          <div className="brand-info">
            <div className="brand-title-row">
              <h1 className="brand-name" style={{ fontSize: '18px' }}>QR Signage Management Suite</h1>
              <span className="college-pill">ADMIN UTILITY</span>
            </div>
            <p className="brand-tagline">SCET · Suryodaya College of Engineering &amp; Technology</p>
          </div>
        </Link>
        <div className="header-badges">
          <button
            type="button"
            className="btn-scan"
            onClick={() => window.print()}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            🖨️ Print Signage Cards (Ctrl+P)
          </button>
        </div>
      </header>

      {/* Configuration & Filter Bar */}
      <section className="card-panel no-print" style={{ marginBottom: '24px' }}>
        <div className="card-title-row">
          <span className="card-step-badge">Signage Configuration</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Showing {filteredDirectory.length} of {directory.length} campus QR markers
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '12px' }}>
          <div>
            <label htmlFor="domain-input" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-brand-navy)', textTransform: 'uppercase' }}>
              Base Application URL:
            </label>
            <input
              id="domain-input"
              type="text"
              className="search-input"
              style={{ marginTop: '6px', padding: '8px 12px', fontSize: '13px' }}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
          </div>

          <div>
            <label htmlFor="category-select" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-brand-navy)', textTransform: 'uppercase' }}>
              Filter by Checkpoint Type:
            </label>
            <select
              id="category-select"
              className="search-input"
              style={{ marginTop: '6px', padding: '8px 12px', fontSize: '13px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CheckpointCategory | 'all')}
            >
              <option value="all">All Categories</option>
              <option value="entrance">Main Entrances</option>
              <option value="junction">Corridor Junctions</option>
              <option value="stair_lift">Stairs &amp; Elevators</option>
              <option value="classroom">Classrooms</option>
              <option value="lab">Laboratories</option>
              <option value="office">Offices</option>
              <option value="restroom">Restrooms</option>
            </select>
          </div>

          <div>
            <label htmlFor="floor-select" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-brand-navy)', textTransform: 'uppercase' }}>
              Filter by Floor:
            </label>
            <select
              id="floor-select"
              className="search-input"
              style={{ marginTop: '6px', padding: '8px 12px', fontSize: '13px' }}
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">All Floors</option>
              <option value={0}>Ground Floor (0)</option>
              <option value={1}>First Floor (1)</option>
              <option value={2}>Second Floor (2)</option>
            </select>
          </div>

          <div>
            <label htmlFor="search-sign-input" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-brand-navy)', textTransform: 'uppercase' }}>
              Search Name or ID:
            </label>
            <input
              id="search-sign-input"
              type="text"
              className="search-input"
              style={{ marginTop: '6px', padding: '8px 12px', fontSize: '13px' }}
              placeholder="e.g. Gate, S-34, 201..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Grid of Printable Official QR Sign Cards */}
      <div
        className="qr-signage-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredDirectory.map((item) => {
          const svgMarkup = generateQrSvg(item.url, { margin: 4, errorCorrectionLevel: 'M' });
          const isCopied = copiedId === item.nodeId;

          return (
            <div
              key={item.nodeId}
              className="card-panel signage-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '24px 20px',
                border: '2px solid var(--color-border)',
                breakInside: 'avoid',
              }}
            >
              {/* Category & Floor Tags */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: item.category === 'entrance' ? 'var(--color-success-bg)' : 'var(--color-primary-subtle)',
                    color: item.category === 'entrance' ? 'var(--color-success-dark)' : 'var(--color-primary)',
                    border: `1px solid ${item.category === 'entrance' ? 'var(--color-success-border)' : 'var(--color-primary-border)'}`,
                  }}
                >
                  {item.category.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  Floor {item.floor}
                </span>
              </div>

              {/* Title & Permanent Node ID */}
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-brand-navy)', marginBottom: '4px' }}>
                {item.name}
              </h2>
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: '#f1f5f9',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  marginBottom: '14px',
                  border: '1px solid var(--color-border)',
                }}
              >
                ID: {item.nodeId}
              </div>

              {/* Verified High-Resolution Vector QR Code */}
              <div
                style={{
                  width: '180px',
                  height: '180px',
                  padding: '10px',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  marginBottom: '14px',
                  boxShadow: 'var(--shadow-sm)',
                }}
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />

              {/* Scanning Instructions */}
              <p style={{ fontSize: '12px', color: 'var(--color-text-main)', fontWeight: 600, lineHeight: 1.4, marginBottom: '10px' }}>
                {item.instructions}
              </p>

              {/* Decoded URL string */}
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-secondary)',
                  wordBreak: 'break-all',
                  padding: '6px 10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  width: '100%',
                  marginBottom: '12px',
                }}
              >
                {item.url}
              </div>

              {/* Action Buttons for Admin (Hidden in print) */}
              <div className="no-print" style={{ display: 'flex', gap: '8px', width: '100%', marginTop: 'auto' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '11px', minHeight: '36px' }}
                  onClick={() => handleCopyUrl(item.url, item.nodeId)}
                >
                  {isCopied ? '✅ Copied!' : '📋 Copy URL'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '11px', minHeight: '36px' }}
                  onClick={() => handleDownloadSvg(svgMarkup, `scet-qr-${item.nodeId.toLowerCase()}`)}
                >
                  ⬇️ SVG
                </button>
              </div>

              {/* Bottom Print Footer */}
              <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SCET CampusPath · Official Navigational Signage
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
