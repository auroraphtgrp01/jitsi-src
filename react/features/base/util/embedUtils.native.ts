import { getBundleId } from "react-native-device-info";

/**
 * BUndle ids for the Duy Tan University apps.
 */
const JITSI_MEET_APPS = [
    // iOS app.
    "com.atlassian.JitsiMeet.ios",

    // Android + iOS (testing) app.
    "org.jitsi.meet",

    // Android debug app.
    "org.jitsi.meet.debug",
];

/**
 * Checks whether we are loaded in iframe. In the mobile case we treat SDK
 * consumers as the web treats iframes.
 *
 * @returns {boolean} Whether the current app is a Duy Tan University app.
 */
export function isEmbedded(): boolean {
    return !JITSI_MEET_APPS.includes(getBundleId());
}
