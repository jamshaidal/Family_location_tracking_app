'use client';

import { useEffect, useState, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with Next.js
if (typeof window !== 'undefined') {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

// Component to update map center when members change
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

// Component to handle map clicks for manual location setting
function MapClickHandler({ onLocationClick, isManualMode }) {
    useMapEvents({
        click(e) {
            if (isManualMode) {
                onLocationClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

export default function MapComponent({ members, currentUser, onManualLocationSet, isManualMode }) {
    const [center, setCenter] = useState([51.505, -0.09]); // Default center

    useEffect(() => {
        if (currentUser && currentUser.lat && currentUser.lng) {
            setCenter([currentUser.lat, currentUser.lng]);
        } else if (members.length > 0) {
            // If current user has no location, center on first member who does
            const firstMemberWithLoc = members.find(m => m.lat && m.lng);
            if (firstMemberWithLoc) {
                setCenter([firstMemberWithLoc.lat, firstMemberWithLoc.lng]);
            }
        }
    }, [currentUser, members]);

    const handleMapClick = (lat, lng) => {
        if (onManualLocationSet) {
            onManualLocationSet(lat, lng);
        }
    };

    return (
        <MapContainer
            center={center}
            zoom={15}
            style={{ height: '100%', width: '100%', cursor: isManualMode ? 'crosshair' : 'grab' }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={center} />
            <MapClickHandler onLocationClick={handleMapClick} isManualMode={isManualMode} />
            {members.map((member) => (
                member.lat && member.lng && (
                    <Fragment key={member.name}>
                        <Marker position={[member.lat, member.lng]}>
                            <Popup>
                                <div className="text-center">
                                    <strong className="block text-lg">{member.name}</strong>
                                    <span className="text-xs text-gray-500">
                                        {new Date(member.lastUpdated).toLocaleTimeString()}
                                    </span>
                                    {member.accuracy && (
                                        <span className="block text-xs text-blue-500">
                                            Accuracy: ±{Math.round(member.accuracy)}m
                                        </span>
                                    )}
                                    {member.isManual && (
                                        <span className="block text-xs text-green-500">
                                            📍 Manual Position
                                        </span>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                        {member.accuracy && !member.isManual && (
                            <Circle
                                center={[member.lat, member.lng]}
                                radius={member.accuracy}
                                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, weight: 1 }}
                            />
                        )}
                    </Fragment>
                )
            ))}
        </MapContainer>
    );
}
