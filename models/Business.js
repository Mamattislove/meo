import mongoose from "mongoose";
import { BARANGAYS } from "../utils/constants.js";

// What stays the same from year to year. What can change, like the occupancy division
// and lessor, is on each year's AnnualInspection.
const businessSchema = new mongoose.Schema({
    businessName: String,
    barangay: {
        type: String,
        enum: Object.values(BARANGAYS),
    },
    // GeoJSON Point: coordinates are [longitude, latitude]
    businessCoordinate: {
        type: {
            type: String,
            enum: ["Point"],
        },
        coordinates: {
            type: [Number],
            default: undefined,
            validate: {
                validator: (value) =>
                    value.length === 2 &&
                    value[0] >= -180 &&
                    value[0] <= 180 &&
                    value[1] >= -90 &&
                    value[1] <= 90,
                message:
                    "Coordinates must be [longitude, latitude] within valid ranges",
            },
        },
    },
    businessOwner: String,
    ownerAddress: String,
    ownerContact: String,
});

businessSchema.index({ businessCoordinate: "2dsphere" });

export default mongoose.model("Business", businessSchema);
