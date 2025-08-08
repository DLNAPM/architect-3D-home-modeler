import React, { useContext, useState, useRef, useEffect } from 'react';
import { CubeIcon, UserCircleIcon } from './icons';
import { UserContext } from '../contexts/UserContext';

interface HeaderProps {
    onNavigate: (view: 'main' | 'profile') => void;
    onSignInClick: () => void;
}


const Header: React.FC<HeaderProps> = ({ onNavigate, onSignInClick }) => {
  const { currentUser, signOut } = useContext(UserContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button onClick={() => onNavigate('main')} className="flex items-center" aria-label="Go to homepage">
            <CubeIcon className="h-8 w-8 text-indigo-500" />
            <h1 className="ml-3 text-2xl font-bold text-gray-800 dark:text-white">
              Architect 3D Home Modeler
            </h1>
          </button>

          <div className="flex items-center">
            {currentUser ? (
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center justify-center w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full text-indigo-500 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                        aria-expanded={menuOpen}
                        aria-haspopup="true"
                    >
                       <UserCircleIcon className="w-8 h-8"/>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
                            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-700 dark:text-gray-200">Signed in as</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                            </div>
                            <button
                                onClick={() => { onNavigate('profile'); setMenuOpen(false); }}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                role="menuitem"
                            >
                                My Favorites
                            </button>
                            <button
                                onClick={() => { signOut(); setMenuOpen(false); }}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                role="menuitem"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    onClick={onSignInClick}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    Sign In
                </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
