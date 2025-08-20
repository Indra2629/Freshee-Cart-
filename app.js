// Aurora Shop - Rich Frontend Demo (Vanilla JS)
// UX features: search, sorting, filtering, wishlist, cart drawer, modal, toasts, theme toggle, keyboard shortcuts, persist state

(function(){
  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  const STORAGE_KEYS = {
    THEME: 'aurora.theme',
    CART: 'aurora.cart',
    WISHLIST: 'aurora.wishlist'
  };

  // Currency (display values are converted from USD → INR)
  const currency = { code: 'INR', locale: 'en-IN', rateFromUSD: 83 };

  const state = {
    products: [],
    cart: new Map(), // productId -> {product, qty}
    wishlist: new Set(),
    filters: {
      query: '',
      category: 'all',
      maxPrice: 1000,
      sortBy: 'featured',
    },
  };

  // Demo product data (can be replaced with API)
  const demoProducts = [
    { id: 'p1', name: 'Aurora Headphones', brand: 'Aural', category: 'Audio', price: 199, rating: 4.7, reviews: 321, image: 'https://images.unsplash.com/photo-1518443895914-6f7f41cab707?q=80&w=1200&auto=format&fit=crop', badge: 'Bestseller', createdAt: 20240117 },
    { id: 'p2', name: 'Nebula Smartwatch', brand: 'Orion', category: 'Wearables', price: 249, rating: 4.5, reviews: 201, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop', badge: 'New', createdAt: 20250301 },
    { id: 'p3', name: 'Lumen Desk Lamp', brand: 'Lumo', category: 'Home', price: 89, rating: 4.6, reviews: 96, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1200&auto=format&fit=crop', badge: 'Eco', createdAt: 20240102 },
    { id: 'p4', name: 'Eclipse Backpack', brand: 'Traverse', category: 'Accessories', price: 129, rating: 4.4, reviews: 58, image: 'https://images.unsplash.com/photo-1500043357865-c6b8827edfef?q=80&w=1200&auto=format&fit=crop', badge: 'Limited', createdAt: 20240210 },
    { id: 'p5', name: 'Quanta Keyboard', brand: 'Keystone', category: 'Computers', price: 139, rating: 4.8, reviews: 413, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop', badge: 'Bestseller', createdAt: 20240312 },
    { id: 'p6', name: 'Prism Water Bottle', brand: 'Kaya', category: 'Outdoors', price: 29, rating: 4.3, reviews: 40, image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=1200&auto=format&fit=crop', badge: 'Sustainable', createdAt: 20240120 },
    { id: 'p7', name: 'Halo Bluetooth Speaker', brand: 'Aural', category: 'Audio', price: 99, rating: 4.2, reviews: 151, image: 'https://images.unsplash.com/photo-1495305379050-64540d6ee95d?q=80&w=1200&auto=format&fit=crop', badge: 'Hot', createdAt: 20240220 },
    { id: 'p8', name: 'Nimbus Running Shoes', brand: 'Stride', category: 'Fashion', price: 159, rating: 4.6, reviews: 273, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop', badge: 'New', createdAt: 20250305 },
    { id: 'p9', name: 'Polar Jacket', brand: 'Traverse', category: 'Fashion', price: 189, rating: 4.1, reviews: 87, image: 'https://images.unsplash.com/photo-1520975922284-85d211f31386?q=80&w=1200&auto=format&fit=crop', badge: 'Winter', createdAt: 20231111 },
    { id: 'p10', name: 'Flux Wireless Mouse', brand: 'Keystone', category: 'Computers', price: 69, rating: 4.4, reviews: 189, image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?q=80&w=1200&auto=format&fit=crop', badge: 'Ergonomic', createdAt: 20240109 },
    { id: 'p11', name: 'Zen Yoga Mat', brand: 'Flow', category: 'Sports', price: 49, rating: 4.5, reviews: 74, image: 'https://images.unsplash.com/photo-1526401485004-2fda9f4a4eb3?q=80&w=1200&auto=format&fit=crop', badge: 'Eco', createdAt: 20230622 },
    { id: 'p12', name: 'Drift Sunglasses', brand: 'Sunhaus', category: 'Accessories', price: 119, rating: 4.0, reviews: 32, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1200&auto=format&fit=crop', badge: 'UV400', createdAt: 20240515 },
  ];

  // Elements
  const el = {
    search: $('#searchInput'),
    category: $('#categoryFilter'),
    priceRange: $('#priceRange'),
    priceLabel: $('#priceRangeLabel'),
    sortBy: $('#sortBy'),
    clearFilters: $('#clearFilters'),
    productsGrid: $('#productsGrid'),
    wishlistBtn: $('#wishlistBtn'),
    wishlistCount: $('#wishlistCount'),
    cartBtn: $('#cartBtn'),
    cartCount: $('#cartCount'),
    cartDrawer: $('#cartDrawer'),
    cartItems: $('#cartItems'),
    cartSubtotal: $('#cartSubtotal'),
    closeCart: $('#closeCart'),
    checkoutBtn: $('#checkoutBtn'),
    themeToggle: $('#themeToggle'),
    heroExplore: $('#exploreBtn'),
    surpriseBtn: $('#surpriseBtn'),
    modal: $('#productModal'),
    modalBody: $('#modalBody'),
    closeModal: $('#closeModal'),
    year: $('#year'),
    backdrop: $('#backdrop'),
    toastContainer: $('#toastContainer'),
  };

  // Utilities
  const money = (usdAmount) => new Intl.NumberFormat(currency.locale, { style: 'currency', currency: currency.code, maximumFractionDigits: 2 }).format(usdAmount * currency.rateFromUSD);
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  // Theme
  function initTheme(){
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }
  function toggleTheme(){
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    toast(`Switched to ${next} theme`);
  }

  // Toasts
  function toast(message, opts = {}){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    el.toastContainer.appendChild(t);
    setTimeout(()=>{ t.style.opacity = '0'; }, opts.duration || 2300);
    setTimeout(()=>{ t.remove(); }, (opts.duration || 2300) + 300);
  }

  // Modal
  function openModal(contentHtml, title){
    $('#modalTitle').textContent = title || 'Details';
    el.modalBody.innerHTML = contentHtml;
    el.modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal(){
    el.modal.setAttribute('aria-hidden', 'true');
  }

  // Cart Drawer
  function openCart(){
    el.cartDrawer.setAttribute('aria-hidden', 'false');
  }
  function closeCart(){
    el.cartDrawer.setAttribute('aria-hidden', 'true');
  }

  // Persistence
  function loadPersisted(){
    try{
      const cartRaw = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || '[]');
      for(const [id, qty] of cartRaw){
        const product = demoProducts.find(p => p.id === id);
        if(product) state.cart.set(id, { product, qty });
      }
      const wishRaw = JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST) || '[]');
      for(const id of wishRaw) state.wishlist.add(id);
    }catch{}
  }
  function persist(){
    const cartArr = Array.from(state.cart.entries()).map(([id, {qty}]) => [id, qty]);
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartArr));
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(Array.from(state.wishlist)));
  }

  // Filters
  function buildCategories(){
    const cats = Array.from(new Set(demoProducts.map(p => p.category))).sort();
    el.category.innerHTML = ['<option value="all">All categories</option>', ...cats.map(c => `<option value="${c}">${c}</option>`)].join('');
  }

  function applyFilters(){
    const { query, category, maxPrice, sortBy } = state.filters;
    let list = demoProducts.filter(p => (
      (category === 'all' || p.category === category) &&
      p.price <= maxPrice &&
      (query === '' || (p.name + ' ' + p.brand).toLowerCase().includes(query.toLowerCase()))
    ));

    switch(sortBy){
      case 'price-asc': list.sort((a,b)=>a.price-b.price); break;
      case 'price-desc': list.sort((a,b)=>b.price-a.price); break;
      case 'rating-desc': list.sort((a,b)=>b.rating-a.rating); break;
      case 'newest': list.sort((a,b)=>b.createdAt-a.createdAt); break;
      default: list.sort((a,b)=>b.reviews-a.reviews); // featured
    }

    state.products = list;
    renderProducts();
  }

  // Rendering
  function productCard(product){
    const isWished = state.wishlist.has(product.id);
    const wishActive = isWished ? 'btn-primary' : 'btn-ghost';
    return `
      <article class="card" data-id="${product.id}">
        <span class="chip">${product.badge}</span>
        <button class="icon-btn wishlist-btn ${isWished ? 'btn-primary' : 'btn-ghost'}" aria-label="Toggle wishlist" aria-pressed="${isWished}" data-action="wishlist">❤</button>
        <div class="card-media">
          <img alt="${product.name}" src="${product.image}" loading="lazy" />
        </div>
        <div class="card-body">
          <div class="card-title">${product.name}</div>
          <div class="muted">${product.brand} · ${product.category}</div>
          <div class="card-meta">
            <span class="rating">★ ${product.rating}</span>
            <span class="price">${money(product.price)}</span>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary" data-action="add">Add to cart</button>
            <button class="btn ${wishActive}" data-action="wish">Wishlist</button>
            <button class="btn btn-ghost" data-action="details">Details</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderProducts(){
    el.productsGrid.innerHTML = state.products.map(productCard).join('');
  }

  function renderCart(){
    const items = Array.from(state.cart.values());
    if(items.length === 0){
      el.cartItems.innerHTML = '<p class="muted" style="padding:1rem">Your cart is empty.</p>';
      el.cartSubtotal.textContent = money(0);
      el.cartCount.textContent = '0';
      return;
    }

    let subtotal = 0;
    el.cartItems.innerHTML = items.map(({product, qty})=>{
      const itemTotal = product.price * qty; subtotal += itemTotal;
      return `
        <div class="cart-item" data-id="${product.id}">
          <img alt="${product.name}" src="${product.image}" width="64" height="64" style="border-radius:8px;object-fit:cover"/>
          <div>
            <div style="font-weight:700">${product.name}</div>
            <div class="muted">${money(product.price)} · ${product.brand}</div>
            <div class="qty" role="group" aria-label="Quantity">
              <button data-action="dec" aria-label="Decrease">−</button>
              <input type="text" inputmode="numeric" value="${qty}" aria-label="Quantity input" />
              <button data-action="inc" aria-label="Increase">+</button>
            </div>
          </div>
          <div style="text-align:right">
            <div>${money(itemTotal)}</div>
            <button class="btn btn-ghost" data-action="remove">Remove</button>
          </div>
        </div>
      `;
    }).join('');

    el.cartSubtotal.textContent = money(subtotal);
    el.cartCount.textContent = String(items.reduce((n, it)=> n + it.qty, 0));
  }

  function renderWishlistCount(){
    el.wishlistCount.textContent = String(state.wishlist.size);
  }

  // Actions
  function addToCart(productId, qty = 1){
    const product = demoProducts.find(p => p.id === productId);
    if(!product) return;
    const current = state.cart.get(productId)?.qty || 0;
    state.cart.set(productId, { product, qty: current + qty });
    persist();
    renderCart();
    toast(`Added ${product.name} to cart`);
  }

  function removeFromCart(productId){
    const item = state.cart.get(productId);
    if(!item) return;
    state.cart.delete(productId);
    persist();
    renderCart();
    toast(`Removed ${item.product.name}`);
  }

  function setCartQty(productId, qty){
    qty = clamp(Number(qty) || 0, 0, 99);
    if(qty === 0){ removeFromCart(productId); return; }
    const product = demoProducts.find(p => p.id === productId);
    state.cart.set(productId, { product, qty });
    persist();
    renderCart();
  }

  function toggleWishlist(productId){
    if(state.wishlist.has(productId)){
      state.wishlist.delete(productId);
      toast('Removed from wishlist');
    }else{
      state.wishlist.add(productId);
      toast('Added to wishlist');
    }
    persist();
    renderWishlistCount();
    applyFilters(); // re-render to update wish button state
  }

  // Event wiring
  function wireEvents(){
    // Basic ESC to close only
    window.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape') { closeCart(); closeModal(); }
    });

    el.search.addEventListener('input', e=>{ state.filters.query = e.target.value.trim(); applyFilters(); });
    el.category.addEventListener('change', e=>{ state.filters.category = e.target.value; applyFilters(); });
    el.priceRange.addEventListener('input', e=>{ state.filters.maxPrice = Number(e.target.value); el.priceLabel.textContent = money(state.filters.maxPrice); applyFilters(); });
    el.sortBy.addEventListener('change', e=>{ state.filters.sortBy = e.target.value; applyFilters(); });
    el.clearFilters.addEventListener('click', ()=>{
      state.filters = { query:'', category:'all', maxPrice: 1000, sortBy:'featured' };
      el.search.value = '';
      el.category.value = 'all';
      el.priceRange.value = 1000;
      el.priceLabel.textContent = money(1000);
      el.sortBy.value = 'featured';
      applyFilters();
    });

    el.productsGrid.addEventListener('click', e=>{
      const card = e.target.closest('.card'); if(!card) return;
      const productId = card.getAttribute('data-id');
      const actionBtn = e.target.closest('button[data-action]');
      if(!actionBtn) return;
      const action = actionBtn.getAttribute('data-action');
      if(action === 'add') addToCart(productId);
      if(action === 'wish' || action === 'wishlist') toggleWishlist(productId);
      if(action === 'details') showDetails(productId);
    });

    el.wishlistBtn.addEventListener('click', ()=>{
      const wished = demoProducts.filter(p=>state.wishlist.has(p.id));
      if(wished.length === 0){ toast('Your wishlist is empty'); return; }
      openModal(wished.map(productCard).join(''), 'Your wishlist');
    });

    el.cartBtn.addEventListener('click', openCart);
    el.closeCart.addEventListener('click', closeCart);
    el.backdrop.addEventListener('click', ()=>{ closeCart(); closeModal(); });

    el.cartItems.addEventListener('click', e=>{
      const row = e.target.closest('.cart-item'); if(!row) return;
      const id = row.getAttribute('data-id');
      const action = e.target.getAttribute('data-action');
      if(action === 'remove') removeFromCart(id);
      if(action === 'inc') setCartQty(id, (state.cart.get(id)?.qty || 0) + 1);
      if(action === 'dec') setCartQty(id, (state.cart.get(id)?.qty || 0) - 1);
    });
    el.cartItems.addEventListener('change', e=>{
      const row = e.target.closest('.cart-item'); if(!row) return;
      if(e.target.matches('input')){
        const id = row.getAttribute('data-id');
        setCartQty(id, e.target.value);
      }
    });

    el.checkoutBtn.addEventListener('click', ()=>{
      // Proceed to checkout page
      window.location.href = './checkout.html';
    });

    el.themeToggle.addEventListener('click', toggleTheme);
    el.closeModal.addEventListener('click', closeModal);
    // Handle wishlist actions inside the wishlist modal
    el.modalBody.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-action]');
      if(!btn) return;
      const card = e.target.closest('.card');
      const id = card?.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if(!id) return;
      if(action === 'wishlist' || action === 'wish'){
        const wasWished = state.wishlist.has(id);
        toggleWishlist(id);
        // If we are in the wishlist modal and it was wished, remove card from modal
        if(wasWished){
          card.remove();
          if(!el.modalBody.querySelector('.card')){
            closeModal();
            toast('Your wishlist is now empty');
          }
        }
      }
      if(action === 'add') addToCart(id);
      if(action === 'details') showDetails(id);
    });
    el.heroExplore.addEventListener('click', ()=>{
      document.getElementById('main').scrollIntoView({ behavior: 'smooth' });
    });
    el.surpriseBtn.addEventListener('click', ()=>{
      const candidates = state.products.length ? state.products : demoProducts;
      const pick = candidates[Math.floor(Math.random()*candidates.length)];
      showDetails(pick.id);
    });
  }

  function showDetails(productId){
    const p = demoProducts.find(x=>x.id===productId); if(!p) return;
    const html = `
      <div class="modal-grid">
        <img alt="${p.name}" src="${p.image}" style="width:100%;border-radius:12px;object-fit:cover;aspect-ratio:4/3"/>
        <div>
          <h4 style="margin:.25rem 0 0">${p.name}</h4>
          <div class="muted">${p.brand} · ${p.category}</div>
          <div style="display:flex;align-items:center;gap:.75rem;margin:.5rem 0">
            <span class="rating">★ ${p.rating}</span>
            <strong style="font-size:1.25rem">${money(p.price)}</strong>
          </div>
          <p class="muted">Designed with premium materials and meticulous attention to detail. Experience comfort and performance that stands out.</p>
          <div style="display:flex;gap:.5rem;margin-top:1rem">
            <button class="btn btn-primary" id="detailAdd">Add to cart</button>
            <button class="btn btn-ghost" id="detailWish">${state.wishlist.has(p.id) ? 'Remove from' : 'Add to'} wishlist</button>
          </div>
        </div>
      </div>
    `;
    openModal(html, p.name);
    $('#detailAdd').addEventListener('click', ()=> addToCart(p.id));
    $('#detailWish').addEventListener('click', ()=> toggleWishlist(p.id));
  }

  // Init
  function init(){
    initTheme();
    loadPersisted();
    buildCategories();
    el.priceRange.value = state.filters.maxPrice;
    el.priceLabel.textContent = money(state.filters.maxPrice);
    el.year.textContent = new Date().getFullYear();

    wireEvents();
    applyFilters();
    renderCart();
    renderWishlistCount();
  }

  document.addEventListener('DOMContentLoaded', init);
})();


