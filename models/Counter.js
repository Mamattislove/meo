import mongoose from "mongoose";

// One document per series and year, e.g. { _id: "building-2026", seq: 12 }
const counterSchema = new mongoose.Schema({
    _id: String,
    seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

// Returns the next serial for a series, e.g. nextSerial("building", 2026) -> "2026-0013".
// The increment is atomic, so two records saved at the same time never get the same number.
export const nextSerial = async (series, year) => {
    const { seq } = await Counter.findOneAndUpdate(
        { _id: `${series}-${year}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
    );
    return `${year}-${String(seq).padStart(4, "0")}`;
};

export default Counter;
