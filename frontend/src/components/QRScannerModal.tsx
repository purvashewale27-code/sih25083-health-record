import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
        setIsScanning(false);
      }
      return;
    }

    const elementId = 'reader-qr-viewfinder';
    let html5QrCode: Html5Qrcode;

    const startCamera = async () => {
      try {
        setCameraError(null);
        html5QrCode = new Html5Qrcode(elementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Audio beep feedback on successful scan
            try {
              const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(800, audioCtx.currentTime);
              osc.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch {
              // Ignore audio error
            }

            if (scannerRef.current) {
              scannerRef.current.stop().catch(() => {});
            }
            onScanSuccess(decodedText);
          },
          () => {
            // Frame scan miss (ignore)
          }
        );
        setIsScanning(true);
      } catch (err: unknown) {
        const error = err as Error;
        console.warn('Camera scan initialization notice:', error);
        setCameraError(
          error.message || 'Camera permission not granted or no webcam detected. You can upload an image of the QR card instead.'
        );
      }
    };

    const timer = setTimeout(startCamera, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isOpen, isScanning, onScanSuccess]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCameraError(null);
      const html5QrCode = new Html5Qrcode('file-qr-decoder-temp', false);
      const decodedResult = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      onScanSuccess(decodedResult);
    } catch {
      setCameraError('Could not decode QR code from the uploaded image. Please try a clearer picture.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#DDE8E8] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 text-[#16313A]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#DDE8E8] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#E8F8F6] text-[#00A99D] flex items-center justify-center text-lg font-bold border border-[#00A99D]/30">
              📷
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#16313A]">Live Camera QR Scanner</h3>
              <p className="text-xs text-[#61747B]">Scan patient's official Kerala Health Card or enter Health ID</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#61747B] hover:text-[#16313A] text-lg p-1 rounded-lg hover:bg-[#F0FAF8]"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center min-h-[260px] border border-slate-800">
          <div id="reader-qr-viewfinder" className="w-full h-full" />
          <div id="file-qr-decoder-temp" className="hidden" />

          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/90 text-slate-200 p-6 flex flex-col items-center justify-center text-center space-y-3 z-10">
              <span className="text-3xl">📷</span>
              <p className="text-xs text-rose-300 font-medium max-w-xs">{cameraError}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white rounded-xl text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
              >
                <span>📁</span>
                <span>Upload QR Image / Photo</span>
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Manual Fallback Input */}
        <div className="space-y-2 pt-2 border-t border-[#DDE8E8]">
          <span className="text-[11px] font-semibold text-[#61747B] uppercase tracking-wider block">
            Or Enter Health ID / URL:
          </span>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. KMH-2026-00001 or MIG-2025-0001"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] text-xs font-mono focus:outline-none focus:border-[#00A99D]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
            >
              Verify
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload QR image file"
              className="px-3 py-2 bg-[#F8FAFA] hover:bg-[#E8F8F6] text-[#16313A] border border-[#DDE8E8] rounded-xl text-xs"
            >
              📁
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
