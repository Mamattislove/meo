import { SECTION_ICONS } from "../../constants/sectionIcons";

const FormBox = ({ title, children, plain = false }) => {
    const Icon = SECTION_ICONS[title];
    return (
        <section className="form-box">
            <h2 className="form-box-heading">
                {Icon && <Icon />}
                {title}
            </h2>
            {plain ? children : <div className="cells">{children}</div>}
        </section>
    );
};

export default FormBox;
