"""Convert saved Pass rows into a clip-wide, frame-indexed overlay."""

import math

PALETTE = (
    (0.0, (34, 197, 94)),
    (0.35, (234, 179, 8)),
    (0.60, (249, 115, 22)),
    (1.0, (220, 38, 38)),
)
CANDIDATE_THRESHOLD = 0.60


def signal_color(value):
    for (start, low), (end, high) in zip(PALETTE, PALETTE[1:]):
        if value <= end:
            fraction = (value - start) / (end - start)
            channels = (round(a + (b - a) * fraction) for a, b in zip(low, high))
            return "#" + "".join(f"{channel:02X}" for channel in channels)


def simulated_signal(knots, frame):
    if not knots:
        return 0.0, None
    value = knots[0]["confidence"]
    for start, end in zip(knots, knots[1:]):
        value = end["confidence"]
        if frame < end["frame"]:
            fraction = (frame - start["frame"]) / (end["frame"] - start["frame"])
            weight = fraction ** 2 * (3 - 2 * fraction)
            value = start["confidence"] + weight * (value - start["confidence"])
            break
    percent = round(value * 100)
    if value < CANDIDATE_THRESHOLD:
        percent = min(59, percent)
    return value, {"percent": percent, "label": knots[0]["label"]}


def clip_overlay(passes, clip_id):
    frames = {}
    clip = None
    for record in passes:
        if record["clip"]["id"] != clip_id:
            continue
        clip = record["clip"]
        knots = [item for item in record["annotations"] if item["type"] == "phone_confidence"]
        for frame, box, quad in record["geometry"]:
            value, signal = simulated_signal(knots, frame)
            color = signal_color(value)
            frames.setdefault(frame, []).append({
                "passId": record["passId"],
                "box": box,
                "quad": quad,
                "boxColor": color if value >= CANDIDATE_THRESHOLD else "#3B82F6",
                "quadColor": color,
                "signal": signal,
            })
    return {"clip": clip, "frames": frames}


def overlay_at_time(overlay, time_s):
    frame = math.floor(time_s * overlay["clip"]["fps"] + 1e-7)
    return overlay["frames"].get(frame, [])
