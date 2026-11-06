const Card = ({ title, children }) => {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            {title && (
                <h2 className="mb-4 text-base font-semibold text-slate-800">
                    {title}
                </h2>
            )}
            {children}
        </section>
    );
};

export default Card;
