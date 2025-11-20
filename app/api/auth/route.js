import { NextResponse } from 'next/server';
import { createFamily, findFamily } from '@/lib/store';

export async function POST(request) {
    try {
        const { action, familyName, password } = await request.json();

        if (action === 'register') {
            try {
                const family = createFamily(familyName, password);
                return NextResponse.json({ success: true, family });
            } catch (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 400 });
            }
        } else if (action === 'login') {
            const family = findFamily(familyName);
            if (family && family.password === password) {
                return NextResponse.json({ success: true, family });
            }
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
