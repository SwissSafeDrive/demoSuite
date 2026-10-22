import { useEffect, useRef, useState } from 'react';

interface Props {
  onCapture: (blobUrl: string) => void;
  onBack: () => void;
}

type CameraState = 'requesting' | 'live' | 'error';

export default function CameraEnDiretta({ onCapture, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>('requesting');
  const [errorMsg, setErrorMsg] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraState('live');
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setErrorMsg(
            err.name === 'NotAllowedError'
              ? 'Accesso alla telecamera negato. Verificare le autorizzazioni del browser.'
              : err.name === 'NotFoundError'
                ? 'Nessuna telecamera trovata sul dispositivo.'
                : 'Impossibile accedere alla telecamera: ' + err.message,
          );
          setCameraState('error');
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function handleCapture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onCapture(URL.createObjectURL(blob));
    }, 'image/jpeg');
  }

  return (
    <div className="db-cam-root">
      <style>{`
        .db-cam-root { font-family: system-ui, sans-serif; color: #1a1a1a; max-width: 860px; margin: 0 auto; padding: 24px; }
        .db-cam-back { background: none; border: none; cursor: pointer; font-size: 13px; color: #6b6b6b; padding: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 4px; }
        .db-cam-back:hover { color: #1a1a1a; }
        .db-cam-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
        .db-cam-video-wrap { position: relative; width: 100%; aspect-ratio: 16/9; background: #111; border-radius: 4px; overflow: hidden; }
        .db-cam-video { width: 100%; height: 100%; object-fit: cover; }
        .db-cam-live-badge { position: absolute; top: 10px; right: 10px; background: #e30613; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; padding: 3px 8px; border-radius: 2px; }
        .db-cam-error { width: 100%; aspect-ratio: 16/9; background: #111; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #aaa; text-align: center; padding: 24px; box-sizing: border-box; }
        .db-cam-error-icon { font-size: 36px; }
        .db-cam-error-msg { font-size: 13px; max-width: 360px; line-height: 1.5; }
        .db-cam-requesting { width: 100%; aspect-ratio: 16/9; background: #111; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #555; font-size: 13px; }
        .db-cam-actions { margin-top: 16px; display: flex; gap: 12px; }
        .db-cam-capture { padding: 10px 24px; background: #e30613; color: #fff; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .db-cam-capture:hover { background: #c0040f; }
        .db-cam-note { margin-top: 12px; font-size: 12px; color: #6b6b6b; }
      `}</style>

      <button className="db-cam-back" onClick={onBack}>← Torna alla lista</button>
      <div className="db-cam-title">Telecamera in diretta</div>

      {cameraState === 'requesting' && (
        <div className="db-cam-requesting">
          <span>Richiesta accesso telecamera...</span>
        </div>
      )}

      {cameraState === 'error' && (
        <div className="db-cam-error">
          <div className="db-cam-error-icon">📷</div>
          <div className="db-cam-error-msg">{errorMsg || 'Nessuna telecamera disponibile.'}</div>
          <button className="db-cam-back" style={{ marginTop: 8 }} onClick={onBack}>← Torna alla lista</button>
        </div>
      )}

      {cameraState !== 'error' && (
        <div className="db-cam-video-wrap" style={{ display: cameraState === 'requesting' ? 'none' : undefined }}>
          <video
            ref={videoRef}
            className="db-cam-video"
            autoPlay
            muted
            playsInline
          />
          {cameraState === 'live' && <div className="db-cam-live-badge">● LIVE</div>}
        </div>
      )}

      {cameraState === 'live' && (
        <>
          <div className="db-cam-actions">
            <button className="db-cam-capture" onClick={handleCapture}>
              Acquisisci fotogramma
            </button>
          </div>
          <div className="db-cam-note">
            Il fotogramma verrà aggiunto come nuovo registro in stato "In attesa".
          </div>
        </>
      )}
    </div>
  );
}
