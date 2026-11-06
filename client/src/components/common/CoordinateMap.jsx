import { useEffect, useRef, useState } from "react";
import { PiArrowSquareOut, PiCornersIn, PiCornersOut } from "react-icons/pi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Where the map opens when a record has no location yet: Balagtas, Bulacan
const DEFAULT_CENTER = [14.8167, 120.9];
const DEFAULT_ZOOM = 14;
const POINT_ZOOM = 17;

// The teardrop is an inner element: rotating the marker itself would also rotate
// the position Leaflet gives it. The anchor is the tip of the rotated shape.
const markerIcon = L.divIcon({
    className: "map-pin",
    html: "<span></span>",
    iconSize: [20, 20],
    iconAnchor: [10, 24],
});

const validPoint = (latitude, longitude) =>
    latitude !== "" &&
    longitude !== "" &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
        ? [Number(latitude), Number(longitude)]
        : null;

const rounded = (value) => Number(value.toFixed(6));

// Without onPick it only shows the location. With onPick, clicking the map or
// dragging the marker reports the new point.
const CoordinateMap = ({ latitude, longitude, onPick }) => {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const onPickRef = useRef(onPick);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const canPick = Boolean(onPick);
    const point = validPoint(latitude, longitude);
    const lat = point?.[0];
    const lng = point?.[1];

    useEffect(() => {
        onPickRef.current = onPick;
    });

    useEffect(() => {
        const map = L.map(containerRef.current, {
            // A form scrolls past the map; zooming is by the + and - buttons
            scrollWheelZoom: false,
        }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        if (canPick) {
            map.on("click", ({ latlng }) => {
                onPickRef.current(rounded(latlng.lat), rounded(latlng.lng));
            });
        }
        mapRef.current = map;

        const resize = new ResizeObserver(() => map.invalidateSize());
        resize.observe(containerRef.current);
        return () => {
            resize.disconnect();
            // An animation left running would act on the removed map
            map.stop();
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, [canPick]);

    useEffect(() => {
        const map = mapRef.current;
        if (lat === undefined) {
            markerRef.current?.remove();
            markerRef.current = null;
            return;
        }
        if (!markerRef.current) {
            const marker = L.marker([lat, lng], {
                icon: markerIcon,
                draggable: canPick,
                keyboard: canPick,
            }).addTo(map);
            marker.on("dragend", () => {
                const dropped = marker.getLatLng();
                onPickRef.current(rounded(dropped.lat), rounded(dropped.lng));
            });
            markerRef.current = marker;
            map.setView([lat, lng], POINT_ZOOM, { animate: false });
            return;
        }
        markerRef.current.setLatLng([lat, lng]);
        // Only move the map if the marker has gone out of view
        if (!map.getBounds().contains([lat, lng])) map.setView([lat, lng], POINT_ZOOM);
    }, [lat, lng, canPick]);

    // Fills the window with plain CSS, because iPhones have no fullscreen mode for maps.
    useEffect(() => {
        const map = mapRef.current;
        map.invalidateSize();
        if (markerRef.current) map.panTo(markerRef.current.getLatLng(), { animate: false });
        if (!isFullScreen) return undefined;

        // There's no page to scroll past here, so the wheel can zoom
        map.scrollWheelZoom.enable();
        const pageOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKeyDown = (event) => {
            if (event.key === "Escape") setIsFullScreen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => {
            map.scrollWheelZoom.disable();
            document.body.style.overflow = pageOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [isFullScreen]);

    const Icon = isFullScreen ? PiCornersIn : PiCornersOut;

    return (
        <div className={`coordinate-map-wrap ${isFullScreen ? "is-full-screen" : ""}`}>
            <div ref={containerRef} className="coordinate-map" />
            <div className="map-actions no-print">
                {point && (
                    <a
                        className="btn map-action no-underline"
                        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                        target="_blank"
                        rel="noreferrer"
                        data-google-maps
                    >
                        <PiArrowSquareOut className="size-[18px]" />
                        Google Maps
                    </a>
                )}
                <button
                    type="button"
                    className="btn map-action map-full-screen"
                    aria-pressed={isFullScreen}
                    onClick={() => setIsFullScreen((current) => !current)}
                >
                    <Icon className="size-[18px]" />
                    {isFullScreen ? "Exit full screen" : "Full screen"}
                </button>
            </div>
            {isFullScreen && point && (
                <span className="map-coordinates" data-map-coordinates>
                    {lat}, {lng}
                </span>
            )}
        </div>
    );
};

export default CoordinateMap;
