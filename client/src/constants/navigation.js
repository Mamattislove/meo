import { PiBookOpenText, PiBuildings, PiClipboardText, PiFileText, PiLightning, PiReceipt, PiSquaresFour, PiStorefront, PiUsers } from "react-icons/pi";
// Register tabs. Add one entry per dashboard page.
export const NAV_LINKS = [
    { label: "Desk", path: "/dashboard", end: true, icon: PiSquaresFour },
    { label: "Businesses", path: "/dashboard/businesses", icon: PiStorefront },
    { label: "AIF applications", path: "/dashboard/aif-applications", icon: PiFileText },
    { label: "AIF logbook", path: "/dashboard/annual-inspections", icon: PiBookOpenText },
    { label: "Building permits", path: "/dashboard/building-permits", icon: PiBuildings },
    { label: "Electrical / CFEI", path: "/dashboard/electrical-permits", icon: PiLightning },
    { label: "Inspections", path: "/dashboard/inspections", icon: PiClipboardText },
    { label: "Assessments", path: "/dashboard/assessments", icon: PiReceipt },
    { label: "Users", path: "/dashboard/users", icon: PiUsers },
];
