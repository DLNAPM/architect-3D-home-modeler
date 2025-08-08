import React, { useState, useCallback, useMemo, useEffect, useContext } from 'react';
import type { HousePlan, Area, Customizations, GeneratedImage, User, Favorite } from './types';
import Header from './components/Header';
import PlanGenerator, { PlanGeneratorData } from './components/PlanGenerator';
import AreaSelector from './components/AreaSelector';
import CustomizationPanel from './components/CustomizationPanel';
import RenderGallery from './components/RenderGallery';
import ProfilePage from './components/ProfilePage';
import SignInModal from './components/SignInModal';
import { generateHousePlan, generateImage } from './services/geminiService';
import { HomeIcon } from './components/icons';
import { UserProvider, UserContext } from './contexts/UserContext';

// Helper function for initial rendering generation
const generateInitialImageForArea = async (
    area: Area,
    mainPlanDescription: string,
    planFile: { mimeType: string; data: string } | null
): Promise<{ areaName: string, image: GeneratedImage } | null> => {
    try {
        let prompt = `Generate a photorealistic 3D architectural rendering of the ${area.name.toLowerCase()}.
This area is part of a house with the following overall description: "${mainPlanDescription}".
Specific architectural notes for the ${area.name.toLowerCase()} are: "${area.description}".
The rendering style should be high-end, modern, and clean with cinematic lighting.`;

        const areaNameLower = area.name.toLowerCase();
        if (area.type === 'exterior') {
            if (areaNameLower.includes('back') || areaNameLower.includes('rear')) {
                prompt += ' The view should be from the backyard, looking at the rear facade of the house. This view MUST NOT include a garage or garage doors unless the architectural notes for this area or the main house description specifically mention a rear-facing garage. If the architectural plan or description mentions a pool, ensure it is rendered as part of the backyard architecture. The focus should remain on the building\'s facade and the overall landscape design.';
            } else { // Default to front view for exteriors
                prompt += ' The view should be from the street level, showing the front facade of the house.';
            }
        }
        
        const { imageUrl, prompt: usedPrompt } = await generateImage(prompt, planFile);
        const newImage: GeneratedImage = { id: `${Date.now()}-${area.name}`, url: imageUrl, prompt: usedPrompt };
        
        return { areaName: area.name, image: newImage };
    } catch (e) {
        console.error(`Failed to generate initial image for ${area.name}`, e);
        // Return null on failure so Promise.all doesn't reject, allowing partial success.
        return null;
    }
};

const AppContent: React.FC = () => {
  const [housePlan, setHousePlan] = useState<HousePlan | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [customizations, setCustomizations] = useState<{[areaName: string]: Customizations}>({});
  const [generatedImages, setGeneratedImages] = useState<{[areaName: string]: GeneratedImage[]}>({});
  const [isLoadingPlan, setIsLoadingPlan] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPlan, setUploadedPlan] = useState<{ mimeType: string; data: string } | null>(null);

  const [view, setView] = useState<'main' | 'profile'>('main');
  const [isSignInModalOpen, setSignInModalOpen] = useState(false);
  const { currentUser } = useContext(UserContext);

  useEffect(() => {
    // If user signs out, navigate back to the main page
    if (!currentUser) {
        setView('main');
    }
  }, [currentUser]);


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 7000); // Hide error after 7 seconds
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [error]);

  const handleGeneratePlan = useCallback(async (data: PlanGeneratorData) => {
    setIsLoadingPlan(true);
    setError(null);
    const currentUploadedPlan = 'file' in data ? data.file : null;
    setUploadedPlan(currentUploadedPlan);

    try {
      // Step 1: Generate the house plan structure
      const plan = await generateHousePlan(data);
      
      // Step 2: Find the exterior areas to pre-render
      const frontExterior = plan.areas.find(a => a.type === 'exterior' && a.name.toLowerCase().includes('front'));
      const backExterior = plan.areas.find(a => a.type === 'exterior' && a.name.toLowerCase().includes('back'));

      const imageGenerationPromises: Promise<{ areaName: string; image: GeneratedImage; } | null>[] = [];

      if (frontExterior) {
        imageGenerationPromises.push(generateInitialImageForArea(frontExterior, plan.description, currentUploadedPlan));
      }
      if (backExterior) {
        imageGenerationPromises.push(generateInitialImageForArea(backExterior, plan.description, currentUploadedPlan));
      }

      // Step 3: Generate images concurrently
      const imageResults = await Promise.all(imageGenerationPromises);

      // Step 4: Process the results and update state
      const newGeneratedImages: { [areaName: string]: GeneratedImage[] } = {};
      imageResults.forEach(result => {
          if (result) {
              newGeneratedImages[result.areaName] = [result.image];
          }
      });
      
      if (imageGenerationPromises.length > 0 && Object.keys(newGeneratedImages).length === 0) {
          throw new Error("Could not generate initial exterior renderings.");
      }

      // Step 5: Commit all state changes at once
      setHousePlan(plan);
      setGeneratedImages(newGeneratedImages);
      setCustomizations({});
      setSelectedArea(frontExterior || plan.areas[0] || null); // Default to front exterior view
      setError(null);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate plan: ${errorMessage}`);
      setHousePlan(null);
      setGeneratedImages({});
    } finally {
      setIsLoadingPlan(false);
    }
  }, []);

  const handleSelectArea = useCallback((area: Area) => {
    setSelectedArea(area);
  }, []);

  const handleCustomizationChange = useCallback((areaName: string, newCustoms: Customizations) => {
    setCustomizations(prev => ({ ...prev, [areaName]: newCustoms }));
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!selectedArea || !housePlan) return;
    setIsGeneratingImage(true);
    setError(null);

    const currentCustomizations = customizations[selectedArea.name] || {};

    let prompt = `Generate a photorealistic 3D architectural rendering of the ${selectedArea.name.toLowerCase()}.
This area is part of a house with the following overall description: "${housePlan.description}".
Specific architectural notes for the ${selectedArea.name.toLowerCase()} are: "${selectedArea.description}".`;

    const processedCustomizations = { ...currentCustomizations };
    let doorStyleInstruction = '';
    let vehicleInstruction = '';
    let carLiftInstruction = '';
    const areaNameLower = selectedArea.name.toLowerCase();

    // Special handling for living room door style to clarify it's the entry door
    if (areaNameLower.includes('living') && processedCustomizations.door_style) {
        const doorStyle = processedCustomizations.door_style;
        delete processedCustomizations.door_style; // Remove from generic processing

        if (doorStyle === 'No visible interior doors') {
            doorStyleInstruction = ' The main entry door for the living room should be out of frame or not visible from the vantage point.';
        } else {
            doorStyleInstruction = ` The main door providing entry into this living room must be a ${doorStyle}.`;
        }
    }
    
    // Special handling for vehicle placement in exterior shots
    if (selectedArea.type === 'exterior' && processedCustomizations.vehicle) {
        const vehicle = processedCustomizations.vehicle;
        delete processedCustomizations.vehicle; // Remove from generic processing

        if (vehicle && vehicle !== 'No car') {
            vehicleInstruction = ` A ${vehicle} must be realistically parked on the driveway or street. It MUST NOT be on the grass, lawn, or any other landscaped area.`;
        } else if (vehicle === 'No car') {
            vehicleInstruction = ` Ensure no cars are visible in the rendering.`;
        }
    }

    // Special handling for car lift placement in garage interiors
    if (areaNameLower.includes('garage') && selectedArea.type === 'room' && processedCustomizations.car_lift) {
        const carLift = processedCustomizations.car_lift;
        delete processedCustomizations.car_lift; // Remove from generic processing

        if (carLift && carLift !== 'No Car Lift') {
            carLiftInstruction = ` This garage must feature a ${carLift}. The car lift MUST be rendered fully INSIDE the garage interior. It is an automotive lift used for vehicle maintenance and must be located within the garage, not outdoors.`;
        } else if (carLift === 'No Car Lift') {
            carLiftInstruction = ` Ensure no car lift is visible in the garage.`;
        }
    }


    const details = Object.entries(processedCustomizations)
      .map(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ');
        // Handle array values (for multi-select options like equipment)
        if (Array.isArray(value)) {
          if (value.length === 0) return '';
          return `${formattedKey}: ${value.join(', ')}`;
        }
        // Handle string values
        if (value) {
          return `${formattedKey}: ${value}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('. '); // Join with periods for better prompt structure.

    if (details) {
      prompt += ` Incorporate these specific user customizations: ${details}.`;
    }

    prompt += doorStyleInstruction;
    prompt += vehicleInstruction;
    prompt += carLiftInstruction;

    prompt += ` The rendering style should be high-end, modern, and clean with cinematic lighting.`;

    if (selectedArea.type === 'room') {
        prompt += ' The view should be from just inside the doorway, showing the scale of the room.';

        // Add negative/positive prompts for clarity to prevent incorrect fixtures.
        const isKitchen = areaNameLower.includes('kitchen');
        const isBathroom = areaNameLower.includes('bathroom') || areaNameLower.includes('en suite') || areaNameLower.includes('ensuite');
        const isGarage = areaNameLower.includes('garage');
        const isGym = areaNameLower.includes('gym');

        if (isGarage) {
            prompt += ' This is an interior view of a garage. The large vehicle garage door(s) MUST be rendered on the main exterior-facing wall. It is incorrect to place these large garage doors on interior walls. Any door on an interior wall must be a standard, human-sized door for entry into the main house.';
        }
        
        if (isGym) {
            prompt += ' The room must include a modern ceiling fan with a built-in light fixture, centrally located on the ceiling. As a fitness gym, it MUST NOT contain any wine racks, wine storage, sofas, or kitchen appliances.';
        }

        if (!isKitchen && !isBathroom) {
            prompt += ' This is not a kitchen or a bathroom. The rendering MUST NOT include any sinks, stoves, toilets, showers, or other kitchen/bathroom-specific fixtures.';
        }
    } else { // exterior
        if (areaNameLower.includes('back') || areaNameLower.includes('rear')) {
            prompt += ' The view should be from the backyard, looking at the rear facade of the house. This view MUST NOT include a garage or garage doors unless the architectural notes for this area or the main house description specifically mention a rear-facing garage. If the architectural plan or description mentions a pool, ensure it is rendered as part of the backyard architecture. The focus should remain on the building\\\'s facade and the overall landscape design.';
        } else if (areaNameLower.includes('side')) {
            prompt += ` The view should be from the side yard, looking at the ${areaNameLower.replace(' exterior', '')} side of the house.`;
        } else { // Default to front view
            prompt += ' The view should be from the street level, showing the front facade of the house.';
        }
    }


    try {
      const { imageUrl, prompt: usedPrompt } = await generateImage(prompt, uploadedPlan);
      const newImage: GeneratedImage = { id: Date.now().toString(), url: imageUrl, prompt: usedPrompt };
      
      setGeneratedImages(prev => ({
        ...prev,
        [selectedArea.name]: [...(prev[selectedArea.name] || []), newImage]
      }));

    } catch (e) {
      console.error(e);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  }, [selectedArea, customizations, uploadedPlan, housePlan]);

  const currentAreaCustomizations = useMemo(() => {
    return selectedArea ? customizations[selectedArea.name] || {} : {};
  }, [selectedArea, customizations]);

  const currentAreaImages = useMemo(() => {
    return selectedArea ? generatedImages[selectedArea.name] || [] : [];
  }, [selectedArea, generatedImages]);

  const MainContent = () => (
      <>
        {!housePlan ? (
          <PlanGenerator onGenerate={handleGeneratePlan} isLoading={isLoadingPlan} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-fit">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <HomeIcon className="w-6 h-6 mr-2" />
                House Plan
              </h2>
              <AreaSelector
                areas={housePlan.areas}
                selectedArea={selectedArea}
                onSelect={handleSelectArea}
              />
            </aside>
            
            <div className="lg:col-span-9 grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-1">
                {selectedArea && (
                  <CustomizationPanel
                    key={selectedArea.name}
                    area={selectedArea}
                    customizations={currentAreaCustomizations}
                    onCustomizationChange={(newCustoms) => handleCustomizationChange(selectedArea.name, newCustoms)}
                    onGenerateImage={handleGenerateImage}
                    isGeneratingImage={isGeneratingImage}
                  />
                )}
              </div>
              <div className="xl:col-span-2">
                 {selectedArea && (
                  <RenderGallery 
                    areaName={selectedArea.name}
                    images={currentAreaImages}
                    isGenerating={isGeneratingImage}
                  />
                 )}
              </div>
            </div>
          </div>
        )}
      </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header 
        onNavigate={setView}
        onSignInClick={() => setSignInModalOpen(true)}
      />
      {isSignInModalOpen && <SignInModal onClose={() => setSignInModalOpen(false)} />}
      <main className="container mx-auto p-4 md:p-8">
        {view === 'profile' ? <ProfilePage /> : <MainContent />}
        {error && (
          <div 
            className="fixed bottom-4 right-4 w-full max-w-sm bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-xl flex items-start justify-between z-50"
            role="alert"
          >
            <div className="flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
              <div>
                <p className="font-bold">An Error Occurred</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="-mt-1 -mr-1 p-1 rounded-full hover:bg-red-200" aria-label="Dismiss">
              <svg className="fill-current h-5 w-5" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}


export default function App(): React.ReactNode {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  )
}
