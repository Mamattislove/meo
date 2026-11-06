import { BARANGAYS, OFFICE_TOWN } from "../../utils/constants.js";

const same = (a, b) => a?.trim().toLowerCase() === b?.trim().toLowerCase();

// Asks OpenStreetMap's public address lookup which barangay a point is in. Its data is
// patchy for barangays, so the answer is only ever a suggestion for the clerk to check.
// Returns null if the lookup fails, { town } if the point is outside the office's town,
// and otherwise { barangay }, which is undefined when the barangay can't be told.
export const findBarangay = async (latitude, longitude, signal) => {
    try {
        const params = new URLSearchParams({
            format: "jsonv2",
            lat: latitude,
            lon: longitude,
            zoom: 18,
            addressdetails: 1,
            "accept-language": "en",
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal });
        if (!response.ok) return null;
        const { address } = await response.json();
        if (!address) return null;

        const town = address.town || address.city || address.municipality;
        if (!same(town, OFFICE_TOWN)) return { town };

        const places = [address.village, address.suburb, address.quarter, address.neighbourhood, address.hamlet];
        const barangay = Object.values(BARANGAYS).find((name) => places.some((place) => same(place, name)));
        return { barangay };
    } catch {
        return null;
    }
};
