'use client';

import { useState, useMemo, useRef, useEffect, KeyboardEvent } from 'react';
import { Node, Place, PlaceCategory } from '../../lib/graph';

interface DestinationSearchProps {
  places: Place[];
  nodes: Node[];
  selectedNodeId: string;
  onSelectDestination: (nodeId: string) => void;
}

export default function DestinationSearch({
  places,
  nodes,
  selectedNodeId,
  onSelectDestination,
}: DestinationSearchProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PlaceCategory | 'all'>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as HTMLElement)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Group and normalize searchable entries from places and nodes
  const searchEntries = useMemo(() => {
    const list: Array<{
      nodeId: string;
      name: string;
      floor: number;
      department?: string | null;
      category: PlaceCategory;
      aliases: string[];
      accessible: boolean;
    }> = [];

    // Collect from places directory
    for (const place of places) {
      const node = nodes.find((n) => n.id === place.node_id);
      if (node && node.type !== 'junction' && node.type !== 'gate') {
        list.push({
          nodeId: place.node_id,
          name: place.name,
          floor: node.floor,
          department: place.department,
          category: place.category,
          aliases: place.aliases,
          accessible: node.accessible !== false,
        });
      }
    }

    // Add any rooms/labs from nodes not already in places
    for (const node of nodes) {
      if (
        (node.type === 'room' || node.type === 'lab' || node.type === 'office' || node.type === 'restroom') &&
        !list.some((item) => item.nodeId === node.id)
      ) {
        list.push({
          nodeId: node.id,
          name: node.name,
          floor: node.floor,
          department: undefined,
          category: (node.type === 'room' ? 'classroom' : node.type) as PlaceCategory,
          aliases: [],
          accessible: node.accessible !== false,
        });
      }
    }

    return list;
  }, [places, nodes]);

  // Filter based on query and category
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return searchEntries.filter((item) => {
      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // Query filter
      if (!q) return true;

      const nameMatch = item.name.toLowerCase().includes(q);
      const idMatch = item.nodeId.toLowerCase().includes(q);
      const deptMatch = item.department?.toLowerCase().includes(q) || false;
      const aliasMatch = item.aliases.some((a) => a.toLowerCase().includes(q));

      return nameMatch || idMatch || deptMatch || aliasMatch;
    });
  }, [searchEntries, query, categoryFilter]);

  const selectedPlace = useMemo(
    () => searchEntries.find((item) => item.nodeId === selectedNodeId),
    [searchEntries, selectedNodeId]
  );

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredResults.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[highlightedIndex]) {
        onSelectDestination(filteredResults[highlightedIndex].nodeId);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search rooms, labs, offices (e.g. S-34, 201, Robotics)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search destination room or department"
          aria-expanded={isOpen}
          aria-controls="destination-search-results"
          aria-autocomplete="list"
          role="combobox"
        />
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search query"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="category-pills" role="tablist" aria-label="Filter locations by category">
        {(
          [
            { id: 'all', label: 'All Places' },
            { id: 'classroom', label: '🏫 Classrooms' },
            { id: 'lab', label: '🔬 Labs' },
            { id: 'office', label: '💼 Offices' },
            { id: 'restroom', label: '🚻 Restrooms' },
          ] as const
        ).map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={categoryFilter === cat.id}
            className={`pill-btn ${categoryFilter === cat.id ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter(cat.id);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Popular Quick Destinations Bar (visible when dropdown is closed) */}
      {!isOpen && (
        <div className="quick-destinations-bar">
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', alignSelf: 'center', textTransform: 'uppercase' }}>
            Quick:
          </span>
          {searchEntries.slice(0, 4).map((item) => (
            <button
              key={`quick-${item.nodeId}`}
              type="button"
              className="quick-chip"
              onClick={() => onSelectDestination(item.nodeId)}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {/* Selected destination card preview */}
      {selectedPlace && !isOpen && (
        <div
          className="selected-target-card"
          onClick={() => {
            setIsOpen(true);
            inputRef.current?.focus();
          }}
          role="button"
          tabIndex={0}
          aria-label={`Selected destination is ${selectedPlace.name}. Press to change.`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsOpen(true);
              inputRef.current?.focus();
            }
          }}
        >
          <div className="selected-target-icon-box" aria-hidden="true">
            🎯
          </div>
          <div className="selected-target-info">
            <span className="target-label">Selected Destination:</span>
            <span className="target-name">{selectedPlace.name}</span>
            <span className="target-meta">
              Floor {selectedPlace.floor}
              {selectedPlace.department ? ` · ${selectedPlace.department}` : ''}
              {selectedPlace.accessible ? ' · ♿ Wheelchair Accessible' : ''}
            </span>
          </div>
          <button type="button" className="target-change-btn" aria-hidden="true">
            Change
          </button>
        </div>
      )}

      {/* Results Dropdown */}
      {isOpen && (
        <div id="destination-search-results" className="search-dropdown" role="listbox">
          <div className="dropdown-header">
            <span>{filteredResults.length} campus locations found</span>
            <button
              type="button"
              className="dropdown-close-btn"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>

          <div className="dropdown-list">
            {filteredResults.length === 0 ? (
              <div className="dropdown-empty">
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>🔍</span>
                <p style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                  No college locations match &ldquo;{query}&rdquo;
                </p>
                <small style={{ color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                  Try searching by room number (e.g. S-34, F-16), department or category.
                </small>
              </div>
            ) : (
              filteredResults.map((item, idx) => {
                const isSelected = item.nodeId === selectedNodeId;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <div
                    key={item.nodeId}
                    role="option"
                    aria-selected={isSelected}
                    className={`dropdown-item ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                    onClick={() => {
                      onSelectDestination(item.nodeId);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <div className="item-icon" aria-hidden="true">
                      {item.category === 'lab'
                        ? '🔬'
                        : item.category === 'office'
                        ? '💼'
                        : item.category === 'restroom'
                        ? '🚻'
                        : '🏫'}
                    </div>
                    <div className="item-body">
                      <div className="item-title">
                        <span>{item.name}</span>
                        {isSelected && <span className="selected-badge">Current Target</span>}
                      </div>
                      <div className="item-sub">
                        <span className="badge-floor">Floor {item.floor}</span>
                        {item.department && <span className="badge-dept">{item.department}</span>}
                        {item.accessible && (
                          <span className="badge-acc" title="Wheelchair accessible">♿ Accessible</span>
                        )}
                        <span className="node-id-tag">ID: {item.nodeId}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
