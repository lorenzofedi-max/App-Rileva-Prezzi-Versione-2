import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

interface ScannerModalProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const divId = "reader";

  useEffect(() => {
    // Initialize scanner
    const startScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode(divId);
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [
               Html5QrcodeSupportedFormats.EAN_13,
               Html5QrcodeSupportedFormats.EAN_8,
               Html5QrcodeSupportedFormats.CODE_128
            ]
          },
          (decodedText) => {
            onScanSuccess(decodedText);
            onClose(); // Auto close on success
          },
          () => {} // Ignore errors per frame
        );
      } catch (err) {
        console.error("Error starting scanner", err);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(err => console.error(err));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="w-full max-w-md p-4 bg-white rounded-lg relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>
        <h3 className="text-center text-lg font-semibold mb-4">Scansiona Barcode</h3>
        <div id={divId} className="w-full overflow-hidden rounded-lg bg-black"></div>
        <p className="text-center text-sm text-gray-500 mt-4">Inquadra il codice a barre</p>
      </div>
    </div>
  );
};
