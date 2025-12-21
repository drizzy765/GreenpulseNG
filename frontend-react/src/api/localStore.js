// LocalStorage data handler for Guest Mode

const STORAGE_KEY = 'greenpulse_guest_data';

const getGuestData = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveGuestData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const localStore = {
    // Mimic API responses

    addEntry: (entry) => {
        const currentData = getGuestData();
        // Add ID and timestamp
        const newEntry = {
            ...entry,
            id: Date.now(),
            business_id: 'guest',
            emissions_kgCO2e: entry.amount * entry.emission_factor // Simple calc here as fallback
        };
        currentData.push(newEntry);
        saveGuestData(currentData);
        return Promise.resolve({ success: true, business_id: 'guest_local', emissions_kgCO2e: newEntry.emissions_kgCO2e });
    },

    getDashboard: () => {
        const data = getGuestData();
        const total = data.reduce((sum, item) => sum + (item.emissions_kgCO2e || 0), 0);

        // Group by category
        const groups = data.reduce((acc, item) => {
            const cat = item.source_category || 'Other';
            if (!acc[cat]) acc[cat] = 0;
            acc[cat] += (item.emissions_kgCO2e || 0);
            return acc;
        }, {});

        const by_category = Object.keys(groups).map(key => ({
            source_category: key,
            emissions_kgCO2e: groups[key]
        }));

        return Promise.resolve({
            success: true,
            total_emissions: total,
            by_category
        });
    },

    getEmissions: () => {
        const data = getGuestData();
        return Promise.resolve({
            success: true,
            rows: data.sort((a, b) => new Date(b.date) - new Date(a.date))
        });
    },

    // Stub for bulk add
    addBulk: (payload) => {
        const currentData = getGuestData();
        const newEntries = payload.entries.map(e => ({
            ...e,
            id: Date.now() + Math.random(),
            business_id: 'guest',
            emissions_kgCO2e: e.amount * e.emission_factor
        }));
        const updated = [...currentData, ...newEntries];
        saveGuestData(updated);
        return Promise.resolve({ success: true, count: newEntries.length });
    }
};
