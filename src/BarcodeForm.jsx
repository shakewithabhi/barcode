import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const BarcodeForm = () => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState("");
  const [partner, setPartner] = useState("");

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbz6owqe6s5Q3RvLm1KaHC857gfbpSGVCwT5A40dshYS9zqFH_ohj47DEhDraVDAAEh82g/exec";

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
          const numericData = decodedText.replace(/\D/g, "");

          setScanResults((prev) => {
            if (prev.includes(numericData)) return prev;
            return [...prev, numericData];
          });
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
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const handleSubmit = async () => {
    if (!scanResults.length) return alert("No barcodes scanned yet!");
    if (!user) return alert("Please select a User!");
    if (!partner) return alert("Please select a Delivery Partner!");

    setLoading(true);

    try {
      const form = new FormData();
      form.append("user", user);
      form.append("partner", partner);
      form.append("barcodes", JSON.stringify(scanResults));

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: form,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.status === "success") {
        alert(`✅ Successfully added ${scanResults.length} barcode(s)!`);
        setScanResults([]);
        setUser("");
        setPartner("");
      } else {
        alert("❌ Failed: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error sending data:", error);
      alert("❌ Error sending data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED REMOVE FUNCTION
  const removeCode = (code) => {
    setScanResults((prev) => prev.filter((item) => item !== code));
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-black text-white min-h-screen">
      <h2 className="text-xl font-bold mb-4 text-red-500">
        <img
          className="max-w-32"
          src="https://cdn.shopify.com/s/files/1/0719/1930/4999/files/YOUTH_ROBE_on_Black_BG.jpg?v=1762946995"
          alt=""
        />
      </h2>

      {/* FIXED-SIZE CAMERA CONTAINER */}
      <div className="relative w-full max-w-xs mx-auto">
        <div
          id="reader"
          className="w-full h-64 border-2 border-gray-500 rounded-3xl overflow-hidden mb-4"
          style={{ maxHeight: "260px", minHeight: "240px" }}
        ></div>
      </div>

      {/* SCANNED LIST */}
      {scanResults.length > 0 && (
        <div className="p-2 bg-red-900 border border-gray-700 rounded-3xl mb-4 w-72 text-center">
          <strong>Scanned Codes ({scanResults.length}):</strong>

          <ul className="mt-2 space-y-2">
            {scanResults.map((entry, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center bg-black p-2 rounded-xl border border-gray-700"
              >
                <span className="font-semibold">{entry}</span>

                <button
                  onClick={() => removeCode(entry)}
                  className="text-red-400 hover:text-red-500 font-bold"
                >
                  ❌
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selects */}
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

      {!scanning ? (
        <button
          onClick={startScanner}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Start Scanning
        </button>
      ) : (
        <button
          onClick={stopScanner}
          className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900"
        >
          Stop Scanning
        </button>
      )}

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
