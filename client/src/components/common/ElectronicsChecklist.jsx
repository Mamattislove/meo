import { useState } from "react";
import { ELECTRONICS } from "../../../../utils/feeSchedule.js";

// The electronics items of the annual inspection fee (Sec. 11.g, the same as Sec. 7).
// The inspector ticks what's on site and enters how many.
const ElectronicsChecklist = ({ electronics = [] }) => {
    const [ticked, setTicked] = useState(() => electronics.map(({ itemId }) => itemId));
    const savedCount = (id) => electronics.find(({ itemId }) => itemId === id)?.quantity ?? "";

    return (
        <div>
            <p className="cell-hint !mt-0 mb-3">
                Tick what's on site and enter how many. CCTV is under Sec. 7.e.
            </p>
            <ul className="fee-section">
                {ELECTRONICS.map((item) => {
                    const isTicked = ticked.includes(item.id);
                    return (
                        <li key={item.id} className={`fee-row electronics-row ${isTicked ? "is-picked" : ""}`}>
                            <label className="fee-row-label">
                                <input
                                    type="checkbox"
                                    className="fee-check"
                                    data-electronics={item.id}
                                    checked={isTicked}
                                    onChange={() =>
                                        setTicked((current) =>
                                            isTicked ? current.filter((id) => id !== item.id) : [...current, item.id],
                                        )
                                    }
                                />
                                <span>
                                    {item.label}
                                    <span className="fee-row-ref">{item.ref}</span>
                                </span>
                            </label>
                            {isTicked && (
                                <div className="fee-row-inputs">
                                    <input type="hidden" name="electronicsItems" value={item.id} />
                                    <label className="fee-row-quantity">
                                        <input
                                            type="number"
                                            name="electronicsQuantities"
                                            min="1"
                                            step="1"
                                            className="cell-input"
                                            aria-label={`${item.label}: ${item.unit}`}
                                            defaultValue={savedCount(item.id)}
                                        />
                                        <span>{item.unit}</span>
                                    </label>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
            {/* Tells the server the list is now empty; no rows means no other signal */}
            {ticked.length === 0 && <input type="hidden" name="electronics" value="" />}
        </div>
    );
};

export default ElectronicsChecklist;
