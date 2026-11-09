import { useState, useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
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
      const response = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      localStorage.setItem("verifyToken", data.token);
      localStorage.setItem("verifyUser", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

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
    const response = await fetch(`${API_URL}/api/handoff/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        handoffToken,
      }),
    });

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
        element={
          <Navigate
            to={token ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPage
              mode="login"
              onSubmit={handleAuth}
              loading={loading}
              error={error}
            />
          )
        }
      />

      <Route
        path="/signup"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPage
              mode="signup"
              onSubmit={handleAuth}
              loading={loading}
              error={error}
            />
          )
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
            <MetricsPage
              section="overview"
              user={user}
              token={token}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/products"
        element={
          token ? (
            <MetricsPage
              section="products"
              user={user}
              token={token}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/vendors"
        element={
          token ? (
            <MetricsPage
              section="vendors"
              user={user}
              token={token}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/contributions"
        element={
          token ? (
            <MetricsPage
              section="contributions"
              user={user}
              token={token}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/rewards"
        element={
          token ? (
            <MetricsPage
              section="rewards"
              user={user}
              token={token}
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
        <a href={DEMOMART_URL} className="brand-logo">
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
  const [isComparing, setIsComparing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);

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

        if (data.reviewSession.status === "completed") {
          setReviewResult(data.reviewSession.reviewResult || null);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [sessionId, token]);

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setCustomerImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const submitForComparison = async () => {
    if (!customerImage || !review || review.status === "completed") {
      return;
    }

    setIsComparing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("customerImage", customerImage);

      const response = await fetch(
        `${API_URL}/api/handoff/${sessionId}/compare`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Comparison failed.");
      }

      setReviewResult(data.reviewResult);
      setReview((current) => ({
        ...current,
        status: "completed",
      }));

    } catch (err) {
      setError(err.message);
    } finally {
      setIsComparing(false);
    }
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

  const tierDetails = {
    very_low: {
      title: "Very low visual match",
      description:
        "The customer photograph shows significant visible differences from the original listing.",
      symbol: "!",
      className: "result-low",
    },

    somewhat_similar: {
      title: "Somewhat similar",
      description:
        "Some features appear consistent, but there are noticeable differences or limitations.",
      symbol: "≈",
      className: "result-medium",
    },

    almost_identical: {
      title: "Almost identical",
      description:
        "The main visible design features appear highly consistent with the original listing.",
      symbol: "✓",
      className: "result-high",
    },
  };

  const tier = reviewResult
    ? tierDetails[reviewResult.tier]
    : null;

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
            Compare your purchased product with its original listing
            by uploading a photograph of the item.
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

              <span className="image-label">
                ORIGINAL LISTING
              </span>
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
              <p>Show us the item you actually received.</p>
            </div>
          </div>

          <div className="upload-card">

            {review.status === "completed" ? (
              <div className="completed-notice">
                <span className="completed-check">✓</span>

                <div>
                  <h3>Review submitted successfully</h3>

                  <p>
                    This purchased item has already been reviewed.
                    You cannot submit another comparison for it.
                  </p>
                </div>
              </div>
            ) : !previewImage ? (
              <label className="upload-area">

                <div className="upload-icon">↑</div>

                <h3>Upload your photograph</h3>

                <p>
                  Click to browse or select an image from your device.
                </p>

                <span>JPG, PNG or WEBP · Maximum 5MB</span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
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
                    disabled={isComparing}
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

            {review.status !== "completed" && (
              <button
                className="primary-button review-submit"
                disabled={!customerImage || isComparing}
                onClick={submitForComparison}
              >
                {isComparing ? (
                  <>
                    <span className="button-spinner" />
                    Comparing photographs...
                  </>
                ) : (
                  "Submit for verification →"
                )}
              </button>
            )}

            <p className="upload-note">
              AI checks visible similarities and differences.
              It cannot prove authenticity or product quality.
            </p>

          </div>
        </div>

        {reviewResult && tier && (
          <section className={`comparison-result ${tier.className}`}>

            <span className="eyebrow">
              AI COMPARISON RESULT
            </span>

            <div className="result-heading">

              <span className="result-symbol">
                {tier.symbol}
              </span>

              <div>
                <h2>{tier.title}</h2>
                <p>{tier.description}</p>
              </div>

            </div>

            <p className="result-summary">
              {reviewResult.summary}
            </p>

            {reviewResult.differences?.length > 0 && (
              <div className="result-differences">

                <h3>Visible differences / observations</h3>

                <ul>
                  {reviewResult.differences.map((difference, index) => (
                    <li key={index}>{difference}</li>
                  ))}
                </ul>

              </div>
            )}

            <p className="result-disclaimer">
              This is an AI-assisted visual assessment based on
              the two submitted photographs, not a guarantee
              of authenticity or quality.
            </p>

            <button
              className="secondary-button"
              onClick={() => window.location.href = "/dashboard"}
            >
              Go to my dashboard →
            </button>

          </section>
        )}

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

      <NavLink to="/dashboard" className="brand-logo">
        Verify<span>SaaS</span>
      </NavLink>

      <div className="sidebar-label">
        WORKSPACE
      </div>

      <nav className="sidebar-nav">

        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) => isActive ? "active" : ""}
        >
          ⌂ &nbsp; Overview
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) => isActive ? "active" : ""}
        >
          ▤ &nbsp; Product metrics
        </NavLink>

        <NavLink
          to="/vendors"
          className={({ isActive }) => isActive ? "active" : ""}
        >
          ♧ &nbsp; Vendor metrics
        </NavLink>

        <NavLink
          to="/contributions"
          className={({ isActive }) => isActive ? "active" : ""}
        >
          ◉ &nbsp; My contributions
        </NavLink>

        <NavLink
          to="/rewards"
          className={({ isActive }) => isActive ? "active" : ""}
        >
          ✧ &nbsp; Rewards
        </NavLink>

      </nav>

      <div className="sidebar-bottom">

        <div className="sidebar-label">
          ACCOUNT
        </div>

        <button onClick={onLogout}>
          ↪ &nbsp; Sign out
        </button>

      </div>

    </aside>
  );
}


// ==========================================
// METRICS PAGE
// ==========================================

function MetricsPage({ section, user, token, onLogout }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(null);
  const [claimMessage, setClaimMessage] = useState("");

  const fetchMetrics = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/metrics/overview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to retrieve dashboard information."
        );
      }

      setMetrics(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [token]);

  const claimReward = async (milestone) => {
    setClaiming(milestone);
    setClaimMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/metrics/rewards/${milestone}/claim`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to claim reward.");
      }

      setClaimMessage(data.message || "Reward claimed successfully.");

      await fetchMetrics();

    } catch (err) {
      setError(err.message);
    } finally {
      setClaiming(null);
    }
  };

  const pageDetails = {
    overview: {
      eyebrow: "YOUR WORKSPACE",
      title: "Dashboard",
    },

    products: {
      eyebrow: "PLATFORM INSIGHTS",
      title: "Product metrics",
    },

    vendors: {
      eyebrow: "PLATFORM INSIGHTS",
      title: "Vendor metrics",
    },

    contributions: {
      eyebrow: "YOUR ACTIVITY",
      title: "My contributions",
    },

    rewards: {
      eyebrow: "YOUR ACHIEVEMENTS",
      title: "Rewards",
    },
  };

  const page = pageDetails[section];

  return (
    <div className="app-layout">

      <Sidebar onLogout={onLogout} />

      <main className="main-content">

        <div className="topbar">

          <div>
            <span className="eyebrow">
              {page.eyebrow}
            </span>

            <h2>{page.title}</h2>
          </div>

          <div className="user-profile">

            <span className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </span>

            <span>{user?.name}</span>

          </div>

        </div>

        {loading ? (
          <div className="metrics-loading">
            <span className="button-spinner dark-spinner" />
            Loading your dashboard...
          </div>
        ) : error && !metrics ? (
          <div className="metrics-error">
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>

            <button
              className="primary-button retry-button"
              onClick={fetchMetrics}
            >
              Try again
            </button>
          </div>
        ) : metrics ? (
          <>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {claimMessage && (
              <div className="success-message">
                ✓ {claimMessage}
              </div>
            )}

            {section === "overview" && (
              <OverviewSection
                metrics={metrics}
                user={user}
              />
            )}

            {section === "products" && (
              <ProductsSection
                products={metrics.products || []}
              />
            )}

            {section === "vendors" && (
              <VendorsSection
                vendors={metrics.vendors || []}
              />
            )}

            {section === "contributions" && (
              <ContributionsSection
                contributions={metrics.contributions}
                rewards={metrics.rewards || []}
              />
            )}

            {section === "rewards" && (
              <RewardsSection
                rewards={metrics.rewards || []}
                totalReviews={metrics.contributions?.totalReviews || 0}
                onClaim={claimReward}
                claiming={claiming}
              />
            )}

          </>
        ) : null}

      </main>
    </div>
  );
}


// ==========================================
// OVERVIEW
// ==========================================

function OverviewSection({ metrics, user }) {
  const contributions = metrics.contributions || {};
  const rewards = metrics.rewards || [];

  const totalReviews = contributions.totalReviews || 0;
  const points = contributions.contributionPoints || 0;

  const availableRewards = rewards.filter(
    (reward) => reward.unlocked && !reward.claimed
  ).length;

  const nextMilestone = rewards.find(
    (reward) => !reward.unlocked
  );

  const recentReviews = (contributions.reviews || []).slice(0, 5);

  return (
    <>

      <div className="dashboard-welcome">

        <span className="eyebrow">
          WELCOME BACK
        </span>

        <h1>Hello, {user?.name}.</h1>

        <p>
          Your contributions help make online shopping
          more transparent and trustworthy.
        </p>

      </div>

      <div className="dashboard-cards">

        <div className="dashboard-card">
          <span>PRODUCT REVIEWS</span>
          <h2>{totalReviews}</h2>
          <p>Products you've reviewed</p>
        </div>

        <div className="dashboard-card">
          <span>CONTRIBUTION POINTS</span>
          <h2>{points}</h2>
          <p>10 points per completed review</p>
        </div>

        <div className="dashboard-card">
          <span>AVAILABLE REWARDS</span>
          <h2>{availableRewards}</h2>
          <p>Unlocked coupons waiting to be claimed</p>
        </div>

      </div>

      <div className="overview-grid">

        <section className="content-panel">

          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR ACTIVITY</span>
              <h2>Recent reviews</h2>
            </div>

            <NavLink to="/contributions">
              View all →
            </NavLink>
          </div>

          {recentReviews.length === 0 ? (
            <EmptyState
              title="Your verification journey starts here."
              description="Your completed product reviews will appear here."
            />
          ) : (
            <div className="activity-list">

              {recentReviews.map((review) => (
                <div className="activity-item" key={review.id}>

                  <div className="activity-icon">
                    ✓
                  </div>

                  <div className="activity-details">
                    <h3>{review.productName}</h3>
                    <p>{review.vendorName}</p>
                  </div>

                  <TierBadge tier={review.tier} />

                </div>
              ))}

            </div>
          )}

        </section>

        <section className="content-panel milestone-panel">

          <span className="eyebrow">
            YOUR NEXT ACHIEVEMENT
          </span>

          {nextMilestone ? (
            <>
              <h2>{nextMilestone.title}</h2>

              <p>{nextMilestone.description}</p>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      (totalReviews / nextMilestone.milestone) * 100
                    )}%`,
                  }}
                />
              </div>

              <p className="progress-caption">
                {totalReviews} of {nextMilestone.milestone} reviews completed
              </p>

              <NavLink
                to="/rewards"
                className="secondary-button"
              >
                Explore rewards →
              </NavLink>
            </>
          ) : (
            <>
              <h2>All milestones unlocked!</h2>

              <p>
                Congratulations. You've reached every available
                demonstration reward milestone.
              </p>

              <NavLink
                to="/rewards"
                className="secondary-button"
              >
                View your rewards →
              </NavLink>
            </>
          )}

        </section>

      </div>

      <div className="dashboard-note">
        <span>✧</span>
        Your reviews contribute to product and vendor insights
        across the VerifySaaS platform.
      </div>

    </>
  );
}


// ==========================================
// PRODUCT METRICS
// ==========================================

function ProductsSection({ products }) {
  return (
    <>

      <div className="section-intro">
        <h1>Product comparison rankings</h1>

        <p>
          Explore how similar product listings compare across
          vendors using completed customer reviews.
        </p>
      </div>

      <div className="metrics-explanation">
        <strong>How rankings work:</strong> Each review contributes
        a visual similarity score. Higher average scores appear
        higher in the ranking.
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No product metrics yet."
          description="Completed customer reviews will generate product rankings here."
        />
      ) : (
        <div className="ranking-list">

          {products.map((product) => (
            <div className="ranking-card" key={`${product.productName}-${product.category}`}>

              <div className="rank-number">
                #{product.rank}
              </div>

              <div className="ranking-image">
                {product.listingImage ? (
                  <img
                    src={
                      product.listingImage.startsWith("http")
                        ? product.listingImage
                        : `${DEMOMART_URL}${product.listingImage}`
                    }
                    alt={product.productName}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span>◇</span>
                )}
              </div>

              <div className="ranking-information">

                <span className="product-category">
                  {product.category}
                </span>

                <h3>{product.productName}</h3>

                <p>
                  {product.totalReviews} completed review(s)
                </p>

                <div className="vendor-tags">
                  {product.vendors?.map((vendor) => (
                    <span key={vendor}>{vendor}</span>
                  ))}
                </div>

              </div>

              <div className="ranking-score">
                <strong>{product.averageScore} / 3</strong>

                <span>Average score</span>

                <ScoreBar score={product.averageScore} />

              </div>

            </div>
          ))}

        </div>
      )}

    </>
  );
}


// ==========================================
// VENDOR METRICS
// ==========================================

function VendorsSection({ vendors }) {
  return (
    <>

      <div className="section-intro">
        <h1>Vendor performance</h1>

        <p>
          Compare vendor performance using customer-submitted
          visual comparison results.
        </p>
      </div>

      <div className="metrics-explanation">
        Vendor scores represent the average visual similarity
        scores of their reviewed products.
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          title="No vendor metrics yet."
          description="Vendor performance will appear once customers complete reviews."
        />
      ) : (
        <div className="table-wrapper">

          <table className="metrics-table">

            <thead>
              <tr>
                <th>RANK</th>
                <th>VENDOR</th>
                <th>PRODUCTS</th>
                <th>REVIEWS</th>
                <th>AVERAGE SCORE</th>
              </tr>
            </thead>

            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.vendorId}>

                  <td>
                    <span className="table-rank">
                      #{vendor.rank}
                    </span>
                  </td>

                  <td>
                    <strong>{vendor.vendorName}</strong>
                    <small>{vendor.vendorId}</small>
                  </td>

                  <td>{vendor.totalProducts}</td>

                  <td>{vendor.totalReviews}</td>

                  <td>
                    <div className="table-score">
                      <strong>{vendor.averageScore} / 3</strong>
                      <ScoreBar score={vendor.averageScore} />
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>
      )}

    </>
  );
}


// ==========================================
// MY CONTRIBUTIONS
// ==========================================

function ContributionsSection({ contributions, rewards }) {
  const totalReviews = contributions?.totalReviews || 0;
  const points = contributions?.contributionPoints || 0;
  const averageScore = contributions?.averageScore || 0;

  const nextMilestone = rewards.find(
    (reward) => !reward.unlocked
  );

  return (
    <>

      <div className="section-intro">
        <h1>Your contribution journey</h1>

        <p>
          Every completed review helps build a more transparent
          shopping experience.
        </p>
      </div>

      <div className="dashboard-cards">

        <div className="dashboard-card">
          <span>COMPLETED REVIEWS</span>
          <h2>{totalReviews}</h2>
          <p>Your verified product comparisons</p>
        </div>

        <div className="dashboard-card">
          <span>POINTS EARNED</span>
          <h2>{points}</h2>
          <p>10 points per review</p>
        </div>

        <div className="dashboard-card">
          <span>AVERAGE MATCH SCORE</span>
          <h2>{averageScore} / 3</h2>
          <p>Across your submitted reviews</p>
        </div>

      </div>

      {nextMilestone && (
        <section className="content-panel contribution-progress">

          <span className="eyebrow">
            NEXT REWARD MILESTONE
          </span>

          <h2>{nextMilestone.title}</h2>

          <p>
            Complete {nextMilestone.milestone} reviews
            to unlock a {nextMilestone.discountPercent}% demonstration coupon.
          </p>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(
                  100,
                  (totalReviews / nextMilestone.milestone) * 100
                )}%`,
              }}
            />
          </div>

          <p className="progress-caption">
            {totalReviews} / {nextMilestone.milestone} reviews
          </p>

        </section>
      )}

      <section className="content-panel">

        <div className="panel-heading">
          <div>
            <span className="eyebrow">REVIEW HISTORY</span>
            <h2>Your completed reviews</h2>
          </div>
        </div>

        {!contributions?.reviews?.length ? (
          <EmptyState
            title="You haven't submitted a review yet."
            description="Your completed product comparisons will be listed here."
          />
        ) : (
          <div className="activity-list">

            {contributions.reviews.map((review) => (
              <div className="activity-item" key={review.id}>

                <div className="activity-icon">
                  ✓
                </div>

                <div className="activity-details">
                  <h3>{review.productName}</h3>
                  <p>
                    {review.vendorName} · {formatDate(review.comparedAt)}
                  </p>
                </div>

                <TierBadge tier={review.tier} />

              </div>
            ))}

          </div>
        )}

      </section>

    </>
  );
}


// ==========================================
// REWARDS
// ==========================================

function RewardsSection({
  rewards,
  totalReviews,
  onClaim,
  claiming,
}) {
  return (
    <>

      <div className="section-intro">
        <h1>Your contributions deserve recognition.</h1>

        <p>
          Complete product reviews to unlock demonstration
          coupons and celebrate your contribution milestones.
        </p>
      </div>

      <div className="reward-summary">
        <div>
          <span className="eyebrow">YOUR REVIEWS</span>
          <h2>{totalReviews}</h2>
        </div>

        <div>
          <span className="eyebrow">AVAILABLE MILESTONES</span>
          <h2>{rewards.filter((r) => r.unlocked).length} / {rewards.length}</h2>
        </div>
      </div>

      <div className="rewards-grid">

        {rewards.map((reward) => (
          <div
            className={`reward-card ${
              reward.unlocked ? "reward-unlocked" : "reward-locked"
            }`}
            key={reward.milestone}
          >

            <div className="reward-icon">
              {reward.claimed ? "✓" : reward.unlocked ? "✧" : "◇"}
            </div>

            <span className="eyebrow">
              {reward.unlocked
                ? reward.claimed
                  ? "REWARD CLAIMED"
                  : "REWARD UNLOCKED"
                : "LOCKED MILESTONE"}
            </span>

            <h2>{reward.title}</h2>

            <div className="reward-discount">
              {reward.discountPercent}%
            </div>

            <h3>Demonstration coupon</h3>

            <p>{reward.description}</p>

            {!reward.unlocked ? (
              <button
                className="reward-button disabled-reward"
                disabled
              >
                Complete {reward.milestone} reviews to unlock
              </button>
            ) : reward.claimed ? (
              <div className="coupon-display">

                <span>YOUR COUPON CODE</span>

                <strong>{reward.couponCode}</strong>

                <p>
                  This is a demonstration coupon for the VerifySaaS MVP.
                </p>

              </div>
            ) : (
              <button
                className="reward-button"
                disabled={claiming === reward.milestone}
                onClick={() => onClaim(reward.milestone)}
              >
                {claiming === reward.milestone
                  ? "Claiming..."
                  : "Claim your reward →"}
              </button>
            )}

          </div>
        ))}

      </div>

      <div className="dashboard-note">
        <span>✧</span>
        These coupons demonstrate the VerifySaaS rewards system.
        They are stored in your account and are not redeemable
        on DemoMart.
      </div>

    </>
  );
}


// ==========================================
// SHARED COMPONENTS
// ==========================================

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">

      <div className="empty-icon">◇</div>

      <h3>{title}</h3>

      <p>{description}</p>

    </div>
  );
}


function TierBadge({ tier }) {
  const labels = {
    very_low: "Very low match",
    somewhat_similar: "Somewhat similar",
    almost_identical: "Almost identical",
  };

  return (
    <span className={`tier-badge tier-${tier || "unknown"}`}>
      {labels[tier] || "Not available"}
    </span>
  );
}


function ScoreBar({ score }) {
  const percentage = Math.min(
    100,
    Math.max(0, (Number(score) / 3) * 100)
  );

  return (
    <div className="score-track">
      <div
        className="score-fill"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}


function formatDate(date) {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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