import { PiTrash } from "react-icons/pi";
import { useState } from "react";
import { Form } from "react-router-dom";

// Two clicks to delete, with no pop-up in the way.
const ConfirmDelete = ({ label = "Delete", intent }) => {
    const [armed, setArmed] = useState(false);

    if (!armed) {
        return (
            <button type="button" className="btn btn-danger" onClick={() => setArmed(true)}>
                <PiTrash />
                {label}
            </button>
        );
    }
    return (
        <Form method="post" className="flex gap-2">
            <input type="hidden" name="intent" value={intent || "delete"} />
            <button type="submit" className="btn btn-danger">
                <PiTrash />
                Yes, delete it
            </button>
            <button type="button" className="btn" onClick={() => setArmed(false)}>
                Keep
            </button>
        </Form>
    );
};

export default ConfirmDelete;
