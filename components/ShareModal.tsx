import React, { useState } from 'react';
import type { Favorite } from '../types';
import { ShareIcon } from './icons';

interface ShareModalProps {
    favorite: Favorite;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ favorite, onClose }) => {
    const [recipientEmail, setRecipientEmail] = useState('');
    const [message, setMessage] = useState(`Check out this cool design for a ${favorite.areaName}!`);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(`Sharing rendering ${favorite.id} to ${recipientEmail} with message: "${message}"`);
        setIsSent(true);
        setTimeout(() => {
            onClose();
        }, 2000); // Close modal after 2 seconds
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-lg w-full m-4">
                <div className="flex items-start justify-between mb-4">
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Share Rendering</h2>
                     <button onClick={onClose} aria-label="Close" className="-mt-2 -mr-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg className="fill-current h-6 w-6 text-gray-600 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                     </button>
                </div>
                
                {isSent ? (
                    <div className="text-center py-8">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                             <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Sent Successfully!</h3>
                    </div>
                ) : (
                    <div className="flex gap-6">
                        <img src={favorite.url} alt={favorite.areaName} className="w-1/3 h-auto object-cover rounded-lg hidden sm:block" />
                        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                            <div>
                                <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Recipient's Email
                                </label>
                                <input
                                    type="email"
                                    id="recipient-email"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                    placeholder="friend@example.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Message (optional)
                                </label>
                                <textarea
                                    id="message"
                                    rows={3}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center py-3 px-4 font-semibold rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <ShareIcon className="w-5 h-5 mr-2" />
                                Send
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareModal;
