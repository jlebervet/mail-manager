import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { X, Camera } from "lucide-react";

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (isOpen && !scanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      setScanning(true);

      // Initialize scanner
      html5QrCodeRef.current = new Html5Qrcode("barcode-reader");

      // Start scanning
      await html5QrCodeRef.current.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 16/9
        },
        (decodedText) => {
          // Success callback
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        (errorMessage) => {
          // Error callback (usually just "No QR code found")
          // We don't show these to avoid spamming the user
        }
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError("Impossible d'accéder à la caméra. Veuillez vérifier les autorisations.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      setScanning(false);
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scanner le code-barres
          </DialogTitle>
          <DialogDescription>
            Positionnez le code-barres devant la caméra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div 
            id="barcode-reader" 
            ref={scannerRef}
            className="w-full rounded-lg overflow-hidden bg-slate-900"
            style={{ minHeight: "300px" }}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annuler
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Assurez-vous d'avoir autorisé l'accès à la caméra dans votre navigateur
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
