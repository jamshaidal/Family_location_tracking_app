'use client';

import { useState } from 'react';

export default function LoginForm({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [familyName, setFamilyName] = useState('');
    const [password, setPassword] = useState('');
    const [memberName, setMemberName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const action = isRegistering ? 'register' : 'login';
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, familyName, password }),
            });

            const data = await res.json();

            if (data.success) {
                if (isRegistering && !memberName) {
                    // Should not happen due to required attribute, but good to check
                    setError('Member name is required for registration');
                    setLoading(false);
                    return;
                }
                onLogin(data.family, isRegistering ? memberName : '');
            } else {
                setError(data.error || 'Authentication failed');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 glass-panel animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-8 text-white">
                {isRegistering ? 'Create Family Portal' : 'Family Login'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="familyName" className="block text-sm font-medium text-gray-300 mb-2">Family Name</label>
                    <input
                        id="familyName"
                        name="familyName"
                        type="text"
                        required
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        className="glass-input"
                        placeholder="e.g. The Smiths"
                        autoComplete="organization"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Family Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="glass-input"
                        placeholder="••••••••"
                        autoComplete="current-password"
                    />
                </div>

                {isRegistering && (
                    <div className="animate-fade-in">
                        <label htmlFor="memberName" className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
                        <input
                            id="memberName"
                            name="memberName"
                            type="text"
                            required
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                            className="glass-input"
                            placeholder="e.g. John"
                            autoComplete="name"
                        />
                    </div>
                )}

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : (isRegistering ? 'Create & Join' : 'Access Portal')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                    }}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                    {isRegistering ? 'Already have a family portal? Login' : 'New to the app? Create Family Portal'}
                </button>
            </div>
        </div>
    );
}
