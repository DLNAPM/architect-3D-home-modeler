import React, { useContext } from 'react';
import type { GeneratedImage, Favorite } from '../types';
import { HeartIcon } from './icons';
import { UserContext } from '../contexts/UserContext';

interface RenderGalleryProps {
  areaName: string;
  images: GeneratedImage[];
  isGenerating: boolean;
}

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const ImageCard: React.FC<{ image: GeneratedImage, areaName: string }> = ({ image, areaName }) => {
    const { currentUser, favorites, addFavorite, removeFavorite } = useContext(UserContext);
    const isFavorited = favorites.some(fav => fav.id === image.id);
    
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = image.url;
        const filename = `${areaName.replace(/\s+/g, '-')}_${image.id}.jpeg`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;
        
        const favoriteData: Favorite = { ...image, areaName };

        if (isFavorited) {
            removeFavorite(image.id);
        } else {
            addFavorite(favoriteData);
        }
    };

    return (
      <div className="group relative bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
        <img src={image.url} alt={`Rendering of ${areaName}`} className="w-full h-full object-cover aspect-[16/9]" />
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
            <div className="text-white text-xs overflow-y-auto max-h-[80%] custom-scrollbar">
                <p className="font-bold mb-2">Prompt:</p>
                <p>{image.prompt}</p>
            </div>
             <div className="flex justify-end items-center gap-2">
                {currentUser && (
                    <button
                        onClick={handleFavoriteClick}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                    >
                        <HeartIcon className={`w-5 h-5 text-white ${isFavorited ? 'fill-red-500' : 'fill-transparent'}`} />
                    </button>
                )}
                <button
                    onClick={handleDownload}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                    aria-label="Download image"
                >
                    <DownloadIcon className="w-5 h-5 text-white" />
                </button>
             </div>
        </div>
      </div>
    );
};

const LoadingSkeleton: React.FC = () => (
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow-md animate-pulse aspect-[16/9]"></div>
);

const RenderGallery: React.FC<RenderGalleryProps> = ({ areaName, images, isGenerating }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-full">
      <h3 className="text-xl font-bold mb-4">Renderings for {areaName}</h3>
      {images.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="font-semibold">No renderings yet.</p>
          <p className="text-sm">Customize the options and click "Generate 3D Render" to start.</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6">
        {isGenerating && <LoadingSkeleton />}
        {images.slice().reverse().map(image => (
          <ImageCard key={image.id} image={image} areaName={areaName} />
        ))}
      </div>
    </div>
  );
};

export default RenderGallery;
