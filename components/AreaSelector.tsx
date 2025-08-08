import React from 'react';
import type { Area } from '../types';

interface AreaSelectorProps {
  areas: Area[];
  selectedArea: Area | null;
  onSelect: (area: Area) => void;
}

const AreaSelector: React.FC<AreaSelectorProps> = ({ areas, selectedArea, onSelect }) => {
  const exteriors = areas.filter(a => a.type === 'exterior');
  const rooms = areas.filter(a => a.type === 'room');

  const renderAreaList = (areaList: Area[], title: string) => (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
      <ul className="space-y-1">
        {areaList.map(area => (
          <li key={area.name}>
            <button
              onClick={() => onSelect(area)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                selectedArea?.name === area.name
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-current={selectedArea?.name === area.name ? 'page' : undefined}
            >
              {area.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <nav>
      {exteriors.length > 0 && renderAreaList(exteriors, 'Exteriors')}
      {rooms.length > 0 && renderAreaList(rooms, 'Rooms')}
    </nav>
  );
};

export default AreaSelector;
