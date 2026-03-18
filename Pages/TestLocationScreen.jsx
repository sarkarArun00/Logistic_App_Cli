import React, { useState } from "react";
import {
    View,
    Text,
    Button,
    Alert,
    PermissionsAndroid,
    Platform,
    Linking,
} from "react-native";
import Geolocation from "react-native-geolocation-service";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const requestLocationPermission = async () => {
    if (Platform.OS !== "android") return true;

    try {
        const alreadyGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        console.log("alreadyGranted:", alreadyGranted);

        if (alreadyGranted) return true;

        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: "Location Permission",
                message: "This app needs access to your location.",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK",
            }
        );

        console.log("Permission result:", granted);

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

const getReadableError = error => {
    switch (error?.code) {
        case 1:
            return "Permission denied";
        case 2:
            return "Location unavailable or GPS is off";
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

const getCurrentPositionAsync = options =>
    new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(resolve, reject, options);
    });

const TestLocationScreen = () => {
    const [status, setStatus] = useState("Waiting...");

    const getLocation = async () => {
        try {
            setStatus("Checking permission...");

            const hasPermission = await requestLocationPermission();

            if (!hasPermission) {
                setStatus("Location permission not granted");
                console.log("Location permission not granted");
                return;
            }

            // Small delay after permission popup closes
            await sleep(1000);

            setStatus("Trying high accuracy location...");

            try {
                const position = await getCurrentPositionAsync({
                    enableHighAccuracy: true,
                    timeout: 25000,
                    maximumAge: 0,
                    forceRequestLocation: true,
                    showLocationDialog: true,
                });

                console.log("LOCATION SUCCESS (HIGH):", position);
                setStatus(
                    `Success: ${position.coords.latitude}, ${position.coords.longitude}`
                );
                Alert.alert(
                    "Location Found",
                    `Lat: ${position.coords.latitude}\nLng: ${position.coords.longitude}`
                );
                return;
            } catch (highError) {
                console.log("HIGH ACCURACY ERROR:", highError);
                console.log("Readable:", getReadableError(highError));

                setStatus("High accuracy failed, trying fallback...");

                // fallback
                const fallbackPosition = await getCurrentPositionAsync({
                    enableHighAccuracy: false,
                    timeout: 30000,
                    maximumAge: 15000,
                    forceRequestLocation: true,
                    showLocationDialog: true,
                    forceLocationManager: true,
                });

                console.log("LOCATION SUCCESS (FALLBACK):", fallbackPosition);
                setStatus(
                    `Success: ${fallbackPosition.coords.latitude}, ${fallbackPosition.coords.longitude}`
                );
                Alert.alert(
                    "Location Found",
                    `Lat: ${fallbackPosition.coords.latitude}\nLng: ${fallbackPosition.coords.longitude}`
                );
            }
        } catch (error) {
            console.log("FINAL LOCATION ERROR:", error);
            const readable = getReadableError(error);
            setStatus(`Error: ${readable}`);
            Alert.alert(
                "Location Error",
                `${readable}\n\nPlease make sure device location is ON.`
            );
        }
    };

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
            }}
        >
            <Text style={{ fontSize: 18, marginBottom: 20 }}>Test Location</Text>
            <Text style={{ marginBottom: 20, textAlign: "center" }}>{status}</Text>
            <Button title="Get Current Location" onPress={getLocation} />
        </View>
    );
};

export default TestLocationScreen;