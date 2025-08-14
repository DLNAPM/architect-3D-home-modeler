

import React, { useState, useCallback, useMemo, useEffect, useContext } from 'react';
import type { HousePlan, Area, Customizations, GeneratedImage, User, Favorite } from './types';
import Header from './components/Header';
import PlanGenerator, { PlanGeneratorData } from './components/PlanGenerator';
import AreaSelector from './components/AreaSelector';
import CustomizationPanel from './components/CustomizationPanel';
import RenderGallery from './components/RenderGallery';
import ProfilePage from './components/ProfilePage';
import SignInModal from './components/SignInModal';
import Lightbox from './components/Lightbox';
import DesignTourModal from './components/DesignTourModal';
import { generateHousePlan, generateImage } from './services/geminiService';
import { ArrowPathIcon, ArrowUturnLeftIcon, CubeIcon } from './components/icons';
import { UserProvider, UserContext } from './contexts/UserContext';

// Helper to get a unique ID
const generateUniqueId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const nightModePromptText = 'It is nighttime, with a dark sky, visible stars, and warm, inviting light glowing from the interior windows and strategic exterior accent lighting.';
const frontExteriorRule = `\n\nCRITICAL INSTRUCTION: You are generating a 'Front Exterior' view. The overall house description is provided for style context ONLY. This description might also mention backyard elements like a swimming pool. You are to COMPLETELY IGNORE any mention of a pool or other backyard features. This image must ONLY show the front, street-facing side of the house. DO NOT include a swimming pool under ANY circumstances.`;
const frontExteriorRuleRegex = /\s*CRITICAL INSTRUCTION: You are generating a 'Front Exterior' view\. The overall house description is provided for style context ONLY\. This description might also mention backyard elements like a swimming pool\. You are to COMPLETELY IGIGNORE any mention of a pool or other backyard features\. This image must ONLY show the front, street-facing side of the house\. DO NOT include a swimming pool under ANY circumstances\.\s*/g;
const backExteriorPoolRule = `\n\nIMPORTANT: This is a 'Back Exterior' view. The main house description mentions a swimming pool. Please ensure the pool is prominently featured in this rendering.`;

const noPoolInGarageRule = `\n\nCRITICAL INSTRUCTION: You are rendering a 'Garage'. Garages are for cars and storage. DO NOT include a swimming pool, hot tub, or any water features in this image.`;
const noPoolInGarageRuleRegex = /\s*CRITICAL INSTRUCTION: You are rendering a 'Garage'\. Garages are for cars and storage\. DO NOT include a swimming pool, hot tub, or any water features in this image\.\s*/g;

const noGarageInBackyardRule = `\n\nCRITICAL INSTRUCTION: You are rendering a 'Backyard' or 'Back Exterior' view. It is architecturally incorrect for a garage to be visible from this viewpoint. DO NOT include a garage, garage doors, or cars inside a garage in this rendering.`;
const noGarageInBackyardRuleRegex = /\s*CRITICAL INSTRUCTION: You are rendering a 'Backyard' or 'Back Exterior' view\. It is architecturally incorrect for a garage to be visible from this viewpoint\. DO NOT include a garage, garage doors, or cars inside a garage in this rendering\.\s*/g;

const noLakeInFrontRule = `\n\nCRITICAL INSTRUCTION: You are generating a 'Front Exterior' view. The image must ONLY show the front, street-facing side of the house. DO NOT include a lake, boat, or any large body of water under ANY circumstances.`;
const noLakeInFrontRuleRegex = /\s*CRITICAL INSTRUCTION: You are generating a 'Front Exterior' view\. The image must ONLY show the front, street-facing side of the house\. DO NOT include a lake, boat, or any large body of water under ANY circumstances\.\s*/g;
const backExteriorLakeAndBoatRule = `\n\nIMPORTANT: This is a 'Back Exterior' view. The main house description mentions a lake. Please ensure a lake with a boat is prominently featured in this rendering.`;

const projectorRule = "\n\nABSOLUTELY CRITICAL: You are rendering a home theater. The projector's orientation is paramount. There must be exactly one projector. It MUST be mounted on the ceiling. It MUST be positioned on the opposite side of the room from the screen. The projector lens MUST point directly at the center of the screen. Under NO circumstances should the projector be aimed sideways, backwards, or away from the screen. A projector facing away from the screen is a critical failure and must be avoided.";
const projectorRuleRegex = /\s*ABSOLUTELY CRITICAL: You are rendering a home theater\. The projector's orientation is paramount\. There must be exactly one projector\. It MUST be mounted on the ceiling\. It MUST be positioned on the opposite side of the room from the screen\. The projector lens MUST point directly at the center of the screen\. Under NO circumstances should the projector be aimed sideways, backwards, or away from the screen\. A projector facing away from the screen is a critical failure and must be avoided\.\s*/g;

const theaterSeatingRule = "\n\nABSOLUTELY CRITICAL: You are rendering a home theater. All seating (every chair, sofa, and recliner) MUST face the screen. The primary purpose of this room is media viewing. Seating should be arranged in rows or an arc, all focused on the screen. DO NOT render any seats facing each other, away from the screen, or in a conversational layout. All seating MUST have a clear line of sight to the screen.";
const theaterSeatingRuleRegex = /\s*ABSOLUTELY CRITICAL: You are rendering a home theater\. All seating \(every chair, sofa, and recliner\) MUST face the screen\. The primary purpose of this room is media viewing\. Seating should be arranged in rows or an arc, all focused on the screen\. DO NOT render any seats facing each other, away from the screen, or in a conversational layout\. All seating MUST have a clear line of sight to the screen\.\s*/g;

const ranchStyleRule = `\n\nCRITICAL ARCHITECTURAL RULE: The project is a "Ranch style" house. Ranch houses are single-story. The rendering MUST show a one-level building. DO NOT create a two-story or multi-level design.`;
const ranchStyleRuleRegex = /\s*CRITICAL ARCHITECTURAL RULE: The project is a "Ranch style" house\. Ranch houses are single-story\. The rendering MUST show a one-level building\. DO NOT create a two-story or multi-level design\.\s*/g;

const carPlacementRule = `\n\nCRITICAL VEHICLE PLACEMENT RULE: You are generating a 'Front Exterior' view. If a vehicle (like a car) is included in the image, it MUST be placed in a realistic location, such as on the driveway or on the street. Under NO circumstances should a vehicle be rendered inside any part of the house structure itself. A car inside a living room, hallway, or any other room is a critical failure and must be avoided.`;
const carPlacementRuleRegex = /\s*CRITICAL VEHICLE PLACEMENT RULE: You are generating a 'Front Exterior' view\. If a vehicle \(like a car\) is included in the image, it MUST be placed in a realistic location, such as on the driveway or on the street\. Under NO circumstances should a vehicle be rendered inside any part of the house structure itself\. A car inside a living room, hallway, or any other room is a critical failure and must be avoided\.\s*/g;

const noPuttingGreenInRoomRule = `\n\nCRITICAL ARCHITECTURAL RULE: You are rendering an interior room of a house. A putting green is an outdoor feature. DO NOT include a putting green, golf holes, or any related golfing equipment inside this room under ANY circumstances.`;
const noPuttingGreenInRoomRuleRegex = /\s*CRITICAL ARCHITECTURAL RULE: You are rendering an interior room of a house\. A putting green is an outdoor feature\. DO NOT include a putting green, golf holes, or any related golfing equipment inside this room under ANY circumstances\.\s*/g;

const noFireplaceAboveBedRule = `\n\nCRITICAL SAFETY & DESIGN RULE: You are rendering a bedroom. Under NO circumstances should a fireplace be placed on the wall directly above the bed's headboard. This is a fire hazard and poor design. If a fireplace is included, it MUST be on a different wall from the bed.`;
const noFireplaceAboveBedRuleRegex = /\s*CRITICAL SAFETY & DESIGN RULE: You are rendering a bedroom\. Under NO circumstances should a fireplace be placed on the wall directly above the bed's headboard\. This is a fire hazard and poor design\. If a fireplace is included, it MUST be on a different wall from the bed\.\s*/g;


// Helper to escape strings for regex creation
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const cleanPromptForDisplay = (prompt: string): string => {
    let cleanedPrompt = prompt;
    // These regexes are already defined in the file
    cleanedPrompt = cleanedPrompt.replace(frontExteriorRuleRegex, '');
    cleanedPrompt = cleanedPrompt.replace(noPoolInGarageRuleRegex, '');
    cleanedPrompt = cleanedPrompt.replace(noGarageInBackyardRuleRegex, '');
    cleanedPrompt = cleanedPrompt.replace(noLakeInFrontRuleRegex, '');
    cleanedPrompt = cleanedPrompt.replace(projectorRuleRegex, '');
    cleanedPrompt = cleanedPrompt.replace(theaterSeatingRuleRegex, '');
    cleanedPrompt = cleanedPrompt.replace(ranchStyleRuleRegex, '');
    cleanedPrompt = cleanedPrompt.replace(carPlacementRuleRegex, '');
    cleanedPrompt = cleanedPrompt.replace(noPuttingGreenInRoomRuleRegex, '');
    cleanedPrompt = cleanedPrompt.replace(noFireplaceAboveBedRuleRegex, '');

    // The rules below are simple strings, so we create regexes to replace all occurrences.
    cleanedPrompt = cleanedPrompt.replace(new RegExp(escapeRegExp(backExteriorPoolRule), 'g'), '');
    cleanedPrompt = cleanedPrompt.replace(new RegExp(escapeRegExp(backExteriorLakeAndBoatRule), 'g'), '');
    cleanedPrompt = cleanedPrompt.replace(new RegExp(escapeRegExp(nightModePromptText), 'g'), '');

    // Remove extra whitespace and newlines that might result from replacements
    return cleanedPrompt.replace(/\s\s+/g, ' ').trim();
};


/**
 * Sanitizes a house description for a "Front Exterior" rendering
 * by removing or replacing keywords for backyard features like pools.
 * This prevents the AI from incorrectly placing them in the front.
 * @param {string} description The original house description or prompt text.
 * @returns {string} The sanitized description or prompt text.
 */
const sanitizeDescriptionForFrontView = (description: string): string => {
    // Replace specific backyard features with more generic terms or remove them.
    // Using "lush lawn" or "garden area" is better than empty strings
    // to avoid grammatically awkward sentences.
    return description
        .replace(/swimming pool/gi, 'lush lawn')
        .replace(/\bpool\b/gi, 'lush lawn') // Use word boundary to avoid replacing "poolside" etc.
        .replace(/putting green/gi, 'garden area')
        .replace(/basketball court/gi, 'paved area')
        .replace(/backyard/gi, 'yard') // Make it more generic
        .replace(/lake/gi, 'landscaped area')
        .replace(/boat/gi, 'garden shed');
};

const AppWrapper: React.FC = () => (
    <UserProvider>
        <App />
    </UserProvider>
);

const App: React.FC = () => {
  const [housePlan, setHousePlan] = useState<HousePlan | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{ [key: string]: GeneratedImage[] }>({});
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<{ [key: string]: boolean }>({});
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [customizations, setCustomizations] = useState<Customizations>({});
  const [error, setError] = useState<string | null>(null);
  const [planFile, setPlanFile] = useState<{ mimeType: string, data: string } | null>(null);
  
  // App navigation
  const [currentView, setCurrentView] = useState<'main' | 'profile'>('main');
  const [isSignInModalOpen, setSignInModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);
  const [tourImage, setTourImage] = useState<GeneratedImage | null>(null);
  
  const { currentUser } = useContext(UserContext);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
        const registerServiceWorker = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js', {
                    scope: '/',
                });
                if (registration.installing) {
                    console.log('Service worker installing');
                } else if (registration.waiting) {
                    console.log('Service worker installed');
                } else if (registration.active) {
                    console.log('Service worker active');
                }
            } catch (error) {
                console.error(`Service worker registration failed:`, error);
            }
        };

        // Delay registration until after the page has loaded.
        window.addEventListener('load', registerServiceWorker);
        return () => window.removeEventListener('load', registerServiceWorker);
    }
  }, []);

  const handleSelectArea = useCallback((area: Area) => {
    setSelectedArea(area);
    setCustomizations({});
  }, []);

  const handleRestart = useCallback(() => {
    if (window.confirm("Are you sure you want to restart? Your current house plan and renderings will be lost.")) {
        setHousePlan(null);
        setGeneratedImages({});
        setSelectedArea(null);
        setCustomizations({});
        setError(null);
        setPlanFile(null);
    }
  }, []);

  const generateInitialImageForArea = useCallback(async (
      area: Area,
      housePlan: HousePlan,
      currentPlanFile: { mimeType: string, data: string } | null
  ): Promise<{ areaName: string, image: GeneratedImage } | null> => {
      try {
          let basePrompt = `Generate a photorealistic 3D architectural rendering of the ${area.name.toLowerCase()}.
This area is part of a house with the overall description: "${housePlan.description}".
The area itself is described as: "${area.description}".`;
  
          const areaNameLower = area.name.toLowerCase();
          
          if (area.type === 'room') {
            basePrompt += noPuttingGreenInRoomRule;
          }
  
          // Apply critical rules
          if (area.type === 'exterior') {
              const isFront = areaNameLower.includes('front');
              const isBack = areaNameLower.includes('back') || areaNameLower.includes('backyard');
              if (isFront) {
                  basePrompt = sanitizeDescriptionForFrontView(basePrompt);
                  basePrompt += frontExteriorRule;
                  basePrompt += noLakeInFrontRule;
                  basePrompt += carPlacementRule;
              }
              if (isBack) {
                  if (housePlan.description.toLowerCase().includes('pool')) {
                      basePrompt += backExteriorPoolRule;
                  }
                  if (housePlan.description.toLowerCase().includes('lake')) {
                      basePrompt += backExteriorLakeAndBoatRule;
                  }
                  basePrompt += noGarageInBackyardRule;
              }
              if (housePlan.description.toLowerCase().includes('ranch style')) {
                  basePrompt += ranchStyleRule;
              }
          }
  
          const { imageUrl, prompt: finalPrompt } = await generateImage(basePrompt, currentPlanFile);
  
          const newImage: GeneratedImage = {
              id: generateUniqueId(),
              url: imageUrl,
              prompt: cleanPromptForDisplay(finalPrompt),
          };
  
          return { areaName: area.name, image: newImage };
      } catch (err) {
          console.error(`Failed to automatically generate image for ${area.name}:`, err);
          setError(`Could not generate an initial image for ${area.name}. You can try generating it manually.`);
          return null;
      }
  }, []);

  const handleGeneratePlan = useCallback(async (data: PlanGeneratorData) => {
      setIsLoadingPlan(true);
      setLoadingMessage("Generating Your House Plan...");
      setError(null);
      setHousePlan(null);
      setGeneratedImages({});
      setSelectedArea(null);
      if (data.file) {
          setPlanFile(data.file);
      } else {
          setPlanFile(null);
      }
  
      try {
          const plan = await generateHousePlan(data);
          setHousePlan(plan);
  
          // Select the first area by default
          if (plan.areas && plan.areas.length > 0) {
              handleSelectArea(plan.areas[0]);
          }
  
          // --- AUTO-GENERATE INITIAL IMAGES ---
          setLoadingMessage("Creating initial 3D renderings...");
  
          const frontArea = plan.areas.find(a => a.type === 'exterior' && a.name.toLowerCase().includes('front'));
          const backArea = plan.areas.find(a => a.type === 'exterior' && a.name.toLowerCase().includes('back'));
  
          const areasToRender = [frontArea, backArea].filter((a): a is Area => !!a);
  
          if (areasToRender.length > 0) {
              const imagePromises = areasToRender.map(area =>
                  generateInitialImageForArea(area, plan, data.file || null)
              );
  
              const results = await Promise.all(imagePromises);
  
              const newImages: { [key: string]: GeneratedImage[] } = {};
              results.forEach(result => {
                  if (result) {
                      newImages[result.areaName] = [result.image];
                  }
              });
              
              setGeneratedImages(newImages);
          }
  
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
          setIsLoadingPlan(false);
          setLoadingMessage('');
      }
  }, [handleSelectArea, generateInitialImageForArea]);
  
  const handleGenerateImage = useCallback(async () => {
    if (!selectedArea || !housePlan) return;

    setIsGeneratingImage(prev => ({ ...prev, [selectedArea.name]: true }));

    let customizationsText = Object.entries(customizations)
        .map(([key, value]) => {
            if (key === 'described_change') return ''; // Handle described changes separately
            if (Array.isArray(value) && value.length > 0) {
                return `${key.replace(/_/g, ' ')}: ${value.join(', ')}`;
            }
            if (typeof value === 'string' && value) {
                return `${key.replace(/_/g, ' ')}: ${value}`;
            }
            return '';
        })
        .filter(Boolean)
        .join('. ');

    const describedChange = (customizations.described_change as string || '').trim();
    if (describedChange) {
        customizationsText += `. Additional modifications: ${describedChange}.`;
    }

    let basePrompt = `Generate a photorealistic 3D architectural rendering of the ${selectedArea.name.toLowerCase()}.
This area is part of a house with the overall description: "${housePlan.description}".
The area itself is described as: "${selectedArea.description}".`;

    if (customizationsText) {
        basePrompt += `\n\nPlease apply the following customizations: ${customizationsText}`;
    }

    const areaNameLower = selectedArea.name.toLowerCase();
    const wantsPuttingGreen = customizations.putting_green === 'Add a Putting Green';

    // Re-apply critical rules during regeneration
    if (selectedArea.type === 'room') {
        // Only apply the "no putting green" rule if the user hasn't explicitly asked for one.
        // This allows them to override the default restriction for eligible rooms.
        if (!wantsPuttingGreen) {
            basePrompt += noPuttingGreenInRoomRule;
        }
    }
    if (selectedArea.type === 'exterior') {
        const isFront = areaNameLower.includes('front');
        const isBack = areaNameLower.includes('back') || areaNameLower.includes('backyard');
        if (isFront) {
            basePrompt = sanitizeDescriptionForFrontView(basePrompt);
            basePrompt += frontExteriorRule;
            basePrompt += noLakeInFrontRule;
            basePrompt += carPlacementRule;
        }
        if (isBack) {
            if (housePlan.description.toLowerCase().includes('pool')) {
                basePrompt += backExteriorPoolRule;
            }
            if (housePlan.description.toLowerCase().includes('lake')) {
                basePrompt += backExteriorLakeAndBoatRule;
            }
            basePrompt += noGarageInBackyardRule;
        }
        if (housePlan.description.toLowerCase().includes('ranch style')) {
            basePrompt += ranchStyleRule;
        }
    }

    if (areaNameLower.includes('bedroom')) {
        basePrompt += noFireplaceAboveBedRule;
    }
    if (areaNameLower.includes('garage')) {
        basePrompt += noPoolInGarageRule;
    }
    if (areaNameLower.includes('theater')) {
        basePrompt += projectorRule;
        basePrompt += theaterSeatingRule;
    }

    // Add specific layout instructions for laundry room units
    if (areaNameLower.includes('laundry')) {
        if (customizations.washer_and_dryer === 'Stackable white units') {
            basePrompt += `\n\nCRITICAL LAYOUT INSTRUCTION: The laundry area must feature a vertically stacked washer and dryer unit. The dryer MUST be on top of the washer. The units MUST be white. Under no circumstances should the units be placed side-by-side.`;
        } else if (customizations.washer_and_dryer === 'Side-by-side chrome units') {
            basePrompt += `\n\nCRITICAL LAYOUT INSTRUCTION: The laundry area must feature a separate washer and a separate dryer placed side-by-side on the floor. The units MUST have a chrome finish. Under no circumstances should the units be stacked vertically.`;
        }
    }

    try {
        const { imageUrl, prompt: finalPrompt } = await generateImage(basePrompt, planFile);

        const newImage: GeneratedImage = {
            id: generateUniqueId(),
            url: imageUrl,
            prompt: cleanPromptForDisplay(finalPrompt),
        };

        setGeneratedImages(prev => ({
            ...prev,
            [selectedArea.name]: [...(prev[selectedArea.name] || []), newImage],
        }));
        // Clear text-based customization after successful generation
        setCustomizations(prev => ({ ...prev, described_change: '' }));
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate image.');
    } finally {
        setIsGeneratingImage(prev => ({ ...prev, [selectedArea.name]: false }));
    }
  }, [selectedArea, customizations, housePlan, planFile, setGeneratedImages, setCustomizations]);


  const handleToggleNightMode = useCallback(async (baseImage: GeneratedImage, enableNight: boolean) => {
    if (!selectedArea) return;
    setIsGeneratingImage(prev => ({ ...prev, [selectedArea.name]: true }));

    let newPrompt = baseImage.prompt;
    if (enableNight) {
        newPrompt = `${newPrompt} ${nightModePromptText}`;
    } else {
        // This is a simple removal. A more robust solution might be needed if the text varies.
        newPrompt = newPrompt.replace(nightModePromptText, '').trim();
    }

    try {
        const { imageUrl, prompt: finalPrompt } = await generateImage(newPrompt, planFile);
        const newImage: GeneratedImage = {
            id: generateUniqueId(),
            url: imageUrl,
            prompt: cleanPromptForDisplay(finalPrompt),
        };
        setGeneratedImages(prev => ({
            ...prev,
            [selectedArea.name]: [...(prev[selectedArea.name] || []), newImage],
        }));
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate night mode image.');
    } finally {
        setIsGeneratingImage(prev => ({ ...prev, [selectedArea.name]: false }));
    }
  }, [selectedArea, planFile]);
  
  const handleDeleteImage = useCallback((areaName: string, imageId: string) => {
    setGeneratedImages(prev => {
        const newImagesForArea = (prev[areaName] || []).filter(img => img.id !== imageId);
        return {
            ...prev,
            [areaName]: newImagesForArea,
        };
    });
  }, []);

  const handleOpenLightbox = (image: GeneratedImage) => {
    setLightboxImage(image);
  };

  const handleCloseLightbox = () => {
    setLightboxImage(null);
  };

  const handleStartTour = (image: GeneratedImage) => {
    setTourImage(image);
  };

  const handleCloseTour = () => {
    setTourImage(null);
  };

  const mainContent = (
    <>
      {!housePlan && !isLoadingPlan && (
        <PlanGenerator onGenerate={handleGeneratePlan} isLoading={isLoadingPlan} />
      )}

      {isLoadingPlan && (
        <div className="text-center py-20">
          <div className="flex justify-center items-center">
            <ArrowPathIcon className="w-12 h-12 text-indigo-500 animate-spin" />
            <span className="text-2xl font-semibold text-gray-700 dark:text-gray-300 ml-4">{loadingMessage}</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">
            The AI is designing your project. This may take a moment.
          </p>
        </div>
      )}

      {housePlan && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8 relative">
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">{housePlan.projectName}</h2>
                <p className="mt-2 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">{housePlan.description}</p>
                 <div className="absolute top-0 right-0">
                    <button 
                        onClick={handleRestart}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors"
                        title="Start Over"
                    >
                        <ArrowUturnLeftIcon className="w-4 h-4" />
                        Restart
                    </button>
                </div>
            </div>

            {/* Render Gallery (Top Section) */}
            <div className="mb-8">
                {selectedArea ? (
                    <RenderGallery
                        areaName={selectedArea.name}
                        areaType={selectedArea.type}
                        images={generatedImages[selectedArea.name] || []}
                        isGenerating={isGeneratingImage[selectedArea.name] || false}
                        onToggleNightMode={handleToggleNightMode}
                        onViewImage={handleOpenLightbox}
                        onStartTour={handleStartTour}
                        onDeleteImage={handleDeleteImage}
                    />
                ) : (
                    <div className="flex items-center justify-center h-[50vh] text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
                        <div>
                            <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4 font-semibold text-lg">Your Renderings Will Appear Here</p>
                            <p className="mt-1">Select an area from the list below to begin.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls (Bottom Section) */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                <div className="lg:col-span-2">
                    <AreaSelector areas={housePlan.areas} selectedArea={selectedArea} onSelect={handleSelectArea} />
                </div>
                <div className="lg:col-span-4">
                    {selectedArea ? (
                        <CustomizationPanel
                            area={selectedArea}
                            customizations={customizations}
                            onCustomizationChange={setCustomizations}
                            onGenerateImage={handleGenerateImage}
                            isGeneratingImage={isGeneratingImage[selectedArea.name] || false}
                        />
                    ) : (
                         <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 min-h-[300px]">
                            <p className="font-semibold">Select an area to see customization options.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <Header 
        onNavigate={setCurrentView}
        onSignInClick={() => setSignInModalOpen(true)}
      />
      
      {isSignInModalOpen && <SignInModal onClose={() => setSignInModalOpen(false)} />}
      
      <main>
          {currentView === 'main' && mainContent}
          {currentView === 'profile' && (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <ProfilePage onNavigate={setCurrentView} onViewImage={handleOpenLightbox} />
            </div>
          )}
      </main>

      <Lightbox image={lightboxImage} onClose={handleCloseLightbox} />
      <DesignTourModal image={tourImage} onClose={handleCloseTour} areaName={selectedArea?.name} />
    </div>
  );
};

export default AppWrapper;