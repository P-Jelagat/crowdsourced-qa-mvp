import { useState, useEffect } from "react";
import "./App.css";
import { vendors, products, productTypes } from "./data/products";

const API_URL = "http://localhost:5001";
const VERIFYSAAS_URL =
  import.meta.env.VITE_VERIFYSAAS_URL || "http://localhost:5174";

function App() {
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("demoMartCart")) || [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // ACCOUNT STATES
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("demoMartUser")) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("demoMartToken") || ""
  );

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ORDER STATES
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");

  // SAVE CART WHENEVER IT CHANGES
  useEffect(() => {
    localStorage.setItem("demoMartCart", JSON.stringify(cart));
  }, [cart]);

  // CHECK WHETHER THE STORED SESSION STILL HAS A TOKEN
  useEffect(() => {
    if (!token || !user) {
      localStorage.removeItem("demoMartToken");
      localStorage.removeItem("demoMartUser");
      setToken("");
      setUser(null);
    }
  }, []);

  // CART FUNCTIONS
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, amount) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + amount;

            return newQty > 0
              ? { ...item, quantity: newQty }
              : null;
          }

          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.id !== productId)
    );
  };

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartSubtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const formatPrice = (price) =>
    `KES ${Number(price).toLocaleString("en-KE")}`;

  const getCategoryProducts = (category) =>
    products.filter((product) => product.category === category);

  const scrollToCategory = (slug) => {
    document.getElementById(slug)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // ACCOUNT FUNCTIONS
  const handleAccountClick = () => {
    setIsAccountOpen(true);
    setShowOrderHistory(false);
    setAuthError("");
    setCheckoutMessage("");
  };

  const handleAuthInput = (e) => {
    const { name, value } = e.target;

    setAuthForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // SIGN UP AND LOG IN
  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    setAuthError("");
    setAuthLoading(true);

    try {
      const endpoint = isSignUp ? "signup" : "login";

      const response = await fetch(
        `${API_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: authForm.name,
            email: authForm.email,
            password: authForm.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Authentication failed."
        );
      }

      // SAVE USER AND TOKEN
      localStorage.setItem("demoMartToken", data.token);
      localStorage.setItem(
        "demoMartUser",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      setAuthForm({
        name: "",
        email: "",
        password: "",
      });

      setAuthError("");
      setShowOrderHistory(false);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // LOG OUT
  const handleLogout = () => {
    localStorage.removeItem("demoMartToken");
    localStorage.removeItem("demoMartUser");

    setToken("");
    setUser(null);

    setOrders([]);
    setShowOrderHistory(false);
    setIsAccountOpen(false);

    setAuthError("");
  };

  // GET ORDER HISTORY FROM MONGODB
  const fetchOrderHistory = async () => {
    if (!token) return;

    setOrdersLoading(true);
    setOrdersError("");
    setShowOrderHistory(true);

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Could not retrieve orders."
        );
      }

      setOrders(data);
    } catch (error) {
      setOrdersError(error.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  // TEMPORARY REVIEW BUTTON ACTION
const handleReviewProduct = async (item, orderId) => {
  try {
    if (!token || !user) {
      alert("Please sign in to DemoMart before reviewing a product.");
      return;
    }

    if (!orderId) {
      throw new Error("Order information is missing.");
    }

    if (!item || !item.productId) {
      throw new Error(
        "This order does not contain the product information required for a review."
      );
    }

    const response = await fetch(
      `${API_URL}/api/orders/${orderId}/review-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.productId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to start your product review."
      );
    }

    const destination = `${VERIFYSAAS_URL}/login?handoff=${encodeURIComponent(
      data.handoffToken
    )}`;

    window.location.assign(destination);

  } catch (error) {
    console.error("VerifySaaS review error:", error);
    alert(error.message);
  }
};

  // CHECKOUT
  const handleCheckout = async () => {
    setCheckoutMessage("");

    if (cart.length === 0) {
      setCheckoutMessage("Your shopping bag is empty.");
      return;
    }

    // REQUIRE LOGIN BEFORE CHECKOUT
    if (!token || !user) {
      setIsCartOpen(false);
      setIsAccountOpen(true);
      setShowOrderHistory(false);
      setAuthError("Please sign in or create an account before checkout.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const orderItems = cart.map((item) => ({
        productId: item.id,
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        name: item.name,
        category: item.category,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
      }));

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          total: cartSubtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Checkout failed."
        );
      }

      // CLEAR CART AFTER SUCCESSFUL ORDER
      setCart([]);

      setCheckoutMessage(
        `Your order ${data.orderId} has been placed successfully!`
      );

      setIsCartOpen(false);

      // REFRESH ORDER HISTORY
      const historyResponse = await fetch(
        `${API_URL}/api/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setOrders(historyData);
      }

      alert(
        `Thank you for shopping with DemoMart!\n\nYour order number is ${data.orderId}`
      );
    } catch (error) {
      setCheckoutMessage(error.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // PRODUCT CARD
  const renderProductCard = (product) => (
    <article className="product-card" key={product.id}>
      <div className="product-image">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <div className="image-placeholder">
            <span>Product photography</span>
          </div>
        )}

        <span className="product-badge">
          {product.vendorName}
        </span>

        <button
          className="quick-add"
          onClick={() => addToCart(product)}
          aria-label={`Add ${product.name} to bag`}
        >
          +
        </button>
      </div>

      <div className="product-info">
        <p className="product-vendor">{product.vendorName}</p>

        <h3>{product.name}</h3>

        <p className="product-description">
          {product.description}
        </p>

        <div className="product-bottom">
          <span>{formatPrice(product.price)}</span>

          <button onClick={() => addToCart(product)}>
            Add to bag +
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <div className="app">

      {/* NAVIGATION */}
      <header className="navbar">
        <a href="#" className="logo">
          Demo<span>Mart.</span>
        </a>

        <nav className="nav-links">
          <a href="#shop">Shop</a>
          <a href="#bestsellers">Bestsellers</a>
          <a href="#vendors">Collections</a>
          <a href="#gallery">Gallery</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          <div className="search-box">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
              ></line>
            </svg>

            <input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* ACCOUNT BUTTON */}
          <button
            className="icon-button account-button"
            aria-label="User account"
            onClick={handleAccountClick}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>

            {user && <span className="account-status-dot"></span>}
          </button>

          {/* CART BUTTON */}
          <button
            className="icon-button cart-button"
            aria-label="Shopping bag"
            onClick={() => setIsCartOpen(true)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>

            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main>

        {/* HERO */}
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">
              THOUGHTFULLY MADE. BEAUTIFULLY LIVED.
            </p>

            <h1>
              A little more
              <br />
              <em>art in everyday</em>
              <br />
              living.
            </h1>

            <p className="hero-description">
              Discover beautiful ceramics, timeless tableware
              and thoughtful pieces made to bring warmth
              and character into your home.
            </p>

            <a href="#shop" className="primary-button">
              Explore the collection <span>→</span>
            </a>
          </div>

          <div className="hero-note">
            <span>01 / 05</span>
            <p>
              Made with care.
              <br />
              Made to be loved.
            </p>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="categories-section" id="shop">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FIND YOUR FAVOURITES</p>
              <h2>Shop by category</h2>
            </div>

            <span className="text-link">
              Five collections. Fifty unique pieces.
            </span>
          </div>

          <div className="category-grid">
            {productTypes.map((type) => (
              <button
                className="category-card"
                key={type.slug}
                onClick={() => scrollToCategory(type.slug)}
              >
                <div className={`category-art ${type.slug}`}>
                  <span>{type.category}</span>
                </div>

                <div className="category-overlay">
                  <h3>{type.category}s</h3>
                  <span>Explore collection →</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* BESTSELLERS */}
        <section className="products-section" id="bestsellers">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE PIECES EVERYONE LOVES</p>
              <h2>Discover our collection</h2>
            </div>

            <span className="text-link">
              Selected pieces from our makers
            </span>
          </div>

          <div className="product-grid">
            {products.slice(0, 4).map(renderProductCard)}
          </div>
        </section>

        {/* VENDOR COLLECTIONS */}
        <section className="vendors-section" id="vendors">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MEET OUR MAKERS</p>
              <h2>Collections with character</h2>
            </div>

            <p className="section-description">
              Discover ten independent ceramic collections,
              each with its own distinctive style.
            </p>
          </div>

          <div className="vendor-grid">
            {vendors.map((vendor) => (
              <article className="vendor-card" key={vendor.id}>
                <span className="vendor-number">
                  {vendor.id}
                </span>

                <h3>{vendor.name}</h3>

                <p>{vendor.description}</p>

                <span className="vendor-style">
                  {vendor.style}
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* PRODUCT CATEGORY SECTIONS */}
        {productTypes.map((type) => {
          const categoryProducts = getCategoryProducts(type.category);

          const visibleProducts = categoryProducts.filter((product) =>
            `${product.name} ${product.vendorName}`
              .toLowerCase()
              .includes(search.toLowerCase())
          );

          return (
            <section
              className="products-section category-products"
              id={type.slug}
              key={type.slug}
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    EXPLORE OUR MAKERS
                  </p>

                  <h2>{type.category}s</h2>
                </div>

                <span className="text-link">
                  {categoryProducts.length} unique designs
                </span>
              </div>

              {visibleProducts.length > 0 ? (
                <div className="product-grid">
                  {visibleProducts.map(renderProductCard)}
                </div>
              ) : (
                <p className="no-products">
                  No matching products found in this collection.
                </p>
              )}
            </section>
          );
        })}

        {/* GALLERY */}
        <section className="gallery-section" id="gallery">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A LITTLE INSPIRATION</p>
              <h2>Made for your everyday</h2>
            </div>

            <p className="section-description">
              Beautiful pieces, thoughtful spaces and
              everyday moments.
            </p>
          </div>

          <div className="gallery-grid">
            <div className="gallery-item gallery-large">
              <img
                src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=900"
                alt="Ceramic homeware arrangement"
              />
            </div>

            <div className="gallery-item">
              <img
                src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=700"
                alt="Handcrafted ceramics"
              />
            </div>

            <div className="gallery-item">
              <img
                src="https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=700"
                alt="Ceramic vase"
              />
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="reviews-section">
          <p className="eyebrow">KIND WORDS</p>

          <h2>Loved by our community.</h2>

          <div className="review-grid">
            <article>
              <span className="stars">★★★★★</span>
              <p>
                "The quality is beautiful. My new favourite
                mug for slow mornings."
              </p>
              <small>— Sarah M.</small>
            </article>

            <article>
              <span className="stars">★★★★★</span>
              <p>
                "Exactly what I was looking for. Thoughtful,
                beautiful and unique."
              </p>
              <small>— Angela K.</small>
            </article>

            <article>
              <span className="stars">★★★★★</span>
              <p>
                "I love finding pieces that feel personal.
                Will definitely shop again."
              </p>
              <small>— Wanjiku N.</small>
            </article>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="footer" id="about">
        <div>
          <a href="#" className="logo">
            Demo<span>Mart.</span>
          </a>

          <p>
            Thoughtful ceramics for everyday living.
          </p>
        </div>

        <div className="footer-links">
          <a href="#shop">Shop</a>
          <a href="#vendors">Our Makers</a>
          <a href="#gallery">Gallery</a>
          <a href="#about">About</a>
        </div>

        <p className="copyright">
          © 2026 DemoMart. All rights reserved.
        </p>
      </footer>

      {/* CART DRAWER */}
      <div
        className={`cart-overlay-bg ${isCartOpen ? "open" : ""}`}
        onClick={() => setIsCartOpen(false)}
      >
        <div
          className="cart-sidebar"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cart-header">
            <h2>Your Bag ({cartCount})</h2>

            <button
              className="close-cart"
              onClick={() => setIsCartOpen(false)}
              aria-label="Close cart"
            >
              &times;
            </button>
          </div>

          <div className="cart-items-container">
            {cart.length === 0 ? (
              <p className="empty-cart-message">
                Your shopping bag is empty.
              </p>
            ) : (
              cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-img">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <span>Photography</span>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <p className="cart-item-vendor">
                      {item.vendorName}
                    </p>

                    <h4>{item.name}</h4>

                    <p className="cart-item-price">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        -
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="remove-item-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Subtotal</span>
                <strong>{formatPrice(cartSubtotal)}</strong>
              </div>

              {checkoutMessage && (
                <p className="checkout-message">
                  {checkoutMessage}
                </p>
              )}

              <button
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading
                  ? "Processing order..."
                  : "Secure Checkout"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ACCOUNT MODAL */}
      {isAccountOpen && (
        <div
          className="account-overlay"
          onClick={() => setIsAccountOpen(false)}
        >
          <div
            className="account-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="account-close"
              onClick={() => setIsAccountOpen(false)}
            >
              &times;
            </button>

            {!user ? (
              <>
                <p className="eyebrow">WELCOME TO DEMOMART</p>

                <h2>
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h2>

                <p className="account-description">
                  {isSignUp
                    ? "Create an account to enjoy a more personal shopping experience."
                    : "Sign in to access your account and order history."}
                </p>

                {authError && (
                  <p className="auth-error">{authError}</p>
                )}

                <form
                  className="account-form"
                  onSubmit={handleAuthSubmit}
                >
                  {isSignUp && (
                    <label>
                      Full name

                      <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        value={authForm.name}
                        onChange={handleAuthInput}
                        required
                      />
                    </label>
                  )}

                  <label>
                    Email address

                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={authForm.email}
                      onChange={handleAuthInput}
                      required
                    />
                  </label>

                  <label>
                    Password

                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={authForm.password}
                      onChange={handleAuthInput}
                      required
                      minLength="6"
                    />
                  </label>

                  <button
                    type="submit"
                    className="account-submit"
                    disabled={authLoading}
                  >
                    {authLoading
                      ? "Please wait..."
                      : isSignUp
                      ? "Create Account"
                      : "Sign In"}
                  </button>
                </form>

                <p className="account-switch">
                  {isSignUp
                    ? "Already have an account?"
                    : "Don't have an account?"}

                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setAuthError("");
                    }}
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </button>
                </p>
              </>
            ) : showOrderHistory ? (
              <>
                <p className="eyebrow">YOUR PURCHASES</p>

                <h2>Order history</h2>

                <button
                  className="back-account"
                  onClick={() => setShowOrderHistory(false)}
                >
                  ← Back to account
                </button>

                {ordersLoading ? (
                  <p className="order-message">
                    Loading your orders...
                  </p>
                ) : ordersError ? (
                  <p className="auth-error">{ordersError}</p>
                ) : orders.length === 0 ? (
                  <p className="order-message">
                    You haven't placed any orders yet.
                  </p>
                ) : (
                  <div className="order-list">
                    {orders.map((order) => (
                      <article
                        className="order-card"
                        key={order._id}
                      >
                        <div className="order-card-header">
                          <div>
                            <span>ORDER NUMBER</span>
                            <h3>{order.orderId}</h3>
                          </div>

                          <span className="order-status">
                            Completed
                          </span>
                        </div>

                        <p className="order-date">
                          {order.date}
                        </p>

                        <div className="order-products">
                          {order.items.map((item, index) => (
                            <div
                              className="order-product"
                              key={`${order._id}-${index}`}
                            >
                              <div className="order-product-details">
                                <h4>{item.name}</h4>

                                <span>
                                  Quantity: {item.quantity}
                                </span>
                              </div>

                              <div className="order-product-actions">
                                <strong>
                                  {formatPrice(
                                    item.pricePaid * item.quantity
                                  )}
                                </strong>

{item.reviewed ? (
  <button
    type="button"
    className="review-product-btn"
    disabled
    style={{
      opacity: 0.55,
      cursor: "not-allowed",
      backgroundColor: "#dce5dc",
      color: "#526b52",
    }}
  >
    Review completed ✓
  </button>
) : (
  <button
    type="button"
    className="review-product-btn"
    onClick={() =>
      handleReviewProduct(item, order.orderId)
    }
  >
    Review on VerifySaaS →
  </button>
)}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="order-total">
                          <span>Order total</span>
                          <strong>
                            {formatPrice(order.subtotal)}
                          </strong>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="eyebrow">YOUR ACCOUNT</p>

                <h2>Hello, {user.name}.</h2>

                <p className="account-description">
                  {user.email}
                </p>

                <div className="account-actions">
                  <button
                    className="account-submit"
                    onClick={fetchOrderHistory}
                  >
                    View Order History
                  </button>

                  <button
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;