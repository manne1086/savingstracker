import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, MousePointerClick } from "lucide-react";
import { useTimerStore } from "@/stores/timerStore";

// CONSTANTS (In milliseconds)
// 1 minute warning
const WARNING_THRESHOLD = 1 * 60 * 1000;
// 2 minutes freeze
const FREEZE_THRESHOLD = 2 * 60 * 1000;
// 2 minutes tab away freeze (User Request)
const TAB_AWAY_THRESHOLD = 2 * 60 * 1000;

export default function PassiveActivityMonitor() {
    const [showWarning, setShowWarning] = useState(false);
    const lastActivityRef = useRef(Date.now());
    const wasFrozenRef = useRef(false);
    const backgroundTimeoutRef = useRef(null);

    const {
        isRunning,
        time,
        startTimer,
        pauseTimer,
        setStartTime,
        setHasPosted,
        setLastSavedSeconds,
    } = useTimerStore();

    const isRunningRef = useRef(isRunning);
    const timeRef = useRef(time);

    // Sync refs with store state
    useEffect(() => {
        isRunningRef.current = isRunning;
        timeRef.current = time;
    }, [isRunning, time]);

    const getTotalSeconds = (t) => t.hours * 3600 + t.minutes * 60 + t.seconds;

    // Function to handle activity (mouse move, key press, etc.)
    const handleActivity = useCallback(() => {
        const now = Date.now();
        lastActivityRef.current = now;

        if (showWarning) {
            setShowWarning(false);
        }

        // If timer was frozen by us, resume it
        if (wasFrozenRef.current) {
            wasFrozenRef.current = false;

            // Calculate new start time to preserve elapsed duration
            // similar to handleStartPause in StudyTimer.jsx
            const elapsedMs = getTotalSeconds(timeRef.current) * 1000;
            const computedStart = new Date(now - elapsedMs).toISOString();

            setStartTime(computedStart);
            setHasPosted(false);
            setLastSavedSeconds(0);
            startTimer();
            console.log("Auto-resumed timer due to activity");
        }
    }, [showWarning, setStartTime, setHasPosted, setLastSavedSeconds, startTimer]);

    // Setup event listeners for activity and visibility
    useEffect(() => {
        // Throttled event handler to avoid excessive updates
        let throttleTimeout;
        const onUserActivity = () => {
            if (!throttleTimeout) {
                handleActivity();
                throttleTimeout = setTimeout(() => {
                    throttleTimeout = null;
                }, 1000); // Throttle activity updates
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log("Tab hidden - starting background timer");
                // Clear any existing timeout just in case
                if (backgroundTimeoutRef.current) clearTimeout(backgroundTimeoutRef.current);

                // Start specific background freeze timer
                backgroundTimeoutRef.current = setTimeout(() => {
                    if (isRunningRef.current) {
                        console.log("Freezing timer due to tab background > 2 mins");
                        pauseTimer();
                        wasFrozenRef.current = true;
                        setShowWarning(false);
                    }
                }, TAB_AWAY_THRESHOLD);

            } else {
                console.log("Tab visible - clearing background timer and resuming");
                // Clear the background timer if they come back in time
                if (backgroundTimeoutRef.current) {
                    clearTimeout(backgroundTimeoutRef.current);
                    backgroundTimeoutRef.current = null;
                }
                // When coming back, treat as activity to potentially resume
                handleActivity();
            }
        };

        window.addEventListener("mousemove", onUserActivity);
        window.addEventListener("mousedown", onUserActivity);
        window.addEventListener("keydown", onUserActivity);
        window.addEventListener("touchstart", onUserActivity);
        window.addEventListener("click", onUserActivity);
        window.addEventListener("scroll", onUserActivity);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("mousemove", onUserActivity);
            window.removeEventListener("mousedown", onUserActivity);
            window.removeEventListener("keydown", onUserActivity);
            window.removeEventListener("touchstart", onUserActivity);
            window.removeEventListener("click", onUserActivity);
            window.removeEventListener("scroll", onUserActivity);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (throttleTimeout) clearTimeout(throttleTimeout);
        };
    }, [handleActivity]);

    // Check for inactivity
    useEffect(() => {
        const interval = setInterval(() => {
            // Only monitor if timer is running or if we are in the warning state
            // (We don't want to show warnings if the user isn't even studying)
            if (!isRunningRef.current && !wasFrozenRef.current) return;

            const now = Date.now();
            const timeSinceLastActivity = now - lastActivityRef.current;

            if (timeSinceLastActivity >= FREEZE_THRESHOLD) {
                // Freeze the timer
                if (isRunningRef.current) {
                    pauseTimer();
                    wasFrozenRef.current = true;
                    setShowWarning(false); // Hide warning once frozen
                }
            } else if (timeSinceLastActivity >= WARNING_THRESHOLD) {
                // Show warning
                if (!showWarning && isRunningRef.current) {
                    setShowWarning(true);
                }
            } else {
                if (showWarning) setShowWarning(false);
            }
        }, 1000); // Check every second

        return () => clearInterval(interval);
    }, [pauseTimer, showWarning]);

    return createPortal(
        <AnimatePresence>
            {showWarning && (
                <motion.div
                    key="inactivity-warning"
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] 
                     bg-black/40 backdrop-blur-md border border-yellow-500/30 
                     text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4
                     max-w-md w-full"
                >
                    <div className="bg-yellow-500/20 p-3 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">Are you still there?</h3>
                        <p className="text-gray-300 text-sm">
                            We haven't detected any activity for a while. Move your mouse or press a key to keep the session active.
                        </p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-full animate-pulse">
                        <MousePointerClick className="w-5 h-5" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
