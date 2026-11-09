import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";

import "./App.css";

const API_URL = "http://localhost:5002";

const DEMOMART_URL = "http://localhost:5173";


// ==========================================
// MAIN APPLICATION
// ==========================================

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("verifyUser")) || null
  );

  const [token, setToken] = useState(
    localStorage.getItem("verifyToken") || null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Preserve the handoff token when the user arrives from DemoMart.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const handoff = params.get("handoff");

    if (handoff) {
      sessionStorage.setItem("verifyHandoffToken", handoff);
    }
  }, [location.search]);


  // ==========================================
  // LOGIN AND SIGNUP
  // ==========================================

  const handleAuth = async (formData, mode) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/${mode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      localStorage.setItem("verifyToken", data.token);
      localStorage.setItem("verifyUser", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      // Check whether the user arrived from DemoMart.
      const handoffToken = sessionStorage.getItem(
        "verifyHandoffToken"
      );

      if (handoffToken) {
        await redeemHandoff(data.token, handoffToken);
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // REDEEM DEMOMART PURCHASE
  // ==========================================

  const redeemHandoff = async (authToken, handoffToken) => {
    const response = await fetch(
      `${API_URL}/api/handoff/redeem`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          handoffToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to verify purchase.");
    }

    sessionStorage.removeItem("verifyHandoffToken");

    navigate(`/review/${data.reviewSession.id}`, {
      state: {
        reviewSession: data.reviewSession,
      },
    });
  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("verifyToken");
    localStorage.removeItem("verifyUser");

    sessionStorage.removeItem("verifyHandoffToken");

    setUser(null);
    setToken(null);

    navigate("/login");
  };


  return (
    <Routes>

      <Route
        path="/"
        element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
      />

      <Route
        path="/login"
        element={
          <AuthPage
            mode="login"
            onSubmit={handleAuth}
            loading={loading}
            error={error}
          />
        }
      />

      <Route
        path="/signup"
        element={
          <AuthPage
            mode="signup"
            onSubmit={handleAuth}
            loading={loading}
            error={error}
          />
        }
      />

      <Route
        path="/review/:sessionId"
        element={
          token ? (
            <ReviewPage
              token={token}
              user={user}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          token ? (
            <Dashboard
              user={user}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}


// ==========================================
// AUTHENTICATION PAGE
// ==========================================

function AuthPage({ mode, onSubmit, loading, error }) {
  const navigate = useNavigate();

  const isSignup = mode === "signup";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const updateField = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const submitForm = (e) => {
    e.preventDefault();

    onSubmit(formData, mode);
  };

  return (
    <div className="auth-page">

      <div className="auth-brand">
        <a href="http://localhost:5173" className="brand-logo">
          Verify<span>SaaS</span>
        </a>

        <p>Confidence in every purchase.</p>
      </div>

      <div className="auth-container">

        <div className="auth-heading">
          <span className="eyebrow">WELCOME TO VERIFYSaaS</span>

          <h1>
            {isSignup
              ? "Create your account."
              : "Welcome back."}
          </h1>

          <p>
            {isSignup
              ? "Join us and help build trust in online shopping."
              : "Sign in to continue to your product review."}
          </p>
        </div>

        {sessionStorage.getItem("verifyHandoffToken") && (
          <div className="purchase-notice">
            <span>✓</span>
            Your DemoMart purchase is ready for verification.
          </div>
        )}

        <form onSubmit={submitForm} className="auth-form">

          {isSignup && (
            <div className="form-group">
              <label>Full name</label>

              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={updateField}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email address</label>

            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={updateField}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={updateField}
              minLength="8"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Account"
              : "Sign In"}
          </button>

        </form>

        <div className="auth-switch">
          {isSignup
            ? "Already have an account?"
            : "New to VerifySaaS?"}

          <button
            onClick={() => {
              navigate(isSignup ? "/login" : "/signup");
            }}
          >
            {isSignup ? "Sign in" : "Create an account"}
          </button>
        </div>

        <div className="auth-footer">
          VerifySaaS · Product authenticity and customer trust
        </div>

      </div>
    </div>
  );
}


// ==========================================
// PRODUCT REVIEW PAGE
// ==========================================

function ReviewPage({ token, user, onLogout }) {
  const { sessionId } = useParams();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerImage, setCustomerImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/handoff/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load review.");
        }

        setReview(data.reviewSession);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [sessionId, token]);


  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setCustomerImage(file);

    setPreviewImage(URL.createObjectURL(file));
  };


  if (loading) {
    return (
      <div className="loading-screen">
        Loading your product review...
      </div>
    );
  }

  if (error && !review) {
    return (
      <div className="loading-screen">
        <p>{error}</p>
      </div>
    );
  }

  if (!review) return null;

  const originalImage = review.listingImage.startsWith("http")
    ? review.listingImage
    : `${DEMOMART_URL}${review.listingImage}`;

  return (
    <div className="app-layout">

      <Sidebar onLogout={onLogout} />

      <main className="main-content">

        <div className="topbar">
          <div>
            <span className="eyebrow">PRODUCT VERIFICATION</span>
            <h2>Review your purchase</h2>
          </div>

          <div className="user-profile">
            <span className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </span>

            <span>{user?.name}</span>
          </div>
        </div>

        <div className="review-intro">
          <h1>Let's verify what you received.</h1>

          <p>
            Compare your purchased product with its original
            listing by uploading a photograph of the item.
          </p>
        </div>

        <div className="product-information">

          <div className="section-heading">
            <span className="step-number">01</span>

            <div>
              <h3>Purchase information</h3>
              <p>These details were retrieved from DemoMart.</p>
            </div>
          </div>

          <div className="product-card">

            <div className="listing-image">
              <img
                src={originalImage}
                alt={review.productName}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.png";
                }}
              />
              <span className="image-label">ORIGINAL LISTING</span>
            </div>

            <div className="product-details">

              <span className="product-category">
                {review.category}
              </span>

              <h2>{review.productName}</h2>

              <div className="detail-row">
                <span>Vendor</span>
                <strong>{review.vendorName}</strong>
              </div>

              <div className="detail-row">
                <span>Vendor ID</span>
                <strong>{review.vendorId}</strong>
              </div>

              <div className="detail-row">
                <span>Product ID</span>
                <strong>{review.sourceProductId}</strong>
              </div>

              <div className="detail-row">
                <span>Order reference</span>
                <strong>{review.sourceOrderId}</strong>
              </div>

              <div className="verified-badge">
                ✓ Purchase verified through DemoMart
              </div>

            </div>
          </div>

        </div>


        <div className="upload-section">

          <div className="section-heading">
            <span className="step-number">02</span>

            <div>
              <h3>Upload your product photograph</h3>
              <p>
                Show us the item you actually received.
              </p>
            </div>
          </div>

          <div className="upload-card">

            {!previewImage ? (

              <label className="upload-area">

                <div className="upload-icon">↑</div>

                <h3>Upload your photograph</h3>

                <p>
                  Click to browse or select an image from your device.
                </p>

                <span>PNG, JPG or JPEG · Maximum 5MB</span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />

              </label>

            ) : (

              <div className="uploaded-preview">

                <img
                  src={previewImage}
                  alt="Your uploaded product"
                />

                <div>
                  <h3>Photograph uploaded</h3>

                  <p>{customerImage?.name}</p>

                  <button
                    className="text-button"
                    onClick={() => {
                      setCustomerImage(null);
                      setPreviewImage("");
                    }}
                  >
                    Remove and upload another
                  </button>
                </div>

              </div>

            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              className="primary-button review-submit"
              disabled={!customerImage}
              onClick={() => {
                alert(
                  "Image uploaded successfully! AI comparison will be implemented in the next milestone."
                );
              }}
            >
              Submit for verification →
            </button>

            <p className="upload-note">
              Your photograph will be compared against the original listing.
            </p>

          </div>

        </div>

      </main>
    </div>
  );
}


// ==========================================
// SIDEBAR
// ==========================================

function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">

      <a href="/dashboard" className="brand-logo">
        Verify<span>SaaS</span>
      </a>

      <div className="sidebar-label">WORKSPACE</div>

      <nav className="sidebar-nav">

        <a href="/dashboard">⌂ &nbsp; Overview</a>

        <a href="/dashboard">▤ &nbsp; Product metrics</a>

        <a href="/dashboard">♧ &nbsp; Vendor metrics</a>

        <a href="/dashboard">◉ &nbsp; My contributions</a>

        <a href="/dashboard">✧ &nbsp; Rewards</a>

      </nav>

      <div className="sidebar-bottom">

        <div className="sidebar-label">ACCOUNT</div>

        <button onClick={onLogout}>
          ↪ &nbsp; Sign out
        </button>

      </div>

    </aside>
  );
}


// ==========================================
// DASHBOARD PLACEHOLDER
// ==========================================

function Dashboard({ user, onLogout }) {
  return (
    <div className="app-layout">

      <Sidebar onLogout={onLogout} />

      <main className="main-content">

        <div className="topbar">
          <div>
            <span className="eyebrow">YOUR WORKSPACE</span>
            <h2>Dashboard</h2>
          </div>

          <div className="user-profile">
            <span className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </span>

            {user?.name}
          </div>
        </div>

        <div className="dashboard-welcome">
          <span className="eyebrow">WELCOME BACK</span>

          <h1>Hello, {user?.name}.</h1>

          <p>
            Your contributions help make online shopping
            more transparent and trustworthy.
          </p>
        </div>

        <div className="dashboard-cards">

          <div className="dashboard-card">
            <span>PRODUCT REVIEWS</span>
            <h2>0</h2>
            <p>Products you've reviewed</p>
          </div>

          <div className="dashboard-card">
            <span>CONTRIBUTION POINTS</span>
            <h2>0</h2>
            <p>Your verification activity</p>
          </div>

          <div className="dashboard-card">
            <span>REWARDS</span>
            <h2>0</h2>
            <p>Coupons available to claim</p>
          </div>

        </div>

        <div className="coming-soon">
          <span className="eyebrow">YOUR ACTIVITY</span>

          <h2>Your verification journey starts here.</h2>

          <p>
            Once you review products, your activity,
            contributions and rewards will appear here.
          </p>

        </div>

      </main>
    </div>
  );
}


// ==========================================
// ROOT
// ==========================================

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}