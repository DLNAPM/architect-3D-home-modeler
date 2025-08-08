import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SparklesIcon, UploadIcon, MicrophoneIcon } from './icons';

// Add types for the Web Speech API to fix TypeScript errors.
interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}
interface SpeechRecognitionResult {
    readonly [index: number]: SpeechRecognitionAlternative;
    readonly length: number;
    isFinal: boolean;
}
interface SpeechRecognitionResultList {
    readonly [index: number]: SpeechRecognitionResult;
    readonly length: number;
}
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onstart: () => void;
    onend: () => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
}
declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition };
        webkitSpeechRecognition: { new(): SpeechRecognition };
    }
}

export type PlanGeneratorData = {
  description?: string;
  file?: { mimeType: string; data: string };
};

interface PlanGeneratorProps {
  onGenerate: (data: PlanGeneratorData) => void;
  isLoading: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
};

const PlanGenerator: React.FC<PlanGeneratorProps> = ({ onGenerate, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'describe' | 'upload'>('describe');
  const [description, setDescription] = useState('A modern, two-story, 4-bedroom house with an open-concept living area, a large kitchen, and a home office. It should have a minimalist design with large windows and a flat roof.');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const descriptionRef = useRef(description);
  useEffect(() => {
    descriptionRef.current = description;
  }, [description]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Please try Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const descriptionBeforeListening = descriptionRef.current;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setDescription((descriptionBeforeListening ? descriptionBeforeListening + ' ' : '') + transcript);
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access was denied. Please allow microphone access in your browser settings.');
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  }, [isListening]);


  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && ['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
        setFile(selectedFile);
    } else if (selectedFile) {
        alert('Please upload a valid image file (JPEG, PNG, WebP).');
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'describe' && description.trim()) {
      onGenerate({ description: description.trim() });
    } else if (activeTab === 'upload' && file) {
      try {
        const base64Data = await fileToBase64(file);
        const data: PlanGeneratorData = { file: { mimeType: file.type, data: base64Data } };
        if (description.trim()) {
          data.description = description.trim();
        }
        onGenerate(data);
      } catch (error) {
        console.error("Error converting file to base64:", error);
        alert("Could not process the file. Please try another one.");
      }
    }
  };
  
  const isSubmitDisabled = isLoading || (activeTab === 'describe' && !description.trim()) || (activeTab === 'upload' && !file);

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white mb-4">
        Design Your Dream Home with AI
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        Start by describing your ideal house, or upload an existing floor plan to begin.
      </p>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-2xl">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <TabButton title="Describe" active={activeTab === 'describe'} onClick={() => setActiveTab('describe')} />
          <TabButton title="Upload Plan" active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} />
        </div>

        <div className="p-6">
          {activeTab === 'describe' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="house-description" className="text-left text-lg font-semibold text-gray-700 dark:text-gray-200">
                  House Description
                </label>
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`p-2 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                  aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
              </div>
              <textarea
                id="house-description"
                rows={5}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., A cozy single-story cottage with 3 bedrooms..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-left text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Architectural Plan
              </label>
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex justify-center items-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                  ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                />
                {file ? (
                    <div className="text-center">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{file.name}</p>
                        <p className="text-sm text-gray-500">({(file.size / 1024).toFixed(2)} KB)</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="mt-2 text-sm text-red-600 hover:underline">
                            Clear
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <UploadIcon className="mx-auto h-10 w-10 mb-2" />
                        <p className="font-semibold">Click to upload or drag & drop</p>
                        <p className="text-sm">PNG, JPG, or WEBP</p>
                    </div>
                )}
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="mt-6 w-full flex items-center justify-center px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Plan...
              </>
            ) : (
              <>
                <SparklesIcon className="w-6 h-6 mr-2" />
                Generate House Plan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const TabButton: React.FC<{ title: string; active: boolean; onClick: () => void; }> = ({ title, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-6 py-3 text-lg font-semibold rounded-t-lg transition-colors
        ${active
            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
    >
        {title}
    </button>
);


export default PlanGenerator;