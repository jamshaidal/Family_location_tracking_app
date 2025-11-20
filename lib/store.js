import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ families: [] }, null, 2));
}

export function getData() {
    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return { families: [] };
    }
}

export function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function findFamily(familyName) {
    const data = getData();
    return data.families.find(f => f.name === familyName);
}

export function createFamily(familyName, password) {
    const data = getData();
    if (data.families.find(f => f.name === familyName)) {
        throw new Error('Family already exists');
    }
    const newFamily = {
        id: Date.now().toString(),
        name: familyName,
        password, // In a real app, hash this!
        members: []
    };
    data.families.push(newFamily);
    saveData(data);
    return newFamily;
}

export function updateMemberLocation(familyId, memberName, lat, lng, accuracy, isManual) {
    const data = getData();
    const familyIndex = data.families.findIndex(f => f.id === familyId);

    if (familyIndex === -1) return null;

    const family = data.families[familyIndex];
    const memberIndex = family.members.findIndex(m => m.name === memberName);

    const timestamp = Date.now();

    if (memberIndex === -1) {
        // Add new member
        family.members.push({
            name: memberName,
            lat,
            lng,
            accuracy,
            isManual: isManual || false,
            lastUpdated: timestamp
        });
    } else {
        // Update existing member
        family.members[memberIndex] = {
            ...family.members[memberIndex],
            lat,
            lng,
            accuracy,
            isManual: isManual || false,
            lastUpdated: timestamp
        };
    }

    data.families[familyIndex] = family;
    saveData(data);
    return family;
}

export function createTrackingLink(familyId, memberName, token) {
    const data = getData();
    const familyIndex = data.families.findIndex(f => f.id === familyId);

    if (familyIndex === -1) return null;

    const family = data.families[familyIndex];

    if (!family.trackingLinks) {
        family.trackingLinks = [];
    }

    const link = {
        token,
        memberName,
        createdAt: Date.now(),
        lastUsed: null,
        active: true
    };

    family.trackingLinks.push(link);
    data.families[familyIndex] = family;
    saveData(data);

    return link;
}

export function getTrackingLink(token) {
    const data = getData();

    for (const family of data.families) {
        if (family.trackingLinks) {
            const link = family.trackingLinks.find(l => l.token === token && l.active);
            if (link) {
                return { family, link };
            }
        }
    }

    return null;
}

export function updateLinkLastUsed(token) {
    const data = getData();

    for (let i = 0; i < data.families.length; i++) {
        const family = data.families[i];
        if (family.trackingLinks) {
            const linkIndex = family.trackingLinks.findIndex(l => l.token === token);
            if (linkIndex !== -1) {
                family.trackingLinks[linkIndex].lastUsed = Date.now();
                data.families[i] = family;
                saveData(data);
                return true;
            }
        }
    }

    return false;
}

export function disableTrackingLink(familyId, token) {
    const data = getData();
    const familyIndex = data.families.findIndex(f => f.id === familyId);

    if (familyIndex === -1) return false;

    const family = data.families[familyIndex];
    if (family.trackingLinks) {
        const linkIndex = family.trackingLinks.findIndex(l => l.token === token);
        if (linkIndex !== -1) {
            family.trackingLinks[linkIndex].active = false;
            data.families[familyIndex] = family;
            saveData(data);
            return true;
        }
    }

    return false;
}
