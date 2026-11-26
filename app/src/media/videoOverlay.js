function blurPass(source, target, width, height, radius, horizontal) {
  const length = horizontal ? width : height;
  const lines = horizontal ? height : width;
  const step = horizontal ? 4 : width * 4;
  const stride = horizontal ? width * 4 : 4;
  const count = radius * 2 + 1;

  for (let line = 0; line < lines; line++) {
    for (let channel = 0; channel < 3; channel++) {
      const start = line * stride + channel;
      let sum = source[start] * (radius + 1);
      for (let i = 1; i <= radius; i++) {
        sum += source[start + Math.min(i, length - 1) * step];
      }
      for (let i = 0; i < length; i++) {
        target[start + i * step] = sum / count;
        sum -= source[start + Math.max(0, i - radius) * step];
        sum += source[start + Math.min(length - 1, i + radius + 1) * step];
      }
    }
  }
}

function blurPlate(context, video, sample, box, clip) {
  const [x1, y1, x2, y2] = box;
  const left = Math.max(0, x1);
  const top = Math.max(0, y1 + 0.65 * (y2 - y1));
  const width = Math.min(clip.width, x2) - left;
  const height = Math.min(clip.height, y2 + 8) - top;
  if (width <= 0 || height <= 0) return;

  const sampleScale = Math.min(1, 96 / Math.max(width, height));
  const sampleWidth = Math.max(1, Math.round(width * sampleScale));
  const sampleHeight = Math.max(1, Math.round(height * sampleScale));
  const scaleX = video.videoWidth / clip.width;
  const scaleY = video.videoHeight / clip.height;
  sample.canvas.width = sampleWidth;
  sample.canvas.height = sampleHeight;
  sample.drawImage(
    video, left * scaleX, top * scaleY, width * scaleX, height * scaleY,
    0, 0, sampleWidth, sampleHeight,
  );

  // Approximate the v5 Gaussian with a separable box blur on the sampled pixels.
  const pixels = sample.getImageData(0, 0, sampleWidth, sampleHeight);
  const intermediate = new Uint8ClampedArray(pixels.data.length);
  const sigma = Math.max(8, (x2 - x1) * 0.045);
  const radius = Math.max(1, Math.round(Math.sqrt(3) * sigma * sampleScale));
  blurPass(pixels.data, intermediate, sampleWidth, sampleHeight, radius, true);
  blurPass(intermediate, pixels.data, sampleWidth, sampleHeight, radius, false);
  sample.putImageData(pixels, 0, 0);
  context.drawImage(sample.canvas, left, top, width, height);
}

export function drawVideoOverlay(canvas, video, sample, playback, time) {
  const context = canvas.getContext("2d");
  const width = Math.round(canvas.clientWidth * window.devicePixelRatio);
  const height = Math.round(canvas.clientHeight * window.devicePixelRatio);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  context.resetTransform();
  context.clearRect(0, 0, width, height);
  if (!width || !height || !video.videoWidth || video.readyState < 2) return;

  const { clip, frames } = playback;
  const videoScale = Math.min(width / video.videoWidth, height / video.videoHeight);
  const visibleWidth = video.videoWidth * videoScale;
  const visibleHeight = video.videoHeight * videoScale;
  const scaleX = visibleWidth / clip.width;
  const scaleY = visibleHeight / clip.height;
  const vehicles = frames[Math.floor(time * clip.fps + 1e-7)] ?? [];

  context.save();
  try {
    context.translate((width - visibleWidth) / 2, (height - visibleHeight) / 2);
    context.scale(scaleX, scaleY);
    context.beginPath();
    context.rect(0, 0, clip.width, clip.height);
    context.clip();

    for (const { box } of vehicles) {
      blurPlate(context, video, sample, box, clip);
    }

    // Candidate strokes remain visible when detections share the same box.
    const ordered = [...vehicles].sort((a, b) => Number(!!a.signal) - Number(!!b.signal));
    const unit = window.devicePixelRatio / scaleX;
    context.lineWidth = 2 * unit;
    context.font = `600 ${12 * unit}px system-ui`;
    for (const { box, quad, boxColor, quadColor, signal } of ordered) {
      const [x1, y1, x2, y2] = box;
      context.strokeStyle = boxColor;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);
      if (quad) {
        context.beginPath();
        context.moveTo(...quad[0]);
        for (const point of quad.slice(1)) context.lineTo(...point);
        context.closePath();
        context.strokeStyle = quadColor;
        context.stroke();
      }
      if (signal) {
        const label = `${signal.label} · ${signal.percent}%`;
        const labelWidth = context.measureText(label).width + 10 * unit;
        const labelX = Math.max(0, Math.min(x1, clip.width - labelWidth));
        const labelY = Math.max(0, y1 - 22 * unit);
        context.fillStyle = "#0F1318";
        context.fillRect(labelX, labelY, labelWidth, 20 * unit);
        context.fillStyle = "#FFFFFF";
        context.fillText(label, labelX + 5 * unit, labelY + 14 * unit);
      }
    }
  } finally {
    context.restore();
  }
}
