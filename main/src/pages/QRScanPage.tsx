import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Camera, Link2, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";

type Mode = "choose" | "camera" | "link";

const QRScanPage: React.FC = () => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const isStoppingRef = useRef(false);
  const [mode, setMode] = useState<Mode>("choose");
  const [cameraError, setCameraError] = useState("");
  const [detected, setDetected] = useState(false);

  // Manual token / link input
  const [manualInput, setManualInput] = useState("");
  const [manualError, setManualError] = useState("");

  // ── Extract qr_token from a URL or raw UUID ─────────────
  const extractToken = (raw: string): string | null => {
    raw = raw.trim();
    try {
      const url = new URL(raw);
      const parts = url.pathname.split("/").filter(Boolean);
      const enrollIdx = parts.indexOf("enroll");
      if (enrollIdx !== -1 && parts[enrollIdx + 1]) {
        return parts[enrollIdx + 1];
      }
    } catch {
      // Not a URL — treat as raw token
    }
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = raw.match(uuidRegex);
    return match ? match[0] : null;
  };

  const handleDetected = (raw: string) => {
    if (detected) return;
    const token = extractToken(raw);
    if (!token) {
      setCameraError("QR code is not a valid enrollment code. Try scanning again.");
      stopScanner();
      return;
    }
    setDetected(true);
    stopScanner();
    setTimeout(() => navigate(`/enroll/${token}`), 600);
  };

  // ── html5-qrcode scanner ────────────────────────────────
  const startScanner = async () => {
    setCameraError("");
    setDetected(false);
    isScanningRef.current = false;

    // Mount point must exist in DOM — wait one tick
    await new Promise(r => setTimeout(r, 100));

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDetected(decodedText);
        },
        () => {
          // Scan in progress — ignore frame errors
        }
      );
      isScanningRef.current = true;
    } catch (err: any) {
      isScanningRef.current = false;
      const msg = typeof err === "string" ? err : err?.message ?? "";
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("notallowed")) {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings and try again.");
      } else if (msg.toLowerCase().includes("notfound") || msg.toLowerCase().includes("no camera")) {
        setCameraError("No camera found on this device. Use 'Paste Link' instead.");
      } else {
        setCameraError("Could not start camera: " + (msg || "unknown error") + ". Try 'Paste Link' instead.");
      }
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      const state = typeof scanner.getState === "function" ? scanner.getState() : null;
      if (isStoppingRef.current) return;
      isStoppingRef.current = true;
      const finalize = () => {
        try {
          scanner.clear();
        } catch {
          // Ignore cleanup errors
        }
        scannerRef.current = null;
        isScanningRef.current = false;
        isStoppingRef.current = false;
      };

      if (state === 2 || state === 3 || isScanningRef.current) {
        isScanningRef.current = false;
        try {
          scanner.stop().catch(() => {}).finally(finalize);
        } catch {
          finalize();
        }
      } else {
        try {
          finalize();
        } catch {
          scannerRef.current = null;
          isScanningRef.current = false;
          isStoppingRef.current = false;
        }
      }
    }
  };

  useEffect(() => {
    if (mode === "camera") {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [mode]);

  // ── Manual link / token submit ───────────────────────────
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError("");
    const token = extractToken(manualInput);
    if (!token) {
      setManualError(
        "Could not find a valid enrollment token. Paste the full enrollment link or the UUID token."
      );
      return;
    }
    navigate(`/enroll/${token}`);
  };

  const goBack = () => {
    stopScanner();
    if (mode === "choose") navigate(-1);
    else setMode("choose");
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>

        <div className="text-center">
          <div className="inline-flex p-3 bg-blue-600 rounded-2xl mb-3 shadow-lg">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Enroll via QR</h1>
          <p className="text-gray-500 text-sm mt-1">
            Scan the QR code shown by your trainer, or paste the enrollment link
          </p>
        </div>

        {/* Mode: Choose */}
        {mode === "choose" && (
          <div className="grid grid-cols-1 gap-3">
            <Card
              className="p-5 cursor-pointer hover:shadow-md hover:border-blue-300 border-2 border-transparent transition-all"
              onClick={() => setMode("camera")}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Camera className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Scan with Camera</p>
                  <p className="text-sm text-gray-500">
                    Point your camera at the QR code on trainer's screen
                  </p>
                  <p className="text-xs text-blue-500 mt-1">Works on all modern browsers</p>
                </div>
              </div>
            </Card>

            <Card
              className="p-5 cursor-pointer hover:shadow-md hover:border-green-300 border-2 border-transparent transition-all"
              onClick={() => setMode("link")}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Link2 className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Paste Enrollment Link</p>
                  <p className="text-sm text-gray-500">
                    Paste the link your trainer shared via WhatsApp or message
                  </p>
                  <p className="text-xs text-green-500 mt-1">Works on all browsers and devices</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Mode: Camera */}
        {mode === "camera" && (
          <Card className="p-4 shadow-lg border-0 space-y-4">
            {cameraError ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{cameraError}</p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    setCameraError("");
                    setMode("link");
                  }}
                >
                  <Link2 className="w-4 h-4 mr-2" /> Use Paste Link Instead
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setCameraError("");
                    setDetected(false);
                    startScanner();
                  }}
                >
                  <Camera className="w-4 h-4 mr-2" /> Try Again
                </Button>
              </div>
            ) : detected ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <p className="font-semibold text-green-700">QR Code Detected!</p>
                <p className="text-sm text-gray-500">Redirecting to enrollment page...</p>
              </div>
            ) : (
              <>
                {/* html5-qrcode mounts into this div */}
                <div
                  id="qr-reader"
                  className="rounded-xl overflow-hidden w-full"
                  style={{ minHeight: 300 }}
                />
                <p className="text-center text-xs text-gray-400">
                  Hold camera steady — QR code will be detected automatically
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    stopScanner();
                    setMode("link");
                  }}
                >
                  <Link2 className="w-4 h-4 mr-2" /> Paste Link Instead
                </Button>
              </>
            )}
          </Card>
        )}

        {/* Mode: Paste Link */}
        {mode === "link" && (
          <Card className="p-6 shadow-lg border-0">
            <h2 className="font-bold text-gray-900 mb-1">Paste Enrollment Link or Token</h2>
            <p className="text-sm text-gray-500 mb-4">
              Your trainer shared a link like:<br />
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                http://localhost:5173/enroll/xxxxxxxx-xxxx-...
              </code>
            </p>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <Input
                placeholder="Paste enrollment link or UUID token here..."
                value={manualInput}
                onChange={e => { setManualInput(e.target.value); setManualError(""); }}
                autoFocus
                className="font-mono text-sm"
              />
              {manualError && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {manualError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!manualInput.trim()}
              >
                Go to Enrollment Page
              </Button>
            </form>
          </Card>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Eagle Industry Training Portal · Secure enrollment
        </p>
      </div>
    </div>
  );
};

export default QRScanPage;
