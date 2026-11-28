"""Build seek targets from the fixture's simulated behaviour intervals."""


def behaviour_stretches(record):
    return [
        {
            "name": stretch["type"].replace("_", " ").capitalize(),
            "seekFrame": stretch["start"]["frame"],
            "endFrame": stretch["end"]["frame"],
            "startTime": stretch["start"]["time_s"],
            "endTime": stretch["end"]["time_s"],
            "duration": stretch["duration_s"],
            "label": stretch["label"],
        }
        for stretch in record["behaviours"]
    ]
