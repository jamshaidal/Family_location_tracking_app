import { NextResponse } from 'next/server';
import { disableTrackingLink } from '@/lib/store';

export async function POST(request) {
    try {
        const { familyId, token } = await request.json();

        if (!familyId || !token) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const result = disableTrackingLink(familyId, token);

        if (!result) {
            return NextResponse.json({ success: false, error: 'Link not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Disable link error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
