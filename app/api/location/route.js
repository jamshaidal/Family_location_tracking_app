import { NextResponse } from 'next/server';
import { updateMemberLocation, findFamily } from '@/lib/store';

export async function POST(request) {
    try {
        const { familyId, memberName, lat, lng, accuracy, isManual } = await request.json();

        if (!familyId || !memberName || lat === undefined || lng === undefined) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const updatedFamily = updateMemberLocation(familyId, memberName, lat, lng, accuracy, isManual);

        if (!updatedFamily) {
            return NextResponse.json({ success: false, error: 'Family not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, family: updatedFamily });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const familyName = searchParams.get('familyName');

    if (!familyName) {
        return NextResponse.json({ success: false, error: 'Family name required' }, { status: 400 });
    }

    const family = findFamily(familyName);

    if (!family) {
        return NextResponse.json({ success: false, error: 'Family not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, family });
}
