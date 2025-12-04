import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Camera, Keyboard, AlertCircle } from "lucide-react";

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [useManualMode, setUseManualMode] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (isOpen && !useManualMode && !cameraPermissionDenied) {
      checkCameraPermission();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, useManualMode]);

  const checkCameraPermission = async () => {
    try {
      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext || 
                             window.location.protocol === 'https:' || 
                             window.location.hostname === 'localhost';
      
      if (!isSecureContext) {
        setError("L'accès à la caméra nécessite une connexion sécurisée (HTTPS)");
        setUseManualMode(true);
        return;
      }

      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Votre navigateur ne supporte pas l'accès à la caméra");
        setUseManualMode(true);
        return;
      }

      // Request camera permission explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        
        // Stop the stream immediately, we just wanted to get permission
        stream.getTracks().forEach(track => track.stop());
        
        // Now start the actual scanner
        startScanner();
      } catch (permError) {
        console.error("Camera permission error:", permError);
        
        if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
          setError("Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
          setCameraPermissionDenied(true);
        } else if (permError.name === 'NotFoundError') {
          setError("Aucune caméra détectée sur cet appareil");
        } else {
          setError("Impossible d'accéder à la caméra: " + permError.message);
        }
        
        setUseManualMode(true);
      }
    } catch (err) {
      console.error("Error checking camera:", err);
      setError("Erreur lors de la vérification de la caméra");
      setUseManualMode(true);
    }
  };

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
      setError("Impossible de démarrer le scanner: " + err.message);
      setScanning(false);
      setUseManualMode(true);
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
    setManualInput("");
    setError(null);
    setUseManualMode(false);
    setCameraPermissionDenied(false);
    onClose();
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {useManualMode ? <Keyboard className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
            {useManualMode ? "Saisie manuelle" : "Scanner le code-barres"}
          </DialogTitle>
          <DialogDescription>
            {useManualMode 
              ? "Entrez le numéro de recommandé manuellement"
              : "Positionnez le code-barres devant la caméra"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Information</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {!useManualMode ? (
            <>
              <div 
                id="barcode-reader" 
                ref={scannerRef}
                className="w-full rounded-lg overflow-hidden bg-slate-900"
                style={{ minHeight: "300px" }}
              />

              <Button
                variant="outline"
                onClick={() => setUseManualMode(true)}
                className="w-full"
              >
                <Keyboard className="mr-2 h-4 w-4" />
                Saisie manuelle à la place
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="manual-barcode">Numéro de recommandé</Label>
                <Input
                  id="manual-barcode"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Ex: 1A123456789FR"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                  autoFocus
                />
              </div>

              {!cameraPermissionDenied && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setUseManualMode(false);
                    setError(null);
                  }}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Essayer le scan caméra
                </Button>
              )}
            </>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annuler
            </Button>
            {useManualMode && (
              <Button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Valider
              </Button>
            )}
          </div>

          {!useManualMode && (
            <p className="text-xs text-slate-500 text-center">
              Le navigateur vous demandera l'autorisation d'accéder à la caméra
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
