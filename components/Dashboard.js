'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Users, MapPin, LogOut, Target, Navigation } from 'lucide-react';
import LinkManager from './LinkManager';

// Dynamically import MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center text-white bg-white/5 rounded-xl">Loading Map...</div>
});

export default function Dashboard({ family, initialMemberName, onLogout }) {
    const [memberName, setMemberName] = useState(initialMemberName);
    const [members, setMembers] = useState(family.members || []);
    const [locationError, setLocationError] = useState('');
    const [lastUpdate, setLastUpdate] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);
    const [refreshLinks, setRefreshLinks] = useState(0);

    // Function to update local location and send to server
    const updateLocation = useCallback(async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setAccuracy(Math.round(accuracy));
        setIsLocating(false);

        try {
            const res = await fetch('/api/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    familyId: family.id,
                    memberName: memberName,
                    lat: latitude,
                    lng: longitude,
                    accuracy: accuracy,
                    isManual: false
                }),
            });

            const data = await res.json();
            if (data.success) {
                setMembers(data.family.members);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Failed to update location:', error);
        }
    }, [family.id, memberName]);

    const handleManualLocationSet = async (lat, lng) => {
        try {
            const res = await fetch('/api/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    familyId: family.id,
                    memberName: memberName,
                    lat: lat,
                    lng: lng,
                    accuracy: null,
                    isManual: true
                }),
            });

            const data = await res.json();
            if (data.success) {
                setMembers(data.family.members);
                setLastUpdate(new Date());
                setAccuracy(null);
            }
        } catch (error) {
            console.error('Failed to update manual location:', error);
        }
    };

    const handleManualRefresh = () => {
        setIsLocating(true);
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported');
            setIsLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            updateLocation,
            (error) => {
                setLocationError(`Refresh failed: ${error.message}`);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
    };

    const toggleManualMode = () => {
        setIsManualMode(!isManualMode);
        setLocationError(isManualMode ? '' : 'Click on the map to set your location');
    };

    // Setup Geolocation watcher (only when not in manual mode)
    useEffect(() => {
        if (!memberName || isManualMode) return;

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);
        const watchId = navigator.geolocation.watchPosition(
            updateLocation,
            (error) => {
                setLocationError(`Location error: ${error.message}`);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [memberName, updateLocation, isManualMode]);

    // Poll for updates from other family members
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/location?familyName=${encodeURIComponent(family.name)}`);
                const data = await res.json();
                if (data.success) {
                    setMembers(data.family.members);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [family.name]);

    if (!memberName) {
        return (
            <div className="w-full max-w-md p-8 glass-panel animate-fade-in text-center">
                <h2 className="text-2xl font-bold mb-4">Who are you?</h2>
                <p className="text-gray-400 mb-6">Select your name to start sharing location</p>
                <div className="space-y-3">
                    {members.map((m) => (
                        <button
                            key={m.name}
                            onClick={() => setMemberName(m.name)}
                            className="w-full p-3 glass-input hover:bg-white/10 transition-colors text-left flex items-center justify-between"
                        >
                            <span>{m.name}</span>
                            <MapPin size={16} className="text-primary" />
                        </button>
                    ))}
                    <div className="pt-4 border-t border-white/10">
                        <label htmlFor="newName" className="text-sm text-gray-400 mb-2 block">Or join as new member:</label>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const name = e.target.elements.newName.value;
                            if (name) setMemberName(name);
                        }} className="flex gap-2">
                            <input
                                id="newName"
                                name="newName"
                                placeholder="Your Name"
                                className="glass-input py-2"
                                required
                                autoComplete="name"
                            />
                            <button type="submit" className="btn-primary py-2 px-4">Join</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    const currentUser = members.find(m => m.name === memberName) || {};

    return (
        <div className="w-full h-[90vh] max-w-6xl flex flex-col md:flex-row gap-6 animate-fade-in">
            {/* Sidebar */}
            <div className="w-full md:w-80 flex flex-col gap-4">
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl font-bold">{family.name}</h1>
                        <button onClick={onLogout} className="text-gray-400 hover:text-red-400 transition-colors">
                            <LogOut size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <div className={`w-2 h-2 rounded-full ${isLocating ? 'bg-yellow-500 animate-ping' : isManualMode ? 'bg-purple-500' : 'bg-green-500'}`} />
                                <span>Sharing as <strong>{memberName}</strong></span>
                            </div>
                            {accuracy && !isManualMode && (
                                <p className="text-xs text-gray-500 pl-5">
                                    Accuracy: within {accuracy} meters
                                </p>
                            )}
                            {isManualMode && (
                                <p className="text-xs text-green-500 pl-5">
                                    📍 Manual mode - Click map to set location
                                </p>
                            )}
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={toggleManualMode}
                                    className={`flex-1 text-xs py-2 px-2 rounded transition-colors ${isManualMode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                >
                                    {isManualMode ? (
                                        <span className="flex items-center justify-center gap-1"><Target size={12} /> Manual</span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-1"><Navigation size={12} /> Auto GPS</span>
                                    )}
                                </button>
                                {!isManualMode && (
                                    <button
                                        onClick={handleManualRefresh}
                                        disabled={isLocating}
                                        className="flex-1 text-xs bg-white/10 hover:bg-white/20 text-white py-2 px-2 rounded transition-colors disabled:opacity-50"
                                    >
                                        {isLocating ? 'Locating...' : 'Refresh'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Family Members</h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {members.map((member) => (
                                <div key={member.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                                            {member.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            <p className="text-xs text-gray-400">
                                                {member.lastUpdated ? new Date(member.lastUpdated).toLocaleTimeString() : 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                    {member.name === memberName && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                </div>
                            ))}
                            {members.length === 0 && <p className="text-sm text-gray-500 italic">No members yet</p>}
                        </div>
                    </div>
                </div>

                {locationError && (
                    <div className={`glass-panel p-4 text-sm ${isManualMode && locationError.includes('Click') ? 'border-purple-500/30 bg-purple-500/10 text-purple-200' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
                        {locationError}
                    </div>
                )}

                <LinkManager
                    family={family}
                    onLinkCreated={() => setRefreshLinks(prev => prev + 1)}
                />
            </div>

            {/* Map Area */}
            <div className="flex-1 glass-panel p-2 relative overflow-hidden min-h-[400px]">
                <MapComponent
                    members={members}
                    currentUser={currentUser}
                    onManualLocationSet={handleManualLocationSet}
                    isManualMode={isManualMode}
                />
            </div>
        </div>
    );
}
