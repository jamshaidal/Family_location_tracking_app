'use client';

import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';

export default function Home() {
    const [family, setFamily] = useState(null);
    const [memberName, setMemberName] = useState('');

    const handleLogin = (familyData, name) => {
        setFamily(familyData);
        if (name) setMemberName(name);
    };

    const handleLogout = () => {
        setFamily(null);
        setMemberName('');
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
            {!family ? (
                <LoginForm onLogin={handleLogin} />
            ) : (
                <Dashboard
                    family={family}
                    initialMemberName={memberName}
                    onLogout={handleLogout}
                />
            )}
        </main>
    );
}
