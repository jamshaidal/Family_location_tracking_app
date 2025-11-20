import { NextResponse } from 'next/server';
import { getTrackingLink, updateMemberLocation, updateLinkLastUsed } from '@/lib/store';

export async function GET(request, { params }) {
    const resolvedParams = await params;
    const { token } = resolvedParams;

    const result = getTrackingLink(token);

    if (!result) {
        return NextResponse.json({ success: false, error: 'Invalid or expired link' }, { status: 404 });
    }

    const { family, link } = result;

    return NextResponse.json({
        success: true,
        familyName: family.name,
        memberName: link.memberName,
        familyId: family.id
    });
}

export async function POST(request, { params }) {
    try {
        const resolvedParams = await params;
        const { token } = resolvedParams;
        const { lat, lng, accuracy } = await request.json();

        if (lat === undefined || lng === undefined) {
            return NextResponse.json({ success: false, error: 'Missing location data' }, { status: 400 });
        }

        const result = getTrackingLink(token);

        if (!result) {
            return NextResponse.json({ success: false, error: 'Invalid or expired link' }, { status: 404 });
        }

        const { family, link } = result;

        // Update the member's location
        const updatedFamily = updateMemberLocation(
            family.id,
            link.memberName,
            lat,
            lng,
            accuracy,
            false // Not manual, but from tracking link
        );

        // Update link last used timestamp
        updateLinkLastUsed(token);

        if (!updatedFamily) {
            return NextResponse.json({ success: false, error: 'Failed to update location' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Track API error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
