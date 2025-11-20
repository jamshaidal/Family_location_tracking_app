import { NextResponse } from 'next/server';
import { createTrackingLink } from '@/lib/store';
import { generateTrackingToken } from '@/lib/linkGenerator';

export async function POST(request) {
    try {
        const { familyId, memberName } = await request.json();

        if (!familyId || !memberName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const token = generateTrackingToken();
        const link = createTrackingLink(familyId, memberName, token);

        if (!link) {
            return NextResponse.json({ success: false, error: 'Family not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, link, token });
    } catch (error) {
        console.error('Generate link error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
