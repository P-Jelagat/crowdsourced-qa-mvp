import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000';

function App() {

  // ---------------- AUTHENTICATION STATE ----------------

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ---------------- VERIFICATION STATE ----------------

  const [listingImg, setListingImg] = useState(null);
  const [deliveryImg, setDeliveryImg] = useState(null);

  const [vendorNumber, setVendorNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [productRef, setProductRef] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');

  // ---------------- RESTORE SESSION ----------------

  useEffect(() => {

    const restoreSession = async () => {

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {

        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Session expired.');
        }

        const data = await response.json();

        setUser(data.user);

      } catch (err) {

        localStorage.removeItem('token');
        setToken(null);
        setUser(null);

      } finally {

        setAuthLoading(false);

      }
    };

    restoreSession();

  }, [token]);

  // ---------------- REGISTER / LOGIN ----------------

  const handleAuth = async (e) => {

    e.preventDefault();

    setAuthError('');
    setAuthLoading(true);

    const endpoint = authMode === 'register'
      ? '/api/auth/register'
      : '/api/auth/login';

    try {

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      localStorage.setItem('token', data.token);

      setToken(data.token);
      setUser(data.user);

      setEmail('');
      setPassword('');

    } catch (err) {

      setAuthError(err.message);

    } finally {

      setAuthLoading(false);

    }
  };

  // ---------------- LOGOUT ----------------

  const handleLogout = () => {

    localStorage.removeItem('token');

    setToken(null);
    setUser(null);

    setListingImg(null);
    setDeliveryImg(null);

    setVendorNumber('');
    setOrderNumber('');
    setProductRef('');

    setResult(null);
    setMetrics(null);
    setError('');
  };

  // ---------------- AUTHENTICATED API REQUEST ----------------

  const authenticatedFetch = async (url, options = {}) => {

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    });
  };

  // ---------------- FETCH VENDOR METRICS ----------------

  useEffect(() => {

    const fetchMetrics = async () => {

      if (!user || !vendorNumber) {
        setMetrics(null);
        return;
      }

      try {

        const response = await authenticatedFetch(
          `${API_BASE}/api/vendor/${vendorNumber}`
        );

        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }

      } catch (err) {

        console.error('Unable to retrieve vendor metrics:', err);

      }
    };

    fetchMetrics();

  }, [vendorNumber, user]);

  // ---------------- IMAGE UPLOAD ----------------

  const handleImageUpload = (e, setter) => {

    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image.');
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setter(reader.result);
      setError('');
    };

    reader.readAsDataURL(file);
  };

  // ---------------- RESET ----------------

  const handleReset = () => {

    setListingImg(null);
    setDeliveryImg(null);

    setResult(null);
    setError('');

    document.querySelectorAll('.file-input').forEach(input => {
      input.value = '';
    });
  };

  // ---------------- VERIFY IMAGES ----------------

  const processVerification = async () => {

    setError('');
    setResult(null);

    if (!vendorNumber || !orderNumber || !productRef.trim()) {
      setError('Please complete all product and order information.');
      return;
    }

    if (!listingImg || !deliveryImg) {
      setError('Please upload both the master listing image and buyer delivery image.');
      return;
    }

    setLoading(true);

    try {

      const response = await authenticatedFetch(
        `${API_BASE}/api/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            vendorNumber,
            orderNumber,
            productRef,
            listingImg,
            deliveryImg
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed.');
      }

      setResult(data.submission);
      setMetrics(data.vendorMetrics);

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  };

  // ---------------- AUTHENTICATION SCREEN ----------------

  if (authLoading) {
    return (
      <div className="dashboard-container">
        <h2>Loading VerifySaaS...</h2>
      </div>
    );
  }

  if (!user) {

    return (

      <div className="dashboard-container">

        <div className="panel" style={{
          maxWidth: '420px',
          margin: '80px auto',
          padding: '30px'
        }}>

          <h1 className="brand-title">VerifySaaS</h1>

          <p className="brand-subtitle">
            Product Integrity Verification System
          </p>

          <h2 className="panel-title">
            {authMode === 'register'
              ? 'Create Your Account'
              : 'Welcome Back'}
          </h2>

          <form onSubmit={handleAuth} className="auth-form">

            <div className="form-group">

              <label className="input-label">
                EMAIL ADDRESS

                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />

              </label>

              <label className="input-label">
                PASSWORD

                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />

              </label>

            </div>

            {authError && (
              <p style={{ color: 'red' }}>
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="action-button"
              disabled={authLoading}
            >
              {authLoading
                ? 'Please wait...'
                : authMode === 'register'
                  ? 'Create Account'
                  : 'Log In'}
            </button>

          </form>

          <p style={{ marginTop: '20px' }}>

            {authMode === 'register'
              ? 'Already have an account?'
              : "Don't have an account?"}

            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  authMode === 'register' ? 'login' : 'register'
                );
                setAuthError('');
              }}
              style={{
                marginLeft: '8px',
                border: 'none',
                background: 'none',
                color: '#2563eb',
                cursor: 'pointer'
              }}
            >
              {authMode === 'register' ? 'Log In' : 'Sign Up'}
            </button>

          </p>

        </div>

      </div>

    );
  }

  // ---------------- MAIN DASHBOARD ----------------

  return (

    <div className="dashboard-container">

      <header className="dashboard-header">

        <div className="header-main">

          <div className="user-info">

            <h1 className="brand-title">
              VerifySaaS MVP
            </h1>

            <p className="brand-subtitle">
              Product Integrity Verification System
            </p>

            <p>
              Logged in as: {user.email}
            </p>

            <p>
              Buyer Account: <strong>{user.buyerId}</strong>
            </p>

          </div>

          <button
            onClick={handleLogout}
            className="reset-button logout-button"
          >
            Log Out
          </button>

        </div>

        {metrics && (

          <div className="metrics-row">

            <div className="metrics-card">

              <span className="metrics-label">
                VENDOR TRUST SCORE
              </span>

              <span className={`metrics-score ${
                metrics.trustScore >= 75 ? 'good' : 'bad'
              }`}>
                {metrics.trustScore}%
              </span>

              <p className="metrics-subtext">
                {metrics.mismatchCount}/{metrics.totalInspections} mismatches
              </p>

              <p className="metrics-subtext">
                Across all registered buyers
              </p>

            </div>

          </div>

        )}

      </header>

      <div className="workspace-grid">

        {/* METADATA */}

        <div className="panel">

          <h2 className="panel-title">
            Metadata Context
          </h2>

          <div className="form-group">

            <label className="input-label">
              VENDOR IDENTIFIER

              <div style={{ display: 'flex', alignItems: 'center' }}>

                <span style={{ padding: '10px', background: '#eee' }}>
                  VNDR-
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={vendorNumber}
                  onChange={e => {
                    setVendorNumber(e.target.value.replace(/\D/g, ''));
                    setMetrics(null);
                    setResult(null);
                  }}
                  placeholder="Enter numbers only"
                  className="form-input"
                />

              </div>

            </label>

            <label className="input-label">
              PRODUCT REFERENCE

              <input
                type="text"
                value={productRef}
                onChange={e => setProductRef(e.target.value)}
                placeholder="Enter product reference"
                className="form-input"
              />

            </label>

            <label className="input-label">
              ORDER REFERENCE ID

              <div style={{ display: 'flex', alignItems: 'center' }}>

                <span style={{ padding: '10px', background: '#eee' }}>
                  ORD-
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={orderNumber}
                  onChange={e => {
                    setOrderNumber(e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder="Enter numbers only"
                  className="form-input"
                />

              </div>

            </label>

            <label className="input-label">
              BUYER ACCOUNT REF

              <input
                type="text"
                value={user.buyerId}
                readOnly
                className="form-input"
              />

            </label>

          </div>

        </div>

        {/* IMAGE UPLOAD */}

        <div className="panel">

          <h2 className="panel-title">
            Verification Inspection Matrix
          </h2>

          <div className="upload-grid">

            <div className="upload-box">

              <p className="upload-title">
                1. Master Listing Image
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={e => handleImageUpload(e, setListingImg)}
                className="file-input"
              />

              {listingImg && (
                <img
                  src={listingImg}
                  alt="Listing Preview"
                  className="preview-thumbnail"
                />
              )}

            </div>

            <div className="upload-box">

              <p className="upload-title">
                2. Buyer Delivery Evidence
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={e => handleImageUpload(e, setDeliveryImg)}
                className="file-input"
              />

              {deliveryImg && (
                <img
                  src={deliveryImg}
                  alt="Delivery Preview"
                  className="preview-thumbnail"
                />
              )}

            </div>

          </div>

          <div className="button-container">

            <button
              onClick={processVerification}
              disabled={loading}
              className="action-button"
            >
              {loading
                ? 'Comparing Images...'
                : 'Compare Images'}
            </button>

            <button
              onClick={handleReset}
              className="reset-button"
            >
              Reset
            </button>

          </div>

          {error && (

            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '6px'
            }}>
              {error}
            </div>

          )}

          {result && (

            <div className={`result-box ${
              result.status === 'MATCH' ? 'match' : 'mismatch'
            }`}>

              <h3 className="result-title">
                Analysis Complete: {result.status}
              </h3>

              <p className="result-text">
                Visual Similarity Score: {' '}
                <strong>{result.confidenceScore}%</strong>
              </p>

              <p>
                Order: {result.orderId}
              </p>

              <p>
                Product: {result.productRef}
              </p>

              <p>
                Buyer: {result.buyerId}
              </p>

            </div>

          )}

          <p style={{
            fontSize: '12px',
            marginTop: '15px',
            color: '#666'
          }}>
            Image similarity is based on visual pixel comparison.
            It is not a definitive authenticity check.
          </p>

        </div>

      </div>

    </div>

  );
}

export default App;