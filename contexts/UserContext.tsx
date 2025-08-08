import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User, Favorite } from '../types';

interface UserContextType {
    currentUser: User | null;
    favorites: Favorite[];
    signIn: (name: string, email: string) => void;
    signOut: () => void;
    addFavorite: (favorite: Favorite) => void;
    removeFavorite: (id: string) => void;
}

export const UserContext = createContext<UserContextType>({
    currentUser: null,
    favorites: [],
    signIn: () => {},
    signOut: () => {},
    addFavorite: () => {},
    removeFavorite: () => {},
});

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [favorites, setFavorites] = useState<Favorite[]>([]);

    useEffect(() => {
        // Load user and favorites from localStorage on initial render
        try {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                const user: User = JSON.parse(storedUser);
                setCurrentUser(user);
                
                const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
                if (storedFavorites) {
                    setFavorites(JSON.parse(storedFavorites));
                }
            }
        } catch (error) {
            console.error("Failed to parse from localStorage", error);
            // Clear corrupted data
            localStorage.removeItem('currentUser');
        }
    }, []);

    useEffect(() => {
        // Save user to localStorage when it changes
        try {
            if (currentUser) {
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } else {
                localStorage.removeItem('currentUser');
            }
        } catch (error) {
            console.error("Failed to save user to localStorage", error);
        }
    }, [currentUser]);
    
    useEffect(() => {
        // Save favorites to localStorage when they change
        try {
            if (currentUser) {
                localStorage.setItem(`favorites_${currentUser.id}`, JSON.stringify(favorites));
            }
        } catch (error) {
            console.error("Failed to save favorites to localStorage", error);
        }
    }, [favorites, currentUser]);

    const signIn = (name: string, email: string) => {
        const user: User = { id: `user_${Date.now()}`, name, email };
        setCurrentUser(user);
        // Load their favorites if they exist, otherwise start fresh
        const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
        setFavorites(storedFavorites ? JSON.parse(storedFavorites) : []);
    };

    const signOut = () => {
        setCurrentUser(null);
        setFavorites([]);
        // Do not clear favorites from storage on sign-out, so they persist for next login
    };

    const addFavorite = (favorite: Favorite) => {
        setFavorites(prev => [...prev, favorite]);
    };

    const removeFavorite = (id: string) => {
        setFavorites(prev => prev.filter(fav => fav.id !== id));
    };

    return (
        <UserContext.Provider value={{ currentUser, favorites, signIn, signOut, addFavorite, removeFavorite }}>
            {children}
        </UserContext.Provider>
    );
};
