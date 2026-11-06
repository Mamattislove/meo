// One box of a ruled form. `span` is its width out of six columns.
const InputField = ({ label, name, type = "text", span = 2, required, ...props }) => {
    return (
        <label className="cell" style={{ "--span": span }}>
            <span className="cell-label">
                {label}
                {required && <em> *</em>}
            </span>
            <input
                name={name}
                type={type}
                required={required}
                className="cell-input"
                {...props}
            />
        </label>
    );
};

export default InputField;
