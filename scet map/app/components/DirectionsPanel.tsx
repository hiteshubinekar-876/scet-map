'use client';

import { RouteDetails, NavigationStep } from '../../lib/navigation';

interface DirectionsPanelProps {
  route: RouteDetails;
  activeFloor: number;
  onSelectFloor?: (floor: number) => void;
}

export default function DirectionsPanel({
  route,
  activeFloor,
  onSelectFloor,
}: DirectionsPanelProps) {
  return (
    <div className="directions-panel" role="region" aria-label="Step-by-step navigation instructions">
      <div className="directions-header">
        {/* Route Stats Summary */}
        <div className="directions-summary">
          <div className="stat-item">
            <span className="stat-value">{route.totalDistanceMeters}m</span>
            <span className="stat-label">Walk distance</span>
          </div>
          <div className="stat-divider" aria-hidden="true" />
          <div className="stat-item">
            <span className="stat-value">{route.estimatedTimeFormatted}</span>
            <span className="stat-label">Est. time</span>
          </div>
          <div className="stat-divider" aria-hidden="true" />
          <div className="stat-item">
            <span className="stat-value">{route.floorsTraversed.length}</span>
            <span className="stat-label">Floor{route.floorsTraversed.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Floor Transition Banner if route traverses multiple levels */}
        {route.hasFloorTransitions && (
          <div className="floor-transition-notice">
            <span className="notice-icon" aria-hidden="true">🔄</span>
            <span>
              Multi-floor route:{' '}
              {route.floorsTraversed.map((f) => `Floor ${f}`).join(' → ')}.
              Follow the instructions below to transition floors.
            </span>
          </div>
        )}
      </div>

      {/* Step by Step Direction List */}
      <div className="steps-list-wrapper">
        <h3 className="steps-title">Step-by-Step Guidance</h3>
        <ol className="steps-list">
          {route.steps.map((step: NavigationStep) => {
            const isFloorTransition = Boolean(step.floorChange);
            const isRelevantToActiveFloor =
              step.fromNode.floor === activeFloor || step.toNode.floor === activeFloor;

            return (
              <li
                key={step.id}
                className={`step-item ${isFloorTransition ? 'step-transition' : ''} ${
                  isRelevantToActiveFloor ? 'step-current-floor' : ''
                }`}
                onClick={() => {
                  if (onSelectFloor) {
                    onSelectFloor(step.toNode.floor);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Step ${step.index}: ${step.instruction}. Distance ${step.distanceMeters} meters.`}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onSelectFloor) {
                    onSelectFloor(step.toNode.floor);
                  }
                }}
              >
                <div className="step-icon-wrapper">
                  <div className="step-icon-box" aria-hidden="true">
                    {step.icon === 'start'
                      ? '🟢'
                      : step.icon === 'lift'
                      ? '🛗'
                      : step.icon === 'stairs'
                      ? '🪜'
                      : step.icon === 'arrive'
                      ? '🎯'
                      : '🚶'}
                  </div>
                  <span className="step-num">{step.index}</span>
                </div>

                <div className="step-content">
                  <p className="step-instruction">{step.instruction}</p>
                  <div className="step-meta">
                    <span className="step-dist">~{step.distanceMeters} meters</span>
                    {step.floorChange ? (
                      <span className="step-floor-badge alert">
                        Floor Change: {step.floorChange.from} → {step.floorChange.to}
                      </span>
                    ) : (
                      <span className="step-floor-badge">Floor {step.toNode.floor}</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
