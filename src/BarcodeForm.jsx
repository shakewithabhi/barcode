import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw0RU8P6g4zRE3cRRwF2A2QlfwcOHSG65NxX1HQRvwpCadapwFb6fPqFqdcepbIL-wuzg/exec";

const BarcodeForm = () => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [scannedCodes, setScannedCodes] = useState([]);
  const [count, setCount] = useState(0);
  const [scanResult, setScanResult] = useState("");
  const [highlighted, setHighlighted] = useState(""); // for highlight animation
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState("");
  const [partner, setPartner] = useState("");
  const inactivityTimer = useRef(null);

  const startScanner = async () => {
    if (scanning) return;
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;
    setScanning(true);

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices.length) throw new Error("No camera found");
      const backCamera = devices.find((d) =>
        d.label.toLowerCase().includes("back")
      );
      const cameraId = backCamera ? backCamera.id : devices[0].id;

      await html5QrCode.start(
        { deviceId: { exact: cameraId } },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const cleaned = decodedText.replace(/\D/g, "");
          if (!cleaned) return;

          setScanResult(cleaned);
          setHighlighted(cleaned); // trigger highlight

          setScannedCodes((prev) => {
            if (!prev.includes(cleaned)) {
              const updated = [cleaned, ...prev];
              setCount(updated.length);
              return updated;
            }
            return prev;
          });

          // Auto-stop after 10s of inactivity
          if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
          inactivityTimer.current = setTimeout(() => stopScanner(), 10000);
        },
        (errorMessage) => console.warn("Scanning error:", errorMessage)
      );
    } catch (err) {
      console.error("Error starting camera:", err);
      alert("Camera access failed!");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
    }
    setScanning(false);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const handleSubmit = async () => {
    if (scannedCodes.length === 0) return alert("No barcodes scanned yet!");
    if (!user) return alert("Please select a User!");
    if (!partner) return alert("Please select a Delivery Partner!");

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcodes: scannedCodes,
          user,
          partner,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const result = await response.json();
      if (result.result === "success") {
        alert("✅ Data successfully added to Google Sheet!");
        setScannedCodes([]);
        setScanResult("");
        setCount(0);
        setUser("");
        setPartner("");
      } else {
        alert("❌ Failed: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("❌ Failed to submit. Possible CORS or network issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-black text-white min-h-screen">
      <h2 className="text-xl font-bold mb-4 text-red-500">
        Barcode Scanner
      </h2>

      <div
        id="reader"
        className="w-72 h-44 border-2 border-gray-500 rounded-3xl mb-4"
      ></div>

      <div className="p-3 bg-gray-900 border border-gray-700 rounded-3xl mb-4 w-72">
        <h3 className="font-bold text-red-500">Scanned Codes ({count})</h3>
        {scannedCodes.length === 0 ? (
          <p className="text-gray-400">No codes scanned yet</p>
        ) : (
          <ul className="mt-2 text-sm max-h-40 overflow-y-auto">
            {scannedCodes.map((code, index) => (
              <li
                key={index}
                className={`border-b border-gray-700 py-1 cursor-pointer rounded ${
                  highlighted === code ? "bg-green-600 animate-pulse" : ""
                }`}
                onClick={() => {
                  const updated = scannedCodes.filter((c) => c !== code);
                  setScannedCodes(updated);
                  setCount(updated.length);
                }}
              >
                {code}
              </li>
            ))}
          </ul>
        )}
      </div>

      {scanResult && (
        <div className="p-2 bg-red-900 border border-gray-700 rounded-3xl mb-4 w-72 text-center">
          <strong>Scanned:</strong> {scanResult}
        </div>
      )}

      <div className="flex flex-col gap-3 mb-4 w-72">
        <select
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="p-2 border border-gray-600 bg-black text-white rounded-2xl"
        >
          <option value="">Select User</option>
          <option value="Durga">Durga</option>
          <option value="Pooja">Pooja</option>
          <option value="Shabnam">Shabnam</option>
          <option value="Nikita">Nikita</option>
          <option value="Apoorv">Apoorv</option>
          <option value="Aryan">Aryan</option>
        </select>

        <select
          value={partner}
          onChange={(e) => setPartner(e.target.value)}
          className="p-2 border border-gray-600 bg-black text-white rounded-2xl"
        >
          <option value="">Select Delivery Partner</option>
          <option value="Delhivery">Delhivery</option>
          <option value="DTDC">DTDC</option>
          <option value="Bluedart">Bluedart</option>
          <option value="Xpressbees">Xpressbees</option>
          <option value="Amazon Shipping">Amazon Shipping</option>
          <option value="Shadowfax">Shadowfax</option>
          <option value="Gati">Gati</option>
          <option value="Safeexpress">Safeexpress</option>
          <option value="Om Logistics">Om Logistics</option>
          <option value="Ekart">Ekart</option>
          <option value="Valmo">Valmo</option>
        </select>
      </div>

      <div className="flex gap-3">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="px-4 py-2 bg-red-800 rounded hover:bg-red-900"
          >
            Stop Scanning
          </button>
        )}

        <button
          onClick={() => {
            setScannedCodes([]);
            setCount(0);
            setScanResult("");
          }}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          Clear All
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`mt-4 px-4 py-2 rounded text-white ${
          loading ? "bg-gray-700" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Submitting..." : "Submit to Google Sheet"}
      </button>
    </div>
  );
};

export default BarcodeForm;
