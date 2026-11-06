import { useState } from "react";
import { LOAD_DEFAULTS } from "../../../../utils/feeSchedule.js";
import AmountList from "./AmountList";
import { ConnectedLoad } from "./FeeChecklist";
import InputField from "./InputField";

const LOAD_ITEM = { id: "load" };

// A breaker size is what's most often on hand, so a new inspection starts there
const startingLoad = ({ totalConnectedLoad, connectedLoadConversion }) => {
    if (connectedLoadConversion?.from) return { quantity: totalConnectedLoad ?? "", conversion: connectedLoadConversion };
    if (totalConnectedLoad) return { quantity: totalConnectedLoad };
    return { quantity: "", conversion: { from: "AT", value: "", ...LOAD_DEFAULTS.AT } };
};

const savedAmounts = (list, total) => (list?.length ? list : total ? [total] : []);

// What the inspector found for the electrical fees (Secs. 4.a to 4.c). Transformers,
// UPS and generators of different sizes are added together into one capacity.
const ElectricalFound = ({ inspection }) => {
    const [load, setLoad] = useState(() => startingLoad(inspection));

    return (
        <>
            <div className="cell electrical-load" style={{ "--span": 6 }}>
                <span className="cell-label">Connected load</span>
                <ConnectedLoad
                    item={LOAD_ITEM}
                    pick={load}
                    focusFirst={false}
                    onChange={(values) => setLoad((current) => ({ ...current, ...values }))}
                />
                <input type="hidden" name="totalConnectedLoad" value={load.quantity ?? ""} />
                <input
                    type="hidden"
                    name="connectedLoadConversion"
                    value={load.conversion && load.quantity !== "" ? JSON.stringify(load.conversion) : ""}
                />
            </div>
            <div className="cell" style={{ "--span": 3 }}>
                <span className="cell-label">Transformers / UPS (kVA)</span>
                <AmountList
                    name="transformerCapacities"
                    rowLabel="Transformer or UPS"
                    unit="kVA"
                    addLabel="Add another transformer / UPS"
                    initial={savedAmounts(inspection.transformers, inspection.totalTransformerCapacity)}
                    showTotal
                />
            </div>
            <div className="cell" style={{ "--span": 3 }}>
                <span className="cell-label">Generators (kVA)</span>
                <AmountList
                    name="generatorCapacities"
                    rowLabel="Generator"
                    unit="kVA"
                    addLabel="Add another generator"
                    initial={savedAmounts(inspection.generators, inspection.totalGeneratorCapacity)}
                    showTotal
                />
            </div>
            {inspection.inspectionType === "business" && (
                <>
                    <InputField
                        label="Power supply poles on the premises"
                        name="noOfPoles"
                        type="number"
                        min="0"
                        step="1"
                        span={3}
                        defaultValue={inspection.noOfPoles ?? ""}
                    />
                    <InputField
                        label="Guying attachments"
                        name="noOfGuyingAttachments"
                        type="number"
                        min="0"
                        step="1"
                        span={3}
                        defaultValue={inspection.noOfGuyingAttachments ?? ""}
                    />
                </>
            )}
        </>
    );
};

export default ElectricalFound;
