import React from 'react';
import type { Area, Customizations } from '../types';
import { SparklesIcon } from './icons';

interface CustomizationPanelProps {
  area: Area;
  customizations: Customizations;
  onCustomizationChange: (newCustomizations: Customizations) => void;
  onGenerateImage: () => void;
  isGeneratingImage: boolean;
}

// Define customization options for different area types
const customizationOptions: { [areaType: string]: { [key: string]: string[] | string[][] } } = {
  room: {
    flooring: ['Light Oak Wood', 'Dark Walnut Wood', 'Polished Concrete', 'Plush Carpet', 'Marble Tile'],
    wall_color: ['Off-White', 'Light Gray', 'Beige', 'Navy Blue Accent Wall'],
    lighting: ['Recessed LEDs', 'Modern Chandelier', 'Track Lighting', 'Floor Lamps'],
  },
  kitchen: {
    cabinet_style: ['White Shaker', 'Dark Wood Flat-Panel', 'Blue Farmhouse', 'Glass-front'],
    countertop_material: ['White Quartz', 'Black Granite', 'Butcher Block', 'Marble'],
    appliances: ['Stainless Steel', 'Matte Black', 'Integrated/Panel-Ready'],
    backsplash: ['Subway Tile', 'Mosaic Pattern', 'Single Marble Slab'],
    kitchen_sink: ['Undermount Stainless Steel', 'White Farmhouse Apron Sink']
  },
  bathroom: {
    vanity_style: ['Floating Wood Vanity', 'Traditional Cabinet', 'Pedestal Sink'],
    shower_or_tub: ['Glass Walk-in Shower', 'Freestanding Soaking Tub', 'Shower and Tub Combination', 'Wet Room (Open shower and tub)', 'Clawfoot Tub with Shower'],
    tile_style: ['Large Format Gray', 'White Penny Tiles', 'Patterned Cement'],
    bathroom_sink: ['Vessel Bowl Sink', 'Integrated Countertop Sink'],
    mirror_style: ['LED Backlit Mirror', 'Large Frameless Mirror', 'Ornate Gold Frame Mirror', 'Dual Medicine Cabinets']
  },
  bedroom: {
    bed_style: ['Low-Profile Platform Bed', 'Upholstered Headboard', 'Four-Poster Bed'],
    furniture_style: ['Minimalist Scandinavian', 'Mid-Century Modern', 'Rustic Farmhouse'],
    closet_design: ['Walk-in with custom shelves', 'Sliding Door Wardrobe'],
    ceiling_fan: [
        'Modern low-profile fan with light',
        'Industrial cage fan',
        'Tropical style with leaf blades',
        'Traditional 5-blade fan with light kit',
        'No fan, flush mount light instead'
    ]
  },
  living_room: {
    furniture_style: ['Large Sectional Sofa', 'Leather Chesterfield Sofa', 'Mid-century Modern Armchairs'],
    chairs: ['Matching Armchairs', 'Contrasting Accent Chairs', 'Recliners', 'No additional chairs'],
    coffee_table: ['Modern Glass Top', 'Rustic Wooden Table', 'Marble Block Table', 'No Coffee Table'],
    wine_storage: ['Built-in Wine Rack', 'Modern Wine Wall Display', 'Wine Fridge Cabinet', 'No Wine Storage'],
    fireplace: ['Modern Linear Gas Fireplace', 'Traditional Brick Fireplace', 'No Fireplace'],
    door_style: ['Solid Wood Door', 'Modern Glass Door', 'Sliding Glass Barn Door', 'French Doors', 'No visible interior doors'],
  },
  office: {
    desk_style: ['Modern L-shaped Desk', 'Executive Wooden Desk', 'Standing Desk', 'Minimalist White Desk'],
    office_chair: ['Ergonomic Mesh Chair', 'Leather Executive Chair', 'Modern Accent Chair'],
    storage: ['Bookshelves', 'Filing Cabinets', 'Floating Shelves'],
  },
  exterior: {
    siding_material: ['White Board and Batten', 'Dark Gray Horizontal Siding', 'Natural Wood Cladding', 'Stucco', 'Stucco and Stone'],
    roof_style: ['Black Metal Roof', 'Asphalt Shingles', 'Flat Roof'],
    window_trim_color: ['Black', 'White', 'Natural Wood'],
    landscaping: ['Manicured Lawn with a few trees', 'Desert-style with rocks and cacti', 'Lush flower beds'],
    vehicle: ['Silver Tesla Model Y', 'Black Range Rover', 'Vintage Red Convertible', 'No car'],
  },
  laundry: {
      washer_and_dryer: ['Stackable white units', 'Side-by-side chrome units']
  },
  mud_room: {
      cabinets: ['Floor-to-ceiling storage cabinets', 'Bench with cubbies and hooks', 'Open shelving with baskets']
  },
  bar: {
      bar_style: [
          'Modern with waterfall countertop and LED lighting',
          'Classic wood with built-in wine fridge and glass cabinets',
          'Industrial with pipe shelving and concrete bar top',
          'Compact under-stairs bar'
      ],
      bar_stools: [
          'Modern leather stools with backrest',
          'Industrial metal and wood stools',
          'Upholstered swivel bar stools',
          'Backless wooden stools'
      ],
      bar_tv: [
          'Large wall-mounted flat-screen TV',
          'Small TV on a shelf',
          'Hidden pop-up TV from cabinet',
          'No TV'
      ],
      bar_cabinets: [
          'Dark wood cabinets with built-in wine fridge',
          'Floating white lacquer shelves with LED backlighting',
          'Open industrial pipe shelving',
          'Integrated under-counter cabinets and sink'
      ]
  },
  breakfast_area: {
    table_style: ['Round pedestal table', 'Rectangular farmhouse table', 'Glass-top dining table', 'Built-in breakfast nook table'],
    seating_style: ['Upholstered dining chairs', 'Wooden bench seating', 'Modern molded plastic chairs', 'Rattan chairs'],
    patio_door: ['Large glass sliding door to patio', 'French doors to backyard', 'Standard window instead of door', 'Solid wall (no door or window)'],
  },
  driveway: {
    driveway_material: ['Poured Concrete', 'Asphalt', 'Brick Pavers', 'Gravel', 'Cobblestone'],
    driveway_shape: ['Straight leading to garage', 'Curved with landscaping', 'Circular in front of house', 'Side-entry'],
    gate_style: ['Modern sliding metal gate', 'Classic wrought iron gate', 'Wooden farmhouse gate', 'No gate'],
  },
  garage: {
    garage_door_style: ['Modern Glass Panel', 'Traditional Raised Panel', 'Carriage House Style', 'Roll-up Door'],
    garage_door_color: ['White', 'Black', 'Wood Finish', 'Gray'],
    cabinets: ['Metal Storage Cabinets', 'Wood Cabinets', 'Slatwall with Hooks', 'No Cabinets'],
    car_lift: ['Two-Post Car Lift', 'Four-Post Car Lift', 'No Car Lift']
  },
  gym: {
    flooring: ['Rubber Flooring', 'Interlocking Puzzle Mat', 'Gray Foam Tiles'],
    equipment: ['Stationary Bike', 'Treadmill', 'Barbells with Rack', 'Leg Press Machine', 'Medicine Balls', 'Workout Bench'],
    gym_station: ['Towel and Water Table', 'Yoga & Stretching Corner', 'No Station'],
  },
};

const getOptionsForArea = (area: Area) => {
    let combinedOptions: { [key: string]: any } = {};
    const areaName = area.name.toLowerCase();

    if (area.type === 'exterior') {
        combinedOptions = { ...customizationOptions.exterior };
        
        // Remove vehicle option for back/rear exterior views, as cars are not parked in the backyard.
        if (areaName.includes('back') || areaName.includes('rear')) {
            delete combinedOptions.vehicle;
        }

        if (areaName.includes('driveway')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.driveway };
        }
        if (areaName.includes('garage')) {
            // For an exterior view, only show door options
            combinedOptions.garage_door_style = customizationOptions.garage.garage_door_style;
            combinedOptions.garage_door_color = customizationOptions.garage.garage_door_color;
        }
    } else { // It's a room
        combinedOptions = { ...customizationOptions.room };

        if (areaName.includes('kitchen')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.kitchen };
        }
        if (areaName.includes('bathroom') || areaName.includes('en suite') || areaName.includes('ensuite')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.bathroom };
        }
        if (areaName.includes('bedroom')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.bedroom };
        }
        if (areaName.includes('living')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.living_room };
        }
        if (areaName.includes('office')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.office };
        }
        if (areaName.includes('laundry')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.laundry };
        }
        if (areaName.includes('mud room') || areaName.includes('mudroom')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.mud_room };
        }
        if (areaName.includes('bar')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.bar };
        }
        if (areaName.includes('breakfast')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.breakfast_area };
        }
        if (areaName.includes('garage')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.garage };
        }
        if (areaName.includes('gym')) {
            combinedOptions = { ...combinedOptions, ...customizationOptions.gym };
            // A gym should not have wine storage.
            delete combinedOptions.wine_storage;
        }
    }
    
    return combinedOptions;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  area,
  customizations,
  onCustomizationChange,
  onGenerateImage,
  isGeneratingImage,
}) => {
  const options = getOptionsForArea(area);

  const handleSelectChange = (key: string, value: string) => {
    onCustomizationChange({ ...customizations, [key]: value });
  };

  const handleCheckboxChange = (key: string, optionValue: string) => {
    const currentValues = (customizations[key] as string[] | undefined) || [];
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter(v => v !== optionValue)
      : [...currentValues, optionValue];
    onCustomizationChange({ ...customizations, [key]: newValues });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <div className="flex-grow overflow-y-auto pr-2">
        <h3 className="text-xl font-bold mb-1">{area.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{area.description}</p>
        
        <div className="space-y-4">
          {Object.entries(options).map(([key, values]) => {
            // Render checkboxes for the 'equipment' key
            if (key === 'equipment') {
              return (
                <fieldset key={key}>
                  <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize mb-2">
                    {key.replace(/_/g, ' ')}
                  </legend>
                  <div className="space-y-2">
                    {(values as string[]).map(option => (
                      <div key={option} className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={`${key}-${option.replace(/\s+/g, '-')}`}
                            name={key}
                            type="checkbox"
                            checked={((customizations[key] as string[]) || []).includes(option)}
                            onChange={() => handleCheckboxChange(key, option)}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={`${key}-${option.replace(/\s+/g, '-')}`} className="font-medium text-gray-900 dark:text-gray-300 select-none cursor-pointer">
                            {option}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>
              );
            }

            // Render select dropdowns for all other keys
            return (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize mb-1">
                  {key.replace(/_/g, ' ')}
                </label>
                <select
                  id={key}
                  name={key}
                  value={(customizations[key] as string) || ''}
                  onChange={(e) => handleSelectChange(key, e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                >
                  <option value="">Default</option>
                  {(values as string[]).map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onGenerateImage}
          disabled={isGeneratingImage}
          className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all"
        >
          {isGeneratingImage ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating 3D Render...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Generate 3D Render
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomizationPanel;