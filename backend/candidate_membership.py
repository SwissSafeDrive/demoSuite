"""Project the saved bridge decision into a Candidate list row."""

from overlay import CANDIDATE_THRESHOLD, signal_color, simulated_signal


def candidate_row(record):
    snapshots = record["best_snapshots"]
    flag_time = record["flag_time"]
    bridge_moments = [flag_time] if flag_time else snapshots
    knots = [item for item in record["annotations"] if item["type"] == "phone_confidence"]

    confidence = None
    signal = None
    seek = flag_time or (snapshots[0] if snapshots else record["end"])
    if knots and bridge_moments and record["classification"] != "Not assessable":
        scored_moments = (
            (simulated_signal(knots, max(moment["frame"], knots[0]["frame"])), moment)
            for moment in bridge_moments
        )
        (confidence, signal), seek = max(scored_moments, key=lambda item: item[0][0])

    meets_threshold = confidence is not None and confidence >= CANDIDATE_THRESHOLD
    if not meets_threshold and not record["flagged_manually"]:
        return None

    return {
        "passId": record["passId"],
        "clipId": record["clip"]["id"],
        "seekTime": seek["time_s"],
        "flagged_manually": record["flagged_manually"],
        "signal": {**signal, "color": signal_color(confidence)} if signal else None,
    }
