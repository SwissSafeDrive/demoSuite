let lat = 47.4581;
let lon = 8.5553;
let speed = 0;

export interface SensorSnapshot {
  lat: number;
  lon: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroZ: number;
  speedKmh: number;
}

export function resetSensors(): void {
  lat = 47.4581;
  lon = 8.5553;
  speed = 0;
}

export function readSensors(): SensorSnapshot {
  lat += (Math.random() - 0.5) * 0.00004;
  lon += (Math.random() - 0.49) * 0.00006;

  speed += (Math.random() - 0.5) * 4;
  speed = Math.max(0, Math.min(100, speed));

  return {
    lat: parseFloat(lat.toFixed(6)),
    lon: parseFloat(lon.toFixed(6)),
    accelX: parseFloat(((Math.random() - 0.5) * 0.8).toFixed(3)),
    accelY: parseFloat(((Math.random() - 0.5) * 0.4).toFixed(3)),
    accelZ: parseFloat((9.81 + (Math.random() - 0.5) * 0.2).toFixed(3)),
    gyroZ: parseFloat(((Math.random() - 0.5) * 0.06).toFixed(4)),
    speedKmh: Math.round(speed),
  };
}

export function dataQuality(predictions: Array<{ score: number }>): number {
  if (predictions.length === 0) return 0.6 + Math.random() * 0.1;
  const avgConf = predictions.reduce((a, p) => a + p.score, 0) / predictions.length;
  const variety = Math.min(predictions.length / 4, 1);
  return parseFloat(Math.min(avgConf * 0.7 + variety * 0.3, 1).toFixed(2));
}

export function estimateFrameBytes(predCount: number, width: number, height: number): number {
  return Math.round(width * height * 0.15 + predCount * 200);
}
