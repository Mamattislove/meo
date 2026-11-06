import {
    createBrowserRouter,
    redirect,
    RouterProvider,
} from "react-router-dom";
import HomeLayout from "./pages/HomeLayout";
import Login, { action as loginAction } from "./pages/Login";
import DashboardLayout, {
    loader as dashboardLayoutLoader,
} from "./pages/DashboardLayout";
import ErrorPage from "./pages/ErrorPage";
import NotFound from "./pages/NotFound";
import {
    aifLogbook,
    annualInspections,
    assessments,
    buildingPermits,
    businesses,
    electricalPermits,
    inspections,
} from "./constants/registers";

// Each dashboard page is lazy-loaded so it ships as its own chunk.
const page = (importer) => () =>
    importer().then((m) => ({
        Component: m.default,
        loader: m.loader,
        action: m.action,
    }));

// The shared register pages take their register as a prop.
const registerPage = (importer, register) => () =>
    importer().then((m) => ({
        element: <m.default register={register} />,
        loader: m.makeLoader?.(register),
        action: m.makeAction?.(register),
    }));

const list = (register) => ({
    index: true,
    lazy: registerPage(() => import("./pages/RegisterList"), register),
});

const standardRegister = (register) => ({
    path: register.path,
    children: [
        list(register),
        { path: "new", lazy: registerPage(() => import("./pages/RegisterForm"), register) },
        { path: ":id", lazy: registerPage(() => import("./pages/RegisterDetail"), register) },
        { path: ":id/edit", lazy: registerPage(() => import("./pages/RegisterForm"), register) },
    ],
});

const router = createBrowserRouter([
    {
        path: "/",
        element: <HomeLayout />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, loader: () => redirect("/login") },
            { path: "login", element: <Login />, action: loginAction },
            { path: "*", element: <NotFound /> },
        ],
    },
    {
        id: "dashboard",
        path: "/dashboard",
        element: <DashboardLayout />,
        loader: dashboardLayoutLoader,
        hydrateFallbackElement: <div />,
        errorElement: <ErrorPage />,
        children: [
            {
                // Inside the layout, so a failed page keeps the register tabs on screen
                errorElement: <ErrorPage />,
                children: [
                    { index: true, lazy: page(() => import("./pages/Dashboard")) },
                    standardRegister(businesses),
                    standardRegister(annualInspections),
                    { path: aifLogbook.path, children: [list(aifLogbook)] },
                    standardRegister(buildingPermits),
                    standardRegister(electricalPermits),
                    {
                        path: inspections.path,
                        children: [
                            list(inspections),
                            { path: "new", lazy: page(() => import("./pages/InspectionForm")) },
                            { path: ":id", lazy: page(() => import("./pages/InspectionDetail")) },
                            { path: ":id/inspect", lazy: page(() => import("./pages/InspectionForm")) },
                            { path: ":id/edit", lazy: page(() => import("./pages/InspectionForm")) },
                        ],
                    },
                    {
                        path: assessments.path,
                        children: [
                            list(assessments),
                            { path: "new", lazy: page(() => import("./pages/AssessmentForm")) },
                            { path: ":id", lazy: page(() => import("./pages/AssessmentDetail")) },
                            { path: ":id/edit", lazy: page(() => import("./pages/AssessmentForm")) },
                        ],
                    },
                    { path: "users", lazy: page(() => import("./pages/Users")) },
                    { path: "*", element: <NotFound /> },
                ],
            },
        ],
    },
]);

const App = () => <RouterProvider router={router} />;

export default App;
