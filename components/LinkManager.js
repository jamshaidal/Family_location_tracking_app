'use client';

import { useState } from 'react';
import { Link2, Copy, Trash2, Check, Plus } from 'lucide-react';

export default function LinkManager({ family, onLinkCreated }) {
    const [showManager, setShowManager] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [copiedToken, setCopiedToken] = useState(null);
    const [generating, setGenerating] = useState(false);

    const trackingLinks = family.trackingLinks || [];

    const handleGenerateLink = async (e) => {
        e.preventDefault();
        if (!newMemberName.trim()) return;

        setGenerating(true);
        try {
            const res = await fetch('/api/links/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    familyId: family.id,
                    memberName: newMemberName.trim()
                }),
            });

            const data = await res.json();
            if (data.success) {
                setNewMemberName('');
                if (onLinkCreated) onLinkCreated();
            }
        } catch (error) {
            console.error('Failed to generate link:', error);
        } finally {
            setGenerating(false);
        }
    };

    const copyLink = (token) => {
        const link = `${window.location.origin}/track/${token}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link);
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = link;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);
        }
    };

    const handleDisableLink = async (token) => {
        try {
            await fetch('/api/links/disable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    familyId: family.id,
                    token
                }),
            });
            if (onLinkCreated) onLinkCreated();
        } catch (error) {
            console.error('Failed to disable link:', error);
        }
    };

    return (
        <div className="glass-panel p-4">
            <button
                onClick={() => setShowManager(!showManager)}
                className="w-full flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-2">
                    <Link2 size={18} className="text-purple-400" />
                    <span className="font-medium">Tracking Links</span>
                    {trackingLinks.filter(l => l.active).length > 0 && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                            {trackingLinks.filter(l => l.active).length}
                        </span>
                    )}
                </div>
                <span className="text-gray-400">{showManager ? '▼' : '▶'}</span>
            </button>

            {showManager && (
                <div className="mt-4 space-y-4">
                    {/* Generate New Link */}
                    <form onSubmit={handleGenerateLink} className="flex gap-2">
                        <input
                            type="text"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            placeholder="Member name"
                            className="glass-input text-sm py-2 flex-1"
                        />
                        <button
                            type="submit"
                            disabled={generating || !newMemberName.trim()}
                            className="btn-primary py-2 px-3 text-sm disabled:opacity-50 flex items-center gap-1"
                        >
                            <Plus size={14} />
                            Generate
                        </button>
                    </form>

                    {/* Active Links */}
                    {trackingLinks.filter(l => l.active).length > 0 ? (
                        <div className="space-y-2">
                            <h4 className="text-xs text-gray-500 uppercase">Active Links</h4>
                            {trackingLinks.filter(l => l.active).map((link) => (
                                <div key={link.token} className="bg-white/5 rounded-lg p-3 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-sm">{link.memberName}</p>
                                            <p className="text-xs text-gray-400">
                                                Created: {new Date(link.createdAt).toLocaleDateString()}
                                            </p>
                                            {link.lastUsed && (
                                                <p className="text-xs text-green-400">
                                                    Last used: {new Date(link.lastUsed).toLocaleTimeString()}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDisableLink(link.token)}
                                            className="text-red-400 hover:text-red-300"
                                            title="Disable link"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => copyLink(link.token)}
                                        className="w-full flex items-center justify-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs py-2 rounded transition-colors"
                                    >
                                        {copiedToken === link.token ? (
                                            <>
                                                <Check size={12} />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={12} />
                                                Copy Link
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic text-center py-2">
                            No active tracking links
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
