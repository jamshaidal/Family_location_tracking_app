'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Check, AlertCircle } from 'lucide-react';

export default function TrackPage() {
    const params = useParams();
    const token = params.token;

    const [status, setStatus] = useState('loading'); // loading, active, error, denied
    const [memberName, setMemberName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [accuracy, setAccuracy] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState('');

    // Validate token and get member info
    useEffect(() => {
        const validateToken = async () => {
            try {
                const res = await fetch(`/api/track/${token}`);
                const data = await res.json();

                if (data.success) {
                    setMemberName(data.memberName);
                    setFamilyName(data.familyName);
                    setStatus('ready');
                } else {
                    setStatus('error');
                    setError('Invalid or expired tracking link');
                }
            } catch (err) {
                setStatus('error');
                setError('Failed to validate link');
            }
        };

        validateToken();
    }, [token]);

    // Start location tracking
    useEffect(() => {
        if (status !== 'ready' && status !== 'active') return;

        if (!navigator.geolocation) {
            setStatus('error');
            setError('Geolocation is not supported by your device');
            return;
        }

        const sendLocation = async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setAccuracy(Math.round(accuracy));
            setLastUpdate(new Date());

            try {
                await fetch(`/api/track/${token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lat: latitude,
                        lng: longitude,
                        accuracy: Math.round(accuracy)
                    }),
                });

                if (status === 'ready') {
                    setStatus('active');
                }
            } catch (err) {
                console.error('Failed to send location:', err);
            }
        };

        const watchId = navigator.geolocation.watchPosition(
            sendLocation,
            (err) => {
                if (err.code === 1) {
                    setStatus('denied');
                    setError('Location permission was denied');
                } else {
                    setStatus('error');
                    setError(`Location error: ${err.message}`);
                }
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [token, status]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-white/10 rounded-full mb-4">
                        <MapPin size={48} className="text-purple-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Family Location Tracker</h1>
                    <p className="text-gray-400">Real-time location sharing</p>
                </div>

                {/* Status Card */}
                <div className="glass-panel p-8 text-center">
                    {status === 'loading' && (
                        <div>
                            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-300">Validating link...</p>
                        </div>
                    )}

                    {status === 'ready' && (
                        <div>
                            <div className="animate-pulse w-12 h-12 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <MapPin size={24} className="text-yellow-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Requesting Location...</h2>
                            <p className="text-gray-400">Please allow location access when prompted</p>
                        </div>
                    )}

                    {status === 'active' && (
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto flex items-center justify-center">
                                <Check size={32} className="text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Location Sharing Active</h2>
                                <p className="text-gray-400 mb-4">Sharing your location with <strong className="text-white">{familyName}</strong></p>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Member:</span>
                                    <span className="text-white font-medium">{memberName}</span>
                                </div>
                                {accuracy && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Accuracy:</span>
                                        <span className="text-green-400">±{accuracy}m</span>
                                    </div>
                                )}
                                {lastUpdate && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Last Update:</span>
                                        <span className="text-white">{lastUpdate.toLocaleTimeString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-xs text-gray-500">Keep this page open to continue sharing your location</p>
                            </div>
                        </div>
                    )}

                    {status === 'denied' && (
                        <div>
                            <div className="w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <AlertCircle size={24} className="text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Permission Denied</h2>
                            <p className="text-gray-400 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div>
                            <div className="w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <AlertCircle size={24} className="text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Error</h2>
                            <p className="text-gray-400">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
