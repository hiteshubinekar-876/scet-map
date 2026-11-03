'use client';

import { Floor } from '../../lib/graph';

interface FloorSelectorProps {
  floors: Floor[];
  activeFloor: number;
  routeFloors: number[];
  onSelectFloor: (floorId: number) => void;
}

export default function FloorSelector({
  floors,
  activeFloor,
  routeFloors,
  onSelectFloor,
}: FloorSelectorProps) {
  return (
    <div className="floor-selector-bar" role="tablist" aria-label="Floor level selector">
      <div className="floor-tabs-scroll">
        {floors.map((floor) => {
          const isActive = floor.id === activeFloor;
          const isOnRoute = routeFloors.includes(floor.id);

          return (
            <button
              key={floor.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              className={`floor-tab-btn ${isActive ? 'active' : ''} ${isOnRoute ? 'on-route' : ''}`}
              onClick={() => onSelectFloor(floor.id)}
            >
              <span className="tab-floor-name">{floor.name}</span>
              {isOnRoute && (
                <span
                  className="tab-route-dot"
                  title="This floor is part of your active navigation path"
                  aria-label="On route"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
