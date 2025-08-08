import React, { useContext, useState } from 'react';
import { UserContext } from '../contexts/UserContext';
import { ShareIcon, TrashIcon, UserCircleIcon, HomeIcon } from './icons';
import type { Favorite } from '../types';
import ShareModal from './ShareModal';

const FavoriteCard: React.FC<{ favorite: Favorite; onRemove: (id: string) => void; onShare: (fav: Favorite) => void; }> = ({ favorite, onRemove, onShare }) => {
    return (
        <div className="group relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105">
            <img src={favorite.url} alt={`Rendering of ${favorite.areaName}`} className="w-full h-48 object-cover" />
            <div className="p-4">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{favorite.areaName}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={favorite.prompt}>{favorite.prompt}</p>
            </div>
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                <button
                    onClick={() => onShare(favorite)}
                    className="p-3 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                    aria-label="Share rendering"
                >
                    <ShareIcon className="w-6 h-6 text-white" />
                </button>
                <button
                    onClick={() => onRemove(favorite.id)}
                    className="p-3 bg-white/20 rounded-full hover:bg-red-500/50 transition-colors"
                    aria-label="Remove from favorites"
                >
                    <TrashIcon className="w-6 h-6 text-white" />
                </button>
            </div>
        </div>
    );
};

const ProfilePage: React.FC = () => {
    const { currentUser, favorites, removeFavorite } = useContext(UserContext);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedFavorite, setSelectedFavorite] = useState<Favorite | null>(null);

    if (!currentUser) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold">Please sign in to view your profile.</h2>
            </div>
        );
    }
    
    const handleShareClick = (favorite: Favorite) => {
        setSelectedFavorite(favorite);
        setShareModalOpen(true);
    };

    return (
        <div className="max-w-6xl mx-auto">
            {shareModalOpen && selectedFavorite && (
                <ShareModal favorite={selectedFavorite} onClose={() => setShareModalOpen(false)} />
            )}

            <div className="flex flex-col md:flex-row items-center gap-6 mb-12 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                <UserCircleIcon className="w-24 h-24 text-indigo-500" />
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">{currentUser.name}</h2>
                    <p className="text-md text-gray-600 dark:text-gray-400">{currentUser.email}</p>
                </div>
            </div>

            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <HomeIcon className="w-7 h-7" />
                My Favorite Renderings
            </h3>
            
            {favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {favorites.map(fav => (
                        <FavoriteCard key={fav.id} favorite={fav} onRemove={removeFavorite} onShare={handleShareClick} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 px-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">No Favorites Yet</h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                        Go back to the design tool and click the heart icon on any rendering to save it here.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
