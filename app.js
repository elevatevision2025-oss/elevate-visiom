const BRAND = "Elevate Visiom";
const WA_E164 = "94785466276"; // 0785466276 -> +94 785466276

function qs(k){ return new URLSearchParams(location.search).get(k); }
function waLink(text){ return `https://wa.me/${WA_E164}?text=${encodeURIComponent(text)}`; }

function toast(msg){
  const el = document.getElementById("toast");
  if(!el) return;
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(window.__t);
  window.__t = setTimeout(()=> el.style.display="none", 2300);
}

async function loadProducts(){
  const res = await fetch("products.json", { cache: "no-store" });
  const data = await res.json();
  const products = data.products ?? data;
  return products.map(p => ({
    id: String(p.id),
    title: String(p.title),
    desc: String(p.desc ?? ""),
    price: Number(p.price ?? 1000),
    category: String(p.category ?? "Digital"),
    image: String(p.image ?? "")
  }));
}

function setNav(){
  const b = document.getElementById("brandName");
  if(b) b.textContent = BRAND;

  const wa = document.getElementById("waBtn");
  if(wa){
    wa.href = waLink(`Hi! I’m interested in ${BRAND} digital products. Please share details.`);
  }
}

function renderGrid(products){
  const grid = document.getElementById("productGrid");
  if(!grid) return;
  grid.innerHTML = "";

  products.forEach(p=>{
    const el = document.createElement("div");
    el.className = "card glass-soft";
    el.innerHTML = `
      <div class="thumb"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}"></div>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.desc)}</p>
      <div class="price">
        <b>Rs. ${p.price}</b>
        <a class="smallbtn" href="product.html?id=${encodeURIComponent(p.id)}">View</a>
      </div>
    `;
    grid.appendChild(el);
  });
}

function renderProduct(products){
  const id = qs("id");
  if(!id) return;

  const p = products.find(x=>x.id===id) || products[0];
  if(!p) return;

  const img = document.getElementById("pImg");
  const title = document.getElementById("pTitle");
  const desc = document.getElementById("pDesc");
  const price = document.getElementById("pPrice");
  const buy = document.getElementById("buyBtn");

  if(img) img.src = p.image;
  if(title) title.textContent = p.title;
  if(desc) desc.textContent = p.desc;
  if(price) price.textContent = p.price;
  if(buy) buy.href = `checkout.html?id=${encodeURIComponent(p.id)}`;
}

function initCheckout(products){
  const id = qs("id");
  const p = products.find(x=>x.id===id) || products[0];
  if(!p) return;

  document.getElementById("coTitle").textContent = p.title;
  document.getElementById("coPrice").textContent = p.price;

  // preview proof (cannot auto-send to WhatsApp)
  const proof = document.getElementById("proof");
  const preview = document.getElementById("preview");

  proof?.addEventListener("change", ()=>{
    const f = proof.files?.[0];
    if(!f){ preview.innerHTML=""; return; }
    const url = URL.createObjectURL(f);
    preview.innerHTML = `
      <div class="notice">
        <strong>Preview:</strong> (This will NOT auto-send)
        <img src="${url}" style="width:100%;border-radius:14px;margin-top:8px;border:1px solid rgba(255,255,255,0.16)">
      </div>`;
  });

  document.getElementById("sendWA").addEventListener("click", ()=>{
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const note = document.getElementById("note").value.trim();

    if(!email){
      toast("Email එක අනිවාර්යයි ✅ (කරුණාකර email එක දාන්න)");
      document.getElementById("email").focus();
      return;
    }

    const msg =
`Hi ${BRAND} 👋
I want to buy: ${p.title}
Price: Rs. ${p.price}
Name: ${name || "Customer"}
Email: ${email}

✅ I will attach my payment proof screenshot here and send.

${note ? `Note: ${note}` : ""}`;

    window.open(waLink(msg), "_blank");
  });
}

// Optional: gate checkout for verified users (requires Firebase loaded)
async function gateCheckoutIfAuthEnabled(){
  if(!window.__EV) return; // Firebase not configured yet
  const { auth, onAuthStateChanged } = window.__EV;

  // only gate if a marker exists
  const gate = document.body.getAttribute("data-require-verified");
  if(gate !== "true") return;

  onAuthStateChanged(auth, (user)=>{
    if(!user){
      toast("Login required 🔐");
      setTimeout(()=> location.href="login.html", 700);
      return;
    }
    if(!user.emailVerified){
      toast("Email verify කරන්න ⏳");
      setTimeout(()=> location.href="verify.html", 700);
    }
  });
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

document.addEventListener("DOMContentLoaded", async ()=>{
  setNav();
  const products = await loadProducts();
  renderGrid(products);
  renderProduct(products);
  if(document.getElementById("sendWA")) initCheckout(products);
  await gateCheckoutIfAuthEnabled();
});