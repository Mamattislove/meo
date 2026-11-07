// Turns an LGU's barangay boundary shapefile into the file the app looks points up in.
//
//   node scripts/convertBarangayBoundaries.mjs <path to the .shp, without .shp> [proj4 string]
//
// The default projection is PRS92 Philippines Zone III (EPSG:3123). For another zone, pass
// the proj4 string from the shapefile's QGIS .qmd file, or the converted boundaries will be
// in the wrong place. Each barangay name must start with one in BARANGAYS (utils/constants.js).
import fs from "fs";
import proj4 from "proj4";
import { BARANGAYS } from "../utils/constants.js";

const OUTPUT = "client/src/constants/barangayBoundaries.json";
const PRS92_ZONE_3 =
    "+proj=tmerc +lat_0=0 +lon_0=121 +k=0.99995 +x_0=500000 +y_0=0 +ellps=clrk66 +towgs84=-127.62,-67.24,-47.04,-3.068,4.903,1.578,-1.06 +units=m +no_defs";

const [base, projection = PRS92_ZONE_3] = process.argv.slice(2);
if (!base) {
    console.error("Give the path to the shapefile, without .shp");
    process.exit(1);
}

const readAttributes = (dbf) => {
    const count = dbf.readUInt32LE(4);
    const headerLength = dbf.readUInt16LE(8);
    const recordLength = dbf.readUInt16LE(10);
    const fields = [];
    for (let at = 32; dbf[at] !== 0x0d; at += 32) {
        fields.push({ name: dbf.toString("latin1", at, at + 11).replace(/\0.*$/, ""), length: dbf[at + 16] });
    }
    return Array.from({ length: count }, (_, index) => {
        let at = headerLength + index * recordLength + 1;
        const row = {};
        for (const { name, length } of fields) {
            row[name] = dbf.toString("latin1", at, at + length).trim();
            at += length;
        }
        return row;
    });
};

const readRings = (shp) => {
    const shapes = [];
    for (let at = 100; at < shp.length; at += 8 + shp.readInt32BE(at + 4) * 2) {
        const start = at + 8;
        const partCount = shp.readInt32LE(start + 36);
        const pointCount = shp.readInt32LE(start + 40);
        const points = start + 44 + 4 * partCount;
        const rings = [];
        for (let part = 0; part < partCount; part += 1) {
            const first = shp.readInt32LE(start + 44 + 4 * part);
            const end = part + 1 < partCount ? shp.readInt32LE(start + 44 + 4 * (part + 1)) : pointCount;
            const ring = [];
            for (let point = first; point < end; point += 1) {
                ring.push([shp.readDoubleLE(points + 16 * point), shp.readDoubleLE(points + 16 * point + 8)]);
            }
            rings.push(ring);
        }
        shapes.push(rings);
    }
    return shapes;
};

const attributes = readAttributes(fs.readFileSync(`${base}.dbf`));
const shapes = readRings(fs.readFileSync(`${base}.shp`));
const known = Object.values(BARANGAYS);
const round = (value) => Number(value.toFixed(6));
const seen = new Set();
const boundaries = [];

shapes.forEach((rings, index) => {
    const { brgy_name: name, brgy_psgc: psgc } = attributes[index];
    const barangay = known.find((option) => name.toLowerCase().startsWith(option.toLowerCase()));
    if (!barangay) throw new Error(`"${name}" isn't in BARANGAYS`);
    const converted = rings.map((ring) =>
        ring.map((point) => {
            const [longitude, latitude] = proj4(projection, "WGS84", point);
            return [round(longitude), round(latitude)];
        }),
    );
    // Some shapefiles repeat a barangay's shape
    const key = JSON.stringify(converted);
    if (seen.has(key)) return;
    seen.add(key);
    boundaries.push({ barangay, psgc, rings: converted });
});

const missing = known.filter((option) => !boundaries.some(({ barangay }) => barangay === option));
if (missing.length) throw new Error(`No boundary for: ${missing.join(", ")}`);

fs.writeFileSync(OUTPUT, `${JSON.stringify(boundaries)}\n`);
console.log(`${boundaries.length} boundaries for ${known.length} barangays written to ${OUTPUT}`);
