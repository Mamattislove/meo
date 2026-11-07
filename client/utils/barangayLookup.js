// A point is inside when a line drawn from it crosses the boundary an odd number of times
const isInside = (rings, longitude, latitude) => {
    let inside = false;
    for (const ring of rings) {
        for (let a = 0, b = ring.length - 1; a < ring.length; b = a, a += 1) {
            const [ax, ay] = ring[a];
            const [bx, by] = ring[b];
            if (ay > latitude !== by > latitude && longitude < ((bx - ax) * (latitude - ay)) / (by - ay) + ax) {
                inside = !inside;
            }
        }
    }
    return inside;
};

// The barangay a point is in, from the LGU's own boundaries (made by
// scripts/convertBarangayBoundaries.mjs), or null if it's outside them all. They load only
// when a form needs them, and no internet is needed for the answer.
export const findBarangay = async (latitude, longitude) => {
    const { default: boundaries } = await import("../src/constants/barangayBoundaries.json");
    const found = boundaries.find(({ rings }) => isInside(rings, Number(longitude), Number(latitude)));
    return found?.barangay ?? null;
};
