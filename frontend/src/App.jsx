import { useState, useEffect } from 'react';
import './App.css'; 

const API_BASE = "http://localhost:5000";

function App() {
  const [listingImg, setListingImg] = useState(null);
  const [deliveryImg, setDeliveryImg] = useState(null);
  const [vendorId, setVendorId] = useState("VNDR-883");
  const [orderId, setOrderId] = useState("ORD-1092");
  const [buyerId, setBuyerId] = useState("BYR-4402");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, [vendorId]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vendor/${vendorId}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Error communicating with metrics API:", err);
    }
  };

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result);
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setListingImg(null);
    setDeliveryImg(null);
    setResult(null);
    // Clear inputs visually
    document.querySelectorAll('.file-input').forEach(input => input.value = '');
  };

  const processVerification = async () => {
    if (!listingImg || !deliveryImg) {
      alert("Please upload both listing and delivery photographs.");
      return;
    }
    setLoading(true);

    setTimeout(async () => {
      // Internal calculation framework mockup replacing deep learning environments
      const generatedScore = Math.floor(Math.random() * (100 - 40 + 1)) + 40;

      try {
        const response = await fetch(`${API_BASE}/api/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, vendorId, buyerId, similarityScore: generatedScore })
        });
        const data = await response.json();
        setResult(data.submission);
        setMetrics(data.vendorMetrics);
      } catch (err) {
        alert("Network failure reaching the local backend server node.", err);
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="brand-title">VerifySaaS MVP</h1>
          <p className="brand-subtitle">Decentralized Integrity Engine (Vite + Express Architecture)</p>
        </div>
        {metrics && (
          <div className="metrics-card">
            <span className="metrics-label">VENDOR TRUST SCORE</span>
            <span className={`metrics-score ${metrics.trustScore > 75 ? 'good' : 'bad'}`}>
              {metrics.trustScore}%
            </span>
            <p className="metrics-subtext">{metrics.mismatchCount}/{metrics.totalInspections} flags</p>
          </div>
        )}
      </header>

      <div className="workspace-grid">
        <div className="panel">
          <h2 className="panel-title">Metadata Context</h2>
          <div className="form-group">
            <label className="input-label">VENDOR IDENTIFIER
              <input type="text" value={vendorId} onChange={(e)=>setVendorId(e.target.value)} className="form-input" />
            </label>
            <label className="input-label">ORDER REFERENCE
              <input type="text" value={orderId} onChange={(e)=>setOrderId(e.target.value)} className="form-input" />
            </label>
            <label className="input-label">BUYER ACCOUNT REF
              <input type="text" value={buyerId} onChange={(e)=>setBuyerId(e.target.value)} className="form-input" />
            </label>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Verification Inspection Matrix</h2>
          
          <div className="upload-grid">
            <div className="upload-box">
              <p className="upload-title">1. Master Listing Image</p>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setListingImg)} className="file-input" />
              {listingImg && <img src={listingImg} alt="Listing Preview" className="preview-thumbnail" />}
            </div>
            
            <div className="upload-box">
              <p className="upload-title">2. Buyer Upload Evidence</p>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setDeliveryImg)} className="file-input" />
              {deliveryImg && <img src={deliveryImg} alt="Delivery Preview" className="preview-thumbnail" />}
            </div>
          </div>

          <div className="button-container">
            <button onClick={processVerification} disabled={loading} className="action-button">
              {loading ? "Executing Vision Discrepancy Framework..." : "Trigger AI Validation Analysis"}
            </button>
            <button onClick={handleReset} className="reset-button">
              Reset
            </button>
          </div>

          {result && (
            <div className={`result-box ${result.status === 'MATCH' ? 'match' : 'mismatch'}`}>
              <h3 className="result-title">Analysis Complete: {result.status}</h3>
              <p className="result-text">Calculated Visual Match Confidence Metrics: <strong>{result.confidenceScore}%</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
