import { GoogleGenAI, Type } from "@google/genai";
import type { HousePlan } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const housePlanSchema = {
    type: Type.OBJECT,
    properties: {
        projectName: {
            type: Type.STRING,
            description: "A creative and fitting name for the house project, e.g., 'The Sunstone Villa'.",
        },
        description: {
            type: Type.STRING,
            description: "A one-paragraph, engaging description of the generated house plan.",
        },
        areas: {
            type: Type.ARRAY,
            description: "A list of all the distinct areas, rooms, and exterior views of the house.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: {
                        type: Type.STRING,
                        description: "The name of the area, e.g., 'Living Room', 'Primary Bedroom', 'Front Exterior'.",
                    },
                    type: {
                        type: Type.STRING,
                        enum: ['room', 'exterior'],
                        description: "The type of area. Must be either 'room' or 'exterior'."
                    },
                    description: {
                        type: Type.STRING,
                        description: "A brief, one-sentence architectural description of this specific area.",
                    },
                },
                required: ["name", "type", "description"],
            },
        },
    },
    required: ["projectName", "description", "areas"],
};

export async function generateHousePlan(data: { description?: string; file?: { mimeType: string, data: string } }): Promise<HousePlan> {
    let contents: any;

    const hasFile = !!data.file;
    const hasDescription = !!data.description && data.description.trim() !== '';

    if (hasFile && hasDescription) {
        // Case 1: Both file and description are provided
        const imagePart = {
            inlineData: {
                mimeType: data.file!.mimeType,
                data: data.file!.data,
            },
        };
        const textPart = {
            text: `Analyze this architectural floor plan image AND the user's description to generate a comprehensive house plan. Use the floor plan as the primary source for layout and structure, and use the user's description for style, materials, and any additional details not present in the plan.

User Description: "${data.description}"

Based on both inputs, generate a detailed architectural house plan. The plan should include a project name, a summary description, and a list of all identified rooms and exterior areas. For each area, provide a short architectural description that synthesizes information from both the plan and the text description.`
        };
        contents = { parts: [imagePart, textPart] };

    } else if (hasFile) {
        // Case 2: File only
        const imagePart = {
            inlineData: {
                mimeType: data.file!.mimeType,
                data: data.file!.data,
            },
        };
        const textPart = {
            text: `Analyze this architectural floor plan image. Identify all the rooms and exterior areas. Generate a detailed architectural house plan based on the image.

The plan should include a project name, a summary description, and a list of all identified rooms and exterior areas. For each area, provide a short architectural description. Ensure the main areas like Kitchen, Living Room, Bedrooms, and Bathrooms are included if they are visible in the plan.`
        };
        contents = { parts: [imagePart, textPart] };

    } else if (hasDescription) {
        // Case 3: Description only
        contents = `Based on the following user description, generate a detailed architectural house plan. The plan should include a project name, a summary description, and a list of all rooms and exterior areas.

User Description: "${data.description}"

Generate the following areas at a minimum, unless specified otherwise: Front Exterior, Back Exterior, Kitchen, Living Room, Primary Bedroom, Primary Bathroom. You can add more rooms if they fit the description. For each area, provide a short architectural description.`;
    } else {
        throw new Error("Either a description or a file must be provided.");
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: housePlanSchema,
        }
    });

    const text = response.text.trim();
    try {
        const plan = JSON.parse(text);
        // Basic validation to ensure the structure is what we expect
        if (!plan.areas || !Array.isArray(plan.areas)) {
            throw new Error("Invalid plan structure received from AI.");
        }
        return plan as HousePlan;
    } catch (e) {
        console.error("Failed to parse house plan JSON:", text);
        throw new Error("The AI returned an invalid house plan format.");
    }
}

async function generateImageFromText(prompt: string): Promise<{imageUrl: string, prompt: string}> {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        return { imageUrl, prompt };
    } else {
        throw new Error("Image generation failed to return an image.");
    }
}

export async function generateImage(
    basePrompt: string,
    plan: { mimeType: string; data: string } | null
): Promise<{imageUrl: string, prompt: string}> {
    let finalPrompt = basePrompt;

    if (plan) {
        console.log("Refining prompt with uploaded plan...");
        const imagePart = { inlineData: { mimeType: plan.mimeType, data: plan.data } };
        const textPart = {
            text: `You are an expert architect and a meticulous translator of 2D floor plans into detailed 3D rendering prompts. Your task is to analyze the attached architectural plan and the user's request to create a new, highly specific prompt that is strictly faithful to the plan's measurements, layout, and features.

1.  **Analyze the Plan:** Carefully examine the specific area mentioned in the original prompt (e.g., "kitchen," "primary bedroom"). Identify key dimensions, proportions, and the spatial relationship of features. If there are measurement annotations, use them. If not, estimate them based on standard architectural conventions (e.g., door widths are 3ft, counter depths are 2ft).

2.  **Strict Adherence to Schematics:** This is the most important rule. **Do not invent, add, or assume architectural elements that are not explicitly visible in the plan.** If a wall on the plan has no window, your prompt must describe a solid wall. If the plan does not show a fireplace, do not add one. Your output must be a direct visual translation of the provided schematic, not a creative reinterpretation.

3.  **Rewrite the Prompt:** Integrate your analysis into the original prompt. The new prompt must explicitly state the dimensions and layout. For example, instead of "a large kitchen," write "a kitchen that is 15 feet by 20 feet with a 10-foot ceiling." Mention the size and placement of windows, doors, and key furniture/fixtures **only as they are seen in the plan.** The goal is to create a photorealistic 3D rendering that is dimensionally and structurally accurate to the provided plan.

Return only the new, detailed prompt as a single block of text.

Original Prompt: "${basePrompt}"`
        };

        const promptResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        finalPrompt = promptResponse.text;
        console.log("Refined prompt:", finalPrompt);
    }

    return await generateImageFromText(finalPrompt);
}