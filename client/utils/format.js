const dateFormat = new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
});
const pesoFormat = new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : "");

export const formatPeso = (value) => `₱${pesoFormat.format(value || 0)}`;

// Value for <input type="date">, in local time
export const dateInputValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
};

// Dropdown values are stored lowercase ("new construction"). Only for those:
// names, usernames and emails must display exactly as they were entered.
export const sentence = (value) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

// "14:30" -> "2:30 PM"
export const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
};

export const longDate = (date = new Date()) =>
    new Intl.DateTimeFormat("en-PH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);

// An AIF entry's name lives on its business
export const recordName = (record) =>
    record?.business?.businessName ||
    record?.businessName ||
    record?.projectTitle ||
    record?.ownerName ||
    "Unnamed";

// An AIF inspection may have no record yet
export const inspectionName = (inspection) =>
    inspection.record ? recordName(inspection.record) : inspection.businessName || "Not yet linked";

export const pickerLabel = (record) =>
    [record.serialNumber, recordName(record)].filter(Boolean).join("  ");

export const errorMessage = (error) =>
    error?.response?.data?.msg || error?.message || "Something went wrong";

// Empty file inputs still appear in FormData; sending them would save empty files.
export const withoutEmptyFiles = (formData) => {
    for (const key of new Set(formData.keys())) {
        const values = formData.getAll(key);
        if (!values.some((value) => value instanceof File && value.size === 0)) continue;
        formData.delete(key);
        for (const value of values) {
            if (!(value instanceof File) || value.size > 0) formData.append(key, value);
        }
    }
    return formData;
};

// Multipart only when a file is attached: routes without uploads can't read it.
export const toPayload = (formData) => {
    const cleaned = withoutEmptyFiles(formData);
    const hasFile = [...cleaned.values()].some((value) => value instanceof File);
    return hasFile ? cleaned : Object.fromEntries(cleaned);
};
