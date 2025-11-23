
/* ReStyle Connect - Client-only demo app
   All data stored in localStorage.
   Features:
   - List designers with filters
   - Add designer
   - Send project (upload before image)
   - Designers add proposals (simulated)
   - Accept proposal -> "Order" created
   - Simulated payment and rating
*/

const DB_KEY = "restyle_db_v1";

const defaultData = {
  designers: [
    {id: 'd1', name:'Maya Ahmad', price:35, rating:4.8, style:'Upcycle & boho', location:'Dhaka', avatar:''},
    {id: 'd2', name:'Rafi Khan', price:22, rating:4.2, style:'Minimal & modern', location:'Chittagong', avatar:''},
    {id: 'd3', name:'Anika Roy', price:45, rating:4.9, style:'High-fashion upcycle', location:'Sylhet', avatar:''}
  ],
  projects: [], // {id, userName, beforeImg, desc, designerId?, proposals:[], order?}
  orders: []
};

function loadDB(){
  const raw = localStorage.getItem(DB_KEY);
  if(!raw){
    localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
  try{
    return JSON.parse(raw);
  }catch(e){
    console.error(e);
    localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

let db = loadDB();

function el(q){ return document.querySelector(q) }
function elAll(q){ return Array.from(document.querySelectorAll(q)) }

function renderDesigners(){
  const list = el('#designerList');
  list.innerHTML = '';
  let items = db.designers.slice();

  const minRating = parseFloat(el('#minRating').value || 0);
  const maxPriceVal = parseFloat(el('#maxPrice').value || Infinity);
  const sortVal = el('#sortSelect').value;

  items = items.filter(d => d.rating >= minRating && (isFinite(maxPriceVal) ? d.price <= maxPriceVal : true));

  if(sortVal === 'rating-desc') items.sort((a,b)=>b.rating-a.rating);
  if(sortVal === 'price-asc') items.sort((a,b)=>a.price-b.price);
  if(sortVal === 'price-desc') items.sort((a,b)=>b.price-a.price);

  items.forEach(d=>{
    const li = document.createElement('li');
    li.className = 'designer-item';

    const img = document.createElement('img');
    img.src = d.avatar || 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#f1f1f1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="20">${d.name.split(' ')[0][0] || 'D'}</text></svg>`);

    const meta = document.createElement('div');
    meta.className = 'designer-meta';
    meta.innerHTML = `<h4>${d.name}</h4>
      <div class="small-muted">Style: ${d.style} • ${d.location}</div>
      <div style="margin-top:6px">
        <span class="tag">৳${d.price}</span>
        <span class="tag">⭐ ${d.rating.toFixed(1)}</span>
      </div>`;

    const btn = document.createElement('button');
    btn.className = 'small-btn';
    btn.textContent = 'View';
    btn.onclick = ()=> openDesignerPanel(d.id);

    li.append(img, meta, btn);
    list.appendChild(li);
  });
}

function openDesignerPanel(id){
  const d = db.designers.find(x=>x.id===id);
  const panel = el('#panelArea');
  panel.innerHTML = `
    <h2>${d.name}</h2>
    <div class="section">
      <div class="small-muted">Style</div>
      <strong>${d.style}</strong>
      <div class="small-muted" style="margin-top:6px">Price (base): ৳${d.price}</div>
      <div class="small-muted">Rating: ${d.rating.toFixed(1)}</div>
    </div>

    <div class="section">
      <h3>Send a Project</h3>
      <div class="form-row"><input id="projName" placeholder="Your name" /></div>
      <div class="form-row"><input id="projDesc" placeholder="Describe what you want" /></div>
      <div class="form-row">
        <input id="projFile" type="file" accept="image/*" />
      </div>
      <div id="previewWrap" style="margin:8px 0"></div>
      <button id="sendProj" class="primary">Send Project</button>
    </div>

    <div class="section">
      <h3>Designer Proposals</h3>
      <div id="designerProposals">No proposals yet.</div>
    </div>

    <div class="section">
      <h3>Orders</h3>
      <div id="designerOrders">No orders.</div>
    </div>
  `;

  // file preview
  const projFile = el('#projFile');
  const previewWrap = el('#previewWrap');
  projFile.addEventListener('change', (e)=>{
    const f = e.target.files[0];
    if(!f) return previewWrap.innerHTML='';
    const reader = new FileReader();
    reader.onload = ()=> previewWrap.innerHTML = `<img src="${reader.result}" style="max-width:220px;border-radius:8px" />`;
    reader.readAsDataURL(f);
  });

  el('#sendProj').onclick = ()=>{
    const name = el('#projName').value.trim() || 'Anonymous';
    const desc = el('#projDesc').value.trim() || 'No description';
    const f = projFile.files[0];
    if(!f){ alert('Please pick an image of the garment.'); return; }
    const reader = new FileReader();
    reader.onload = ()=>{
      const id = 'p' + Date.now();
      const proj = { id, userName: name, desc, beforeImg: reader.result, designerId: d.id, proposals: [], status:'open' };
      db.projects.push(proj);
      saveDB(db);
      alert('Project sent. Designer will add a proposal (simulated).');
      renderDesignerProposals(d.id);
      // simulate designer proposal after a short delay
      setTimeout(()=> simulateProposal(d.id, proj.id), 800 + Math.random()*1200);
    };
    reader.readAsDataURL(f);
  };

  renderDesignerProposals(d.id);
  renderDesignerOrders(d.id);
}

function renderDesignerProposals(designerId){
  const box = el('#designerProposals');
  const projects = db.projects.filter(p=>p.designerId===designerId);
  if(!projects.length){ box.innerHTML = '<div class="small-muted">No projects yet.</div>'; return; }
  box.innerHTML = '';
  projects.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'order';
    div.innerHTML = `
      <div><strong>${p.userName}</strong> — ${p.desc}</div>
      <div style="margin-top:6px"><img src="${p.beforeImg}" style="max-width:160px;border-radius:8px" /></div>
      <div id="proposals-${p.id}" style="margin-top:8px">${renderProposalsQuick(p)}</div>
    `;
    box.appendChild(div);
  });
}

function renderProposalsQuick(p){
  if(!p.proposals || !p.proposals.length) return '<div class="small-muted">No proposals yet.</div>';
  return p.proposals.map(prop=>{
    return `<div style="padding:8px;border-radius:8px;border:1px solid #f1f1f1;margin-top:6px">
      <div><strong>₳ Proposal:</strong> ${prop.note}</div>
      <div class="small-muted">Price: ৳${prop.price} • Time: ${prop.time} days</div>
      <div style="margin-top:8px">
        <button class="small-btn" onclick="acceptProposal('${p.id}','${prop.id}')">Accept</button>
      </div>
    </div>`;
  }).join('');
}

window.acceptProposal = function(projectId, proposalId){
  const p = db.projects.find(x=>x.id===projectId);
  if(!p) return alert('Not found');
  const prop = p.proposals.find(x=>x.id===proposalId);
  if(!prop) return alert('Proposal not found');
  // create order
  const order = {
    id: 'o'+Date.now(),
    projectId: p.id,
    designerId: p.designerId,
    userName: p.userName,
    price: prop.price,
    status:'pending-payment',
    beforeImg: p.beforeImg,
    afterImg: null,
    rating: null
  };
  db.orders.push(order);
  p.status = 'ordered';
  saveDB(db);
  renderDesignerProposals(p.designerId);
  alert('Proposal accepted. Go to Orders panel to pay and track.');
  openOrdersPanel();
}

function renderDesignerOrders(designerId){
  const box = el('#designerOrders');
  const orders = db.orders.filter(o=>o.designerId===designerId);
  if(!orders.length){ box.innerHTML = '<div class="small-muted">No orders yet.</div>'; return; }
  box.innerHTML = '';
  orders.forEach(o=>{
    const div = document.createElement('div');
    div.className = 'order';
    div.innerHTML = `
      <div><strong>Order ${o.id}</strong> — ${o.userName}</div>
      <div class="small-muted">Price: ৳${o.price} • Status: ${o.status}</div>
      <div style="margin-top:6px">
        <img src="${o.beforeImg}" style="max-width:120px;border-radius:6px" />
      </div>
    `;
    if(o.status==='in-progress'){
      div.innerHTML += `<div style="margin-top:8px">
        <button class="small-btn" onclick="completeOrder('${o.id}')">Mark as Done (designer)</button>
      </div>`;
    }
    box.appendChild(div);
  });
}

window.completeOrder = function(orderId){
  const o = db.orders.find(x=>x.id===orderId);
  if(!o) return alert('Order not found');
  // designer completes work: create after image by applying a simple overlay (we'll just copy before image in this demo)
  o.afterImg = o.beforeImg;
  o.status = 'delivered';
  saveDB(db);
  alert('Order marked delivered. User can review and pay.');
  renderDesigners();
  renderGallery();
}

function openAddDesignerModal(){
  showModal(`
    <h3>Add Designer</h3>
    <div class="form-row"><input id="dName" placeholder="Name" /></div>
    <div class="form-row"><input id="dStyle" placeholder="Style (short)" /></div>
    <div class="form-row"><input id="dPrice" type="number" placeholder="Base price" /></div>
    <div class="form-row"><input id="dRating" type="number" step="0.1" placeholder="Rating (1-5)" /></div>
    <div class="form-row"><input id="dLoc" placeholder="Location" /></div>
    <div class="form-row"><input id="dAvatar" type="file" accept="image/*" /></div>
    <div id="avatarPreview"></div>
    <div style="margin-top:8px"><button id="saveDesigner" class="primary">Save</button></div>
  `);

  const av = el('#dAvatar');
  av.addEventListener('change', (e)=>{
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = ()=> el('#avatarPreview').innerHTML = `<img src="${r.result}" style="max-width:140px;border-radius:8px" />`;
    r.readAsDataURL(f);
  });

  el('#saveDesigner').onclick = ()=>{
    const name = el('#dName').value.trim();
    if(!name) return alert('Name required');
    const style = el('#dStyle').value.trim() || 'General';
    const price = parseFloat(el('#dPrice').value || 25);
    const rating = parseFloat(el('#dRating').value || 4.0);
    const loc = el('#dLoc').value.trim() || 'Unknown';
    const avFile = av.files[0];
    if(avFile){
      const r = new FileReader();
      r.onload = ()=>{
        const newD = { id: 'd'+Date.now(), name, price, rating, style, location:loc, avatar: r.result };
        db.designers.push(newD);
        saveDB(db);
        closeModal();
        renderDesigners();
      };
      r.readAsDataURL(avFile);
    }else{
      db.designers.push({ id:'d'+Date.now(), name, price, rating, style, location:loc, avatar: ''});
      saveDB(db); closeModal(); renderDesigners();
    }
  };
}

function showModal(html){
  el('#modalContent').innerHTML = html;
  el('#modal').classList.remove('hidden');
}
function closeModal(){ el('#modal').classList.add('hidden'); }

el('#closeModal').onclick = closeModal;
el('#modal').addEventListener('click', (e)=>{ if(e.target.id==='modal') closeModal(); });

document.getElementById('openAddDesigner').onclick = openAddDesignerModal;
el('#sortSelect').onchange = renderDesigners;
el('#minRating').onchange = renderDesigners;
el('#maxPrice').oninput = renderDesigners;
el('#resetFilters').onclick = ()=>{ el('#minRating').value='0'; el('#maxPrice').value=''; el('#sortSelect').value='rating-desc'; renderDesigners(); }

function simulateProposal(designerId, projectId){
  const d = db.designers.find(x=>x.id===designerId);
  const p = db.projects.find(x=>x.id===projectId);
  if(!d || !p) return;
  const prop = { id:'pr'+Date.now(), price: Math.max(10, Math.round(d.price * (0.8 + Math.random()*1.4))), time: Math.ceil(3 + Math.random()*6), note: `I can ${d.style.toLowerCase()} this piece, add trims and reshape.` };
  p.proposals.push(prop);
  saveDB(db);
  // update panels if open
  if(el('#panelArea').innerText.includes(d.name)) renderDesignerProposals(d.id);
}

function renderGallery(){
  const wrap = el('#gallery');
  wrap.innerHTML = '';
  const delivered = db.orders.filter(o=>o.status==='delivered' && o.afterImg);
  delivered.forEach(o=>{
    const div = document.createElement('div'); div.className='tile';
    div.innerHTML = `<img src="${o.afterImg}" title="Order ${o.id}" />`;
    wrap.appendChild(div);
  });
}

function openOrdersPanel(){
  showModal(`<h3>Orders</h3><div id="ordersList"></div>`);
  renderOrdersInModal();
}

function renderOrdersInModal(){
  const box = el('#ordersList');
  box.innerHTML = '';
  if(!db.orders.length){ box.innerHTML = '<div class="small-muted">No orders yet.</div>'; return; }
  db.orders.forEach(o=>{
    const d = db.designers.find(x=>x.id===o.designerId) || {};
    const html = document.createElement('div');
    html.className='order';
    html.innerHTML = `
      <div><strong>${o.id}</strong> — ${o.userName} • Designer: ${d.name || 'N/A'}</div>
      <div class="small-muted">Price: ৳${o.price} • Status: ${o.status}</div>
      <div style="margin-top:6px"><img src="${o.beforeImg}" style="max-width:140px;border-radius:8px" /></div>
    `;
    if(o.status==='pending-payment'){
      const payBtn = document.createElement('button');
      payBtn.textContent = 'Pay (simulated)';
      payBtn.className = 'primary';
      payBtn.style.marginTop='8px';
      payBtn.onclick = ()=>{
        o.status = 'in-progress';
        saveDB(db);
        alert('Payment done. Designer will start work.');
        renderOrdersInModal();
        renderDesignerOrders(o.designerId);
      };
      html.appendChild(payBtn);
    } else if(o.status==='delivered'){
      const afterWrap = document.createElement('div');
      afterWrap.style.marginTop='8px';
      afterWrap.innerHTML = `<div>After image:</div><img src="${o.afterImg}" style="max-width:220px;border-radius:8px" />`;
      html.appendChild(afterWrap);
      if(!o.rating){
        const rateRow = document.createElement('div'); rateRow.style.marginTop='8px';
        rateRow.innerHTML = `<label>Rate:
          <select id="rate-${o.id}">
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Okay</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Bad</option>
          </select>
        </label>
        <button class="small-btn" id="rateBtn-${o.id}">Submit</button>`;
        html.appendChild(rateRow);
        setTimeout(()=> {
          el(`#rateBtn-${o.id}`).onclick = ()=>{
            const v = parseInt(el(`#rate-${o.id}`).value);
            o.rating = v; o.status = 'completed';
            // update designer rating roughly
            const designer = db.designers.find(x=>x.id===o.designerId);
            if(designer){
              designer.rating = Math.round(((designer.rating*10) + v*10) / 11)/10;
            }
            saveDB(db);
            renderOrdersInModal();
            renderDesigners();
            renderGallery();
            alert('Thanks for rating!');
          };
        }, 100);
      }
    }

    box.appendChild(html);
  });
}

document.getElementById('quickMatch').onclick = ()=>{
  const bud = parseFloat(el('#quickBudget').value || 0);
  const out = el('#quickMatches');
  out.innerHTML = '';
  let candidates = db.designers.slice().filter(d=>d.price <= (bud || Infinity));
  candidates.sort((a,b)=>b.rating-a.rating);
  candidates.slice(0,3).forEach(c=>{
    const li = document.createElement('li');
    li.className='designer-item';
    li.innerHTML = `<div style="flex:1"><strong>${c.name}</strong><div class="small-muted">${c.style} • ৳${c.price} • ⭐${c.rating.toFixed(1)}</div></div>
      <button class="small-btn" onclick="openDesignerPanel('${c.id}')">View</button>`;
    out.appendChild(li);
  });
};

document.getElementById('openAddDesigner').addEventListener('click', openAddDesignerModal);

// small helper to render designers on load
renderDesigners();
renderGallery();

// small UI: open orders panel from header click (bonus)
const header = document.querySelector('header');
const ordersButton = document.createElement('button');
ordersButton.textContent = 'Orders';
ordersButton.className = 'small-btn';
ordersButton.style.marginLeft = '12px';
ordersButton.onclick = openOrdersPanel;
header.appendChild(ordersButton);

// expose some functions for inline handlers used earlier
window.openDesignerPanel = openDesignerPanel;
window.openOrdersPanel = openOrdersPanel;
window.renderDesignerProposals = renderDesignerProposals;
window.renderDesignerOrders = renderDesignerOrders;
window.renderDesigners = renderDesigners;
window.renderGallery = renderGallery;
