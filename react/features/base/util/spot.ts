import { IReduxState } from "../../app/types";

/**
 * Checks if Duy Tan University is running on Spot TV.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} Whether or not Duy Tan University is running on Spot TV.
 */
export function isSpotTV(state: IReduxState): boolean {
    const { defaultLocalDisplayName, iAmSpot } = state["features/base/config"] || {};

    return (
        iAmSpot ||
        navigator.userAgent.includes("JitsiSpot/") || // Jitsi Spot app
        navigator.userAgent.includes("8x8MeetingRooms/") || // 8x8 Meeting Rooms app
        defaultLocalDisplayName === "Meeting Room"
    );
}
