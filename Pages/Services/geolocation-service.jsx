import { useEffect, useRef } from "react";
import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";
import Geolocation from "react-native-geolocation-service";

const TRACKER_API_URL =
    "https://lims-testing-api.nirnayanhealthcare.com/operation/tracker/updateEmpLocation";

const TRACKING_INTERVAL_MS = 100000;

export const requestLocationPermission = async () => {
    if (Platform.OS !== "android") return true;

    try {
        const alreadyGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (alreadyGranted) return true;

        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: "Location Permission",
                message: "This app needs access to your location to track movement.",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK",
            }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
        }

        if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Alert.alert(
                "Permission Required",
                "Location permission is permanently denied. Please enable it from app settings.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open Settings", onPress: () => Linking.openSettings() },
                ]
            );
        }

        return false;
    } catch (error) {
        console.log("Permission error:", error);
        return false;
    }
};

export const getCurrentPositionAsync = (options = {}) =>
    new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 10000,
            forceRequestLocation: true,
            showLocationDialog: true,
            ...options,
        });
    });

export const getLocationErrorMessage = error => {
    switch (error?.code) {
        case 1:
            return "Permission denied";
        case 2:
            return "Location unavailable / GPS off";
        case 3:
            return "Location request timed out";
        case 4:
            return "Google Play Services not available";
        case 5:
            return "Location settings are not satisfied";
        default:
            return error?.message || "Unknown location error";
    }
};

export const getCurrentDeviceLocation = async () => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
        throw { code: 1, message: "Permission denied" };
    }

    const position = await getCurrentPositionAsync();

    const { latitude, longitude } = position.coords || {};

    if (latitude == null || longitude == null) {
        throw new Error("Invalid coordinates received");
    }

    return {
        latitude,
        longitude,
    };
};

export const useLocationTracker = (empId, taskId, token) => {
    const intervalRef = useRef(null);
    const loadingRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        if (!empId || !token) {
            console.log("Location tracker skipped: empId or token missing");
            return () => {
                mountedRef.current = false;
            };
        }

        const sendLocationUpdate = async () => {
            if (!mountedRef.current) return;
            if (loadingRef.current) return;

            loadingRef.current = true;

            try {
                const hasPermission = await requestLocationPermission();

                if (!hasPermission) {
                    console.warn("Location permission not granted");
                    return;
                }

                const position = await getCurrentPositionAsync({
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 10000,
                    forceRequestLocation: true,
                    showLocationDialog: true,
                });

                if (!mountedRef.current) return;

                const { latitude, longitude } = position.coords || {};

                if (latitude == null || longitude == null) {
                    console.warn("Invalid coordinates received", position);
                    return;
                }

                const payload = {
                    empId: Number(empId),
                    latitude: String(latitude),
                    longitude: String(longitude),
                    ...(taskId ? { taskId } : {}),
                };

                const response = await fetch(TRACKER_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    console.warn("Failed to sync location:", {
                        status: response.status,
                        response: data,
                    });
                    return;
                }

                console.log("Location synced successfully:", payload);
            } catch (error) {
                console.warn("Location tracking failed:", getLocationErrorMessage(error));
                console.log("Full tracking error:", error);
            } finally {
                loadingRef.current = false;
            }
        };

        sendLocationUpdate();
        intervalRef.current = setInterval(sendLocationUpdate, TRACKING_INTERVAL_MS);

        return () => {
            mountedRef.current = false;

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [empId, taskId, token]);
};