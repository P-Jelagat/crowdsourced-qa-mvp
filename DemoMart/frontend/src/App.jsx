import { useState } from "react";
import "./App.css";
import { vendors, products, productTypes } from "./data/products";

function App() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Calculate total item count dynamically
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);


  const formatPrice = (price) =>
    `KES ${price.toLocaleString("en-KE")}`;

  const getCategoryProducts = (category) =>
    products.filter((product) => product.category === category);

  // const filteredProducts = products.filter((product) =>
  //   `${product.name} ${product.vendorName} ${product.category}`
  //     .toLowerCase()
  //     .includes(search.toLowerCase())
  // );

  const scrollToCategory = (slug) => {
    document.getElementById(slug)?.scrollIntoView({
      behavior: "smooth",
    });
  };

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
            {/* Clean search icon overlay */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>

            <input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Account Icon */}
          <button
            className="icon-button"
            aria-label="User account"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </button>

          {/* Cart/Bag Icon */}
          <button
            className="icon-button cart-button"
            aria-label="Shopping bag"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
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

        {/* FIVE PRODUCT CATEGORY SECTIONS */}
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

    </div>
  );
}

export default App;