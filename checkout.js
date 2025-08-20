(function(){
  const $ = (s,p=document)=>p.querySelector(s);
  const currency = { code:'INR', locale:'en-IN' };
  const format = (n)=> new Intl.NumberFormat(currency.locale, { style:'currency', currency:currency.code }).format(n);

  // Load cart from localStorage (stored as USD qty pairs in main app)
  const CART_KEY = 'aurora.cart';
  const RATE = 83; // USD → INR display rate
  const demoProducts = {
    p1: { name:'Aurora Headphones', price:199 },
    p2: { name:'Nebula Smartwatch', price:249 },
    p3: { name:'Lumen Desk Lamp', price:89 },
    p4: { name:'Eclipse Backpack', price:129 },
    p5: { name:'Quanta Keyboard', price:139 },
    p6: { name:'Prism Water Bottle', price:29 },
    p7: { name:'Halo Bluetooth Speaker', price:99 },
    p8: { name:'Nimbus Running Shoes', price:159 },
    p9: { name:'Polar Jacket', price:189 },
    p10:{ name:'Flux Wireless Mouse', price:69 },
    p11:{ name:'Zen Yoga Mat', price:49 },
    p12:{ name:'Drift Sunglasses', price:119 },
  };

  function loadCart(){
    try{ return new Map(JSON.parse(localStorage.getItem(CART_KEY) || '[]')); }catch{ return new Map(); }
  }

  function computeSummary(){
    const cart = loadCart();
    let subtotalUSD = 0; let lines = [];
    for(const [id, qty] of cart.entries()){
      const p = demoProducts[id]; if(!p) continue;
      subtotalUSD += p.price * qty;
      lines.push(`${p.name} × ${qty}`);
    }
    const subtotalINR = subtotalUSD * RATE;
    const shippingINR = subtotalINR > 5000 ? 0 : 149; // simple rule
    const taxINR = Math.round(subtotalINR * 0.05);
    const totalINR = subtotalINR + shippingINR + taxINR;
    return { lines, subtotalINR, shippingINR, taxINR, totalINR };
  }

  function render(){
    const s = computeSummary();
    $('#orderItems').textContent = s.lines.length ? s.lines.join(' • ') : 'Your cart is empty';
    $('#sumSubtotal').textContent = format(s.subtotalINR);
    $('#sumShipping').textContent = format(s.shippingINR);
    $('#sumTax').textContent = format(s.taxINR);
    $('#sumTotal').textContent = format(s.totalINR);
  }

  function toast(msg){
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(()=> t.style.opacity='0', 2000); setTimeout(()=> t.remove(), 2350);
  }

  function placeOrder(){
    const form = $('#addressForm');
    if(!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    // Simulate order placement
    toast('Order placed successfully!');
    // Clear cart and redirect
    localStorage.setItem(CART_KEY, '[]');
    setTimeout(()=>{ window.location.href = './index.html'; }, 1200);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    render();
    $('#placeOrder').addEventListener('click', placeOrder);
  });
})();


