import { useState } from "react";
import { PiMoon, PiSun } from "react-icons/pi";

// index.html sets the starting theme before the first paint, so read it from there.
const ThemeToggle = () => {
    const [theme, setTheme] = useState(() => document.documentElement.dataset.theme);
    const next = theme === "dark" ? "light" : "dark";
    const Icon = theme === "dark" ? PiSun : PiMoon;

    const toggle = () => {
        document.documentElement.dataset.theme = next;
        setTheme(next);
        try {
            localStorage.setItem("theme", next);
        } catch {
            // Storage can be blocked; the theme still applies until the page reloads.
        }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${next} mode`}
            title={`Switch to ${next} mode`}
            className="btn !min-h-8 !px-2"
        >
            <Icon className="size-[18px]" />
        </button>
    );
};

export default ThemeToggle;
