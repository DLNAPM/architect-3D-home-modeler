import React, { useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { CubeIcon } from './icons';

interface SignInModalProps {
    onClose: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ onClose }) => {
    const [name, setName] = useState('Alex Doe');
    const [email, setEmail] = useState('alex.doe@example.com');
    const { signIn } = useContext(UserContext);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (name.trim() && email.trim()) {
            signIn(name, email);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-sm w-full m-4">
                <div className="text-center mb-6">
                    <CubeIcon className="mx-auto h-12 w-12 text-indigo-500" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to manage your favorite designs.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            required
                        />
                    </div>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
                        This is a simulated sign-in. No data is sent to a server.
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                         <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3 px-4 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="w-full py-3 px-4 text-sm font-semibold rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignInModal;
