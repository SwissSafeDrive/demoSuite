# Demo Pass fixture

`passes.json` contains 131 Passes from `Cba002`, `Cba052`, and `Cba065`.
The local API exposes `GET /api/passes/{passId}` and `GET /api/passes`, with
optional `clip` and `track_id` filters on the list. Track IDs are scoped to a clip.

- Frames are zero-based and inclusive. Times are seconds from the start of the source clip at 25 fps.
- Each geometry row is `[frame, box_px, windshield_quad_px]` in source pixels. Boxes are `[x1, y1, x2, y2]` and quads list the four corners clockwise from top left. Gap frames use linearly interpolated boxes and the v5 windshield rule. A null quad indicates a motorcycle or that the windshield has left the image.
- Snapshots give a frame and crop geometry. The export uses the tracker’s best-frame metadata, with the locked v5 still at frame 927 for `Cba052-028` and the last clear view near the v5 confidence peak at frame 1051 for `Cba065-045`. The tracker selected frames 941 and 1054 for those two Passes, after the v5 windshield had left the image.
- Flag time is the bridge Snapshot time for each Candidate. Unflagged Passes have a null flag time. Passes with limited glass detail or no windshield are Not assessable and have an empty Snapshot list.
- Clip references are filenames. Run `python scripts/locate_footage.py Cba002` to resolve one. Set `SSD_FOOTAGE_DIR` for a custom local directory.

## Simulated signals

| Pass | Phone confidence knots (frame, confidence) | Phone-in-hand frames |
| --- | --- | --- |
| Cba002-068 | (942, .20), (1090, .32), (1190, .60), (1203, .78), (1212, .74) | 1190–1207 |
| Cba052-028 | (499, .12), (775, .22), (906, .60), (927, .82), (943, .77) | 906–934 |
| Cba065-045 | (743, .16), (957, .28), (1032, .60), (1051, .81), (1054, .78) | 1032–1052 |

Between knots `(a, u)` and `(b, v)`, use `t = (frame - a) / (b - a)` and
`confidence = u + (v - u) * t² * (3 - 2t)`. The Candidate threshold is 0.60.
Round the displayed percentage to the nearest integer and cap it at 59 when
confidence is below 0.60. Keep the `SIMULATED SIGNAL` label on interpolated
values and on the hand-set behaviour stretches.

Regenerate the export with `python scripts/build_pass_fixture.py`. This reads
the saved track CSVs, Pass metadata, windshield rule and v5 renderer from
`/workspace/demo-map` (override with `--demo-map`). Regeneration requires NumPy,
OpenCV and Pillow. The local API reads the exported JSON with its normal dependencies.

## Local windshield crop strips

Run `/workspace/wt/venv/bin/python scripts/precompute_windshield_crops.py` from
the repo root. The slim environment needs NumPy, OpenCV headless and Pillow.
The script uses the locked warp in `/workspace/demo-map/overlay_v2/` and blurs
tracked plates on the source frames. It writes JPEGs and `index.json` to
`/workspace/demo-map/windshield-crops/` by default. Set `SSD_CROP_DIR` for both
the generator and backend to use a different local directory.

`GET /api/passes/{passId}/crops` returns the crop status and ordered entries
with source frame, video time in seconds and an image URL. Match entries to
the source frame at the current playback time. Missing frames have no usable
crop. `Not assessable` Passes have an empty frame list. Each image is served
at `GET /api/passes/{passId}/crops/{frame}`. Both routes use the existing
`X-SSD-Session` header. Rebuilding publishes a new complete index and keeps
the previous image generation available to requests already in flight.
