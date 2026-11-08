import { useState } from "react";
import "./App.css";

const products = [
  {
    id: 1,
    name: "Sage Ceramic Travel Mug",
    category: "Drinkware",
    price: 1850,
    vendor: "Clay & Co.",
    badge: "Bestseller",
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700",
  },
  {
    id: 2,
    name: "Handcrafted Ceramic Bowl",
    category: "Tableware",
    price: 2200,
    vendor: "Earth Studio",
    badge: "Popular",
    image:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=700",
  },
  {
    id: 3,
    name: "Minimalist Ceramic Vase",
    category: "Decor",
    price: 2800,
    vendor: "Terra Home",
    badge: "New",
    image:
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=700",
  },
  {
    id: 4,
    name: "Handmade Ceramic Plate Set",
    category: "Tableware",
    price: 3500,
    vendor: "The Pottery Room",
    badge: "Bestseller",
    image:
      "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?w=700",
  },
];

const categories = [
  {
    name: "Drinkware",
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600",
  },
  {
    name: "Tableware",
    image:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600",
  },
  {
    name: "Vases & Decor",
    image:
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600",
  },
  {
    name: "Kitchenware",
    image:
      "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?w=600",
  },
];

function App() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cartCount, setCartCount] = useState(0);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "All" ||
      product.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price) =>
    `KES ${price.toLocaleString("en-KE")}`;

  return (
    <div className="app">

      {/* NAVIGATION */}
      <header className="navbar">
        <a href="#" className="logo">Demo<span>Mart.</span></a>

        <nav className="nav-links">
          <a href="#shop">Shop</a>
          <a href="#bestsellers">Bestsellers</a>
          <a href="#gallery">Gallery</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          <div className="search-box">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="icon-button" aria-label="Account">
            ♙
          </button>

          <button className="icon-button cart-button" aria-label="Shopping bag">
            ♧
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main>

        {/* HERO */}
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">THOUGHTFULLY MADE. BEAUTIFULLY LIVED.</p>

            <h1>
              A little more
              <br />
              <em>art in everyday</em>
              <br />
              living.
            </h1>

            <p className="hero-description">
              Discover beautiful handmade ceramics, timeless
              tableware and thoughtful pieces made for your home.
            </p>

            <a href="#shop" className="primary-button">
              Explore the collection <span>→</span>
            </a>
          </div>

          <div className="hero-note">
            <span>01 / 04</span>
            <p>Made with care.<br />Made to be loved.</p>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="categories-section" id="shop">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FIND YOUR FAVOURITES</p>
              <h2>Shop by category</h2>
            </div>

            <a href="#bestsellers" className="text-link">
              Explore everything →
            </a>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <button
                className="category-card"
                key={category.name}
                onClick={() =>
                  setActiveCategory(
                    category.name === "Vases & Decor"
                      ? "Decor"
                      : category.name === "Kitchenware"
                      ? "Tableware"
                      : category.name
                  )
                }
              >
                <img src={category.image} alt={category.name} />
                <div className="category-overlay">
                  <h3>{category.name}</h3>
                  <span>Explore →</span>
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
              <h2>Our bestsellers</h2>
            </div>

            <a href="#shop" className="text-link">
              View all products →
            </a>
          </div>

          <div className="filter-buttons">
            {["All", "Drinkware", "Tableware", "Decor"].map((category) => (
              <button
                key={category}
                className={
                  activeCategory === category ? "filter active" : "filter"
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image">
                    <img src={product.image} alt={product.name} />
                    <span className="product-badge">{product.badge}</span>
                    <button
                      className="quick-add"
                      onClick={() => setCartCount(cartCount + 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="product-info">
                    <p className="product-vendor">{product.vendor}</p>
                    <h3>{product.name}</h3>

                    <div className="product-bottom">
                      <span>{formatPrice(product.price)}</span>
                      <button
                        onClick={() => setCartCount(cartCount + 1)}
                      >
                        Add to bag +
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="no-products">
                No products found. Try another search.
              </p>
            )}
          </div>
        </section>

        {/* PROMOTIONAL SECTION */}
        <section className="feature-section" id="about">
          <div className="feature-image"></div>

          <div className="feature-content">
            <p className="eyebrow">THE BEAUTY OF HANDMADE</p>
            <h2>
              Everyday objects.
              <br />
              <em>Extraordinary details.</em>
            </h2>

            <p>
              From your morning coffee to dinner with friends,
              discover ceramics that make ordinary moments feel special.
              Explore collections from independent makers and ceramic
              studios.
            </p>

            <a href="#shop" className="primary-button">
              Discover our collection →
            </a>
          </div>
        </section>

        {/* GALLERY */}
        <section className="gallery-section" id="gallery">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A LITTLE INSPIRATION</p>
              <h2>Made for your everyday</h2>
            </div>

            <p className="gallery-description">
              Beautiful pieces, thoughtful spaces and everyday moments.
            </p>
          </div>

          <div className="gallery-grid">
            <img
              src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=700"
              alt="Ceramic homeware"
            />
            <img
              src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=700"
              alt="Home decor inspiration"
            />
            <img
              src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=700"
              alt="Handmade pottery"
            />
            <img
              src="https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=700"
              alt="Ceramic vase"
            />
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
                "The quality is beautiful. My new favourite mug
                for slow mornings."
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
      <footer className="footer">
        <div>
          <a href="#" className="logo">Demo<span>Mart.</span></a>
          <p>Thoughtful ceramics for everyday living.</p>
        </div>

        <div className="footer-links">
          <a href="#shop">Shop</a>
          <a href="#bestsellers">Bestsellers</a>
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