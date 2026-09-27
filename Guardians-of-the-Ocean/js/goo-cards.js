/* Sidebar cards, flyer, and globe chrome */
(function(){
'use strict';

/* Card imagery. Every entry has a CSS gradient underneath and an onerror
   handler, so a dead URL degrades to something intentional rather than a
   broken box. The kingfisher is the actual photo used in the reference. */
var W = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
var CARDS = [
  { id:'ocean', l1:'Save the', l2:'Ocean',
    img: W + 'Green%20Sea%20Turtle%20grazing%20seagrass.jpg?width=480',
    fall:'linear-gradient(170deg,#3fc4e8,#0b6ba8 60%,#07406e)',
    campaign:null,
    text:"More than a football field of coral and mangrove is lost every hour. From bleaching reefs to vanishing shorelines, the consequences of a warming ocean are far reaching." },

  { id:'climate', l1:'Climate', l2:'Change',
    img: W + 'Sossusvlei%20Dune%20Namib%20Desert%20Namibia%20Luca%20Galuzzi%202004.JPG?width=480',
    fall:'linear-gradient(170deg,#9fd6e8 0%,#d9c3a6 42%,#b68b63 100%)',
    campaign:null,
    text:"Rising global temperatures are reshaping deserts, rainfall patterns and growing seasons alike. Every fraction of a degree avoided keeps more of the world livable." },

  { id:'arctic', l1:'Arctic is', l2:'Calling',
    img: W + 'Mosaic%20of%20the%20Arctic.jpg?width=480',
    fall:'linear-gradient(165deg,#cfe6f2 0%,#eef6fb 45%,#9dbdd2 100%)',
    campaign:null,
    text:"Arctic sea ice is thinning faster than the models once predicted, reshaping habitats for the species — and the communities — that depend on it." },

  { id:'thirsty', l1:'Quench the', l2:'Thirsty',
    img:'assets/images/cards/thirsty.jpg',
    fall:'radial-gradient(circle at 74% 38%, #7fe3ff 0%, #2aa8e8 16%, #0d67b4 34%, #063f86 62%, #02255c 100%)',
    campaign:null,
    text:"Shifting rainfall and shrinking freshwater reserves put safe drinking water further out of reach for millions. Conservation starts with knowing where every drop goes." },

  { id:'birds', l1:'Save the', l2:'Birds',
    img: W + 'Common%20Kingfisher%20Alcedo%20atthis.jpg?width=640',
    fall:'linear-gradient(160deg,#e8d98a,#c9b25c 60%,#9c8540)',
    campaign:'2018 Campaign',
    text:"Birds cannot see glass and do not interpret windows as a barrier or a danger. Making matters worse, reflections of the sky and plant materials simulate a possible flight path that really does not exist. Luckily, the Zoo's Green Team of creative people began to work on practical solutions for making existing windows bird-" },

  { id:'jungle', l1:'Welcome to', l2:'the Jungle',
    img:'assets/images/cards/jungle.jpg',
    fall:'linear-gradient(170deg,#f2c489 0%,#b8803f 38%,#5a4526 72%,#2c2415 100%)',
    campaign:null,
    text:"Tropical forests hold more species than anywhere else on Earth. Keeping the canopy intact keeps that entire web of life standing." },

  { id:'jakarta', l1:'Jakarta', l2:'Indonesia', cityId:'jakarta',
    img:'assets/images/cities/jakarta.jpg',
    fall:'linear-gradient(170deg,#1a6b8a,#0a3d5c)',
    campaign:'Pilot 01 · Critical',
    text:"Jakarta Bay North sits on one of the world’s fastest-sinking shorelines. Field ops install an erosion barrier along 8.5 km of bay, protecting 42,000 residents with 12 IoT gauges. Milestone: Bay Erosion Barrier Construction · $310k USD · Phase 1/4." },

  { id:'manila', l1:'Manila', l2:'Philippines', cityId:'manila',
    img:'assets/images/cities/manila.jpg',
    fall:'linear-gradient(170deg,#0e6a7a,#083848)',
    campaign:'Pilot 02 · Critical',
    text:"Manila Bay’s reef line is being rebuilt with 2,500 coral modules and 15 co-ops. Fish biomass is already up 38%. Milestone: Artificial Reef Structure Deployment · $145k USD · Phase 3/4." },

  { id:'hcmc', l1:'Ho Chi Minh', l2:'Vietnam', cityId:'hcmc',
    img:'assets/images/cities/hcmc.jpg',
    fall:'linear-gradient(170deg,#2a7a5a,#12382c)',
    campaign:'Pilot 03 · Critical',
    text:"The Mekong saline edge is replanted across 24 km, with 85,000 trees shielding 520 families from salt intrusion. Milestone: Delta Sediment & Vegetation Replanting · $210k USD · Phase 2/4." },

  { id:'lagos', l1:'Lagos', l2:'Nigeria', cityId:'lagos',
    img:'assets/images/cities/lagos.jpg',
    fall:'linear-gradient(170deg,#1c5c88,#0a2a44)',
    campaign:'Pilot 04 · Critical',
    text:"Barrier-island skimmers trap floating plastic along 14.2 km of Atlantic shore — 310 tonnes pulled this season. Milestone: Floating Waste Trap Deployment · $250k USD · Phase 2/4." },

  { id:'miami', l1:'Miami', l2:'USA', cityId:'miami',
    img:'assets/images/cities/miami.jpg',
    fall:'linear-gradient(170deg,#1a8cb8,#0b4a68)',
    campaign:'Pilot 05 · Elevated',
    text:"Biscayne’s living shoreline mixes coral modules with hybrid dunes across 6.8 km. 1,200 coral fragments and 99.8% IoT uptime. Milestone: Living Shoreline Hybrid Modules · $400k USD · Phase 2/4." },

  { id:'mumbai', l1:'Mumbai', l2:'India', cityId:'mumbai',
    img:'assets/images/cities/mumbai.jpg',
    fall:'linear-gradient(170deg,#3a5a88,#152438)',
    campaign:'Pilot 06 · Elevated',
    text:"The Mithi estuary reclaim has lifted 145 tonnes of waste from 600 hectares, with 8 telemetry buoys on the creek. Milestone: Mithi River Estuary Reclaim · $175k USD · Phase 3/4." },

  { id:'mombasa', l1:'Mombasa', l2:'Kenya', cityId:'mombasa',
    img:'assets/images/cities/mombasa.jpg',
    fall:'linear-gradient(170deg,#0e7a72,#083830)',
    campaign:'Pilot 07 · Elevated',
    text:"Kilifi’s community estuary drive has planted 120,000 mangrove seeds and recovered 85 tonnes of waste with 320 operators. Milestone: Community Estuary Replanting · $120k USD · Phase 3/4." },

  { id:'sydney', l1:'Sydney', l2:'Australia', cityId:'sydney',
    img:'assets/images/cities/sydney.jpg',
    fall:'linear-gradient(170deg,#1a6a9a,#0a3048)',
    campaign:'Pilot 08 · Managed',
    text:"Harbour living-seawall tiles now cover 12.5 hectares, hosting 45 species across 850 habitat tiles. Milestone: Living Seawall Tile Expansion · $220k USD · Phase 4/4." },

  { id:'capetown', l1:'Cape Town', l2:'South Africa', cityId:'capetown',
    img:'assets/images/cities/capetown.jpg',
    fall:'linear-gradient(170deg,#3a6a88,#1a3048)',
    campaign:'Pilot 09 · Managed',
    text:"The Great African Seaforest audit maps 4,200 hectares of kelp canopy, 92 species, and 18 drone transects. Milestone: Great African Seaforest Audit · $180k USD · Phase 4/4." },

  { id:'rotterdam', l1:'Rotterdam', l2:'Netherlands', cityId:'rotterdam',
    img:'assets/images/cities/rotterdam.jpg',
    fall:'linear-gradient(170deg,#2a4a6a,#121c28)',
    campaign:'Pilot 10 · Managed',
    text:"Estuarine bio-parks turn 12 floating isles into habitat and 1.8 GWh of on-site energy, fully hashed on Hedera. Milestone: Estuarine Biodiversity Parks · $290k USD · Phase 4/4." }
];
window.__chosenCity = 'jakarta';

var app    = document.getElementById('app');
var track  = document.getElementById('track');
var list   = document.getElementById('list');
var sbThumb= document.getElementById('sbThumb');
var dTitle = document.getElementById('dTitle');
var dCopy  = document.getElementById('dCopy');
var dImg   = document.getElementById('dImg');
var dShot  = document.getElementById('dShot');
var dCamp  = document.getElementById('dCampaign');

/* ---------------------------------------------------------------- cursor */
var cur = document.getElementById('cur');
var cx = innerWidth/2, cy = innerHeight/2, tx = cx, ty = cy;
addEventListener('pointermove', function(e){ tx = e.clientX; ty = e.clientY; }, {passive:true});
(function follow(){
  cx += (tx-cx)*0.62; cy += (ty-cy)*0.62;
  cur.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
  requestAnimationFrame(follow);
})();
addEventListener('pointerdown', function(e){
  var r = document.createElement('div');
  r.className = 'ripple';
  r.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
  document.body.appendChild(r);
  setTimeout(function(){ r.remove(); }, 640);
}, {passive:true});
document.addEventListener('pointerover', function(e){
  cur.classList.toggle('hot', !!(e.target.closest && e.target.closest('.card,.icon-btn,.icon-tip,.back,.nav a,.uxrow-btn,.uxclose,.uxaction,.gctrl button,.gpin,.rm-node,.rm-close,.rm-tl-step,.terra-sbtn,.terra-iconbtn')));
});

/* ------------------------------------------------------- sidebar icon tips */
(function(){
  var wraps = [].slice.call(document.querySelectorAll('.icon-wrap'));
  wraps.forEach(function(w){
    var btn = w.querySelector('.icon-btn');
    btn.addEventListener('click', function(ev){
      ev.stopPropagation();
      var isOpen = w.classList.contains('show');
      wraps.forEach(function(o){ o.classList.remove('show'); });
      if(!isOpen) w.classList.add('show');
    });
  });
  document.addEventListener('click', function(){
    wraps.forEach(function(o){ o.classList.remove('show'); });
  });
})();

/* ---------------------------------------------------------- floating ux card */
(function(){
  var ICON = {
    globe:'<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3c2.4 2.4 3.8 5.6 3.8 9s-1.4 6.6-3.8 9c-2.4-2.4-3.8-5.6-3.8-9s1.4-6.6 3.8-9Z"/>',
    tree:'<path d="M12 2c5 4 8 8 8 12a8 8 0 0 1-16 0c0-4 3-8 8-12Z"/><path d="M12 22v-8"/>',
    bird:'<path d="M3 15c2 1 4 1 6-1 1 3 4 5 8 4-1-1-1-2 0-3 2 0 4-1 5-3-2 1-3 1-4 0 1-1 2-3 1-5-1 2-3 3-5 3-2-2-5-2-7 0-2 0-3 2-4 5Z"/>',
    drop:'<path d="M12 2.7s-6.2 7.4-6.2 11.4a6.2 6.2 0 0 0 12.4 0C18.2 10.1 12 2.7 12 2.7Z"/>',
    shield:'<path d="M12 3l7 3v6c0 5-3.3 7.7-7 9-3.7-1.3-7-4-7-9V6l7-3Z"/><path d="M9 12l2 2 4-4"/>',
    lock:'<rect x="4" y="11" width="16" height="9"/><path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11"/><circle cx="12" cy="15.3" r="1.3"/>',
    sun:'<circle cx="12" cy="12" r="4.5"/><line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="3.5" y1="12" x2="1.5" y2="12"/><line x1="22.5" y1="12" x2="20.5" y2="12"/><line x1="5" y1="5" x2="6.6" y2="6.6"/><line x1="17.4" y1="17.4" x2="19" y2="19"/><line x1="19" y1="5" x2="17.4" y2="6.6"/><line x1="6.6" y1="17.4" x2="5" y2="19"/>',
    receipt:'<path d="M6 2h9l3 3v17l-3-2-3 2-3-2-3 2V2Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    milestone:'<polygon points="1 6 1 21 8 18 16 21 23 18 23 3 16 6 8 3 1 6"/><line x1="8" y1="3" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="21"/>',
    wallet:'<path d="M21 8H5a2 2 0 0 1 0-4h13v4"/><path d="M3 8v11a2 2 0 0 0 2 2h16v-6"/><path d="M17 13.5h4v3h-4a1.5 1.5 0 0 1 0-3Z"/>',
    handshake:'<path d="M2 12h4l3-3 3 3h2l3-3 3 3h2"/><path d="M9 12v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3"/>',
    link:'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
    badge:'<circle cx="12" cy="9" r="6"/><path d="M9 14.5L7 22l5-3 5 3-2-7.5"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="18" cy="9" r="2.3"/><path d="M16 14.3c2.2.5 3.8 2.4 3.8 4.7"/>',
    pie:'<path d="M12 2a10 10 0 1 0 10 10H12Z"/><path d="M12 2v10h10"/>',
    trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 6h6v6"/>',
    camera:'<path d="M4 8h3l2-3h6l2 3h3v12H4Z"/><circle cx="12" cy="14" r="3.5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    flag:'<path d="M5 21V4"/><path d="M5 4h11l-2.5 4L16 12H5"/>',
    route:'<circle cx="6" cy="6" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="M8 6H16a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h7.8"/>',
    coverage:'<path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2a10 10 0 0 0-10 10"/><circle cx="12" cy="12" r="3"/>',
    swap:'<path d="M4 7h14M14 3l4 4-4 4"/><path d="M20 17H6M10 13l-4 4 4 4"/>'
  };
  var CHECK = '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.6 2.6L16.2 9"/>';
  var WARN  = '<circle cx="12" cy="12" r="9"/><line x1="12" y1="7.6" x2="12" y2="12.8"/><circle cx="12" cy="16.2" r=".9"/>';

  var DATA = {
    globe:{ num:'01', cat:'GLOBAL REACH', title:'Global Coverage', sub:'REGIONAL OPERATIONS HUB',
      section:'Network Presence', accent:'#2f8fd6', hero:'globe',
      rows:[
        {icon:'coverage', title:'Active Country Nodes', sub:'Live deployment regions', status:{t:'ok', text:'18 ACTIVE'}},
        {icon:'swap', title:'Cross-Border Settlement', sub:'Multi-currency routing', status:{t:'ok', text:'ENABLED'}},
        {icon:'globe', title:'Localization Coverage', sub:'Language & compliance packs', status:{t:'warn', text:'92% READY'}}
      ], tags:['Africa Region','Asia Region','Americas Region'], history:'View Region History' },

    tree:{ num:'02', cat:'IMPACT LEDGER', title:'Conservation Ledger', sub:'ENVIRONMENTAL OUTCOMES',
      section:'Conservation Metrics', accent:'#2e8b57', hero:'tree',
      rows:[
        {icon:'tree', title:'Verified Hectares Protected', sub:'On-chain land registry', status:{t:'ok', text:'4,210 HA'}},
        {icon:'trend', title:'Carbon Offset Tracker', sub:'tCO2e sequestered to date', status:{t:'ok', text:'LIVE FEED'}},
        {icon:'milestone', title:'Reforestation Milestones', sub:'Planting phase completion', status:{t:'ok', text:'ACTIVE - Phase 3'}}
      ], tags:['Reforestation Zone A','Reforestation Zone B','Reforestation Zone C'], history:'View Planting History' },

    bird:{ num:'03', cat:'BIODIVERSITY', title:'Wildlife Monitor', sub:'BIODIVERSITY TRACKING',
      section:'Species Watch', accent:'#3aa7a0', hero:'bird',
      rows:[
        {icon:'bird', title:'Tagged Species Count', sub:'Sensor & camera trap network', status:{t:'ok', text:'37 SPECIES'}},
        {icon:'pie', title:'Habitat Health Index', sub:'Composite ecosystem score', status:{t:'ok', text:'8.6 / 10'}},
        {icon:'camera', title:'Poaching Alert Feed', sub:'Real-time ranger dispatch', status:{t:'ok', text:'LIVE STREAM'}}
      ], tags:['Sanctuary North','Sanctuary East','Sanctuary South'], history:'View Sighting Log' },

    drop:{ num:'04', cat:'WATER PROGRAM', title:'Water Resources', sub:'CLEAN WATER INITIATIVE',
      section:'Supply Metrics', accent:'#1e90ff', hero:'drop',
      rows:[
        {icon:'drop', title:'Wells Commissioned', sub:'Verified functional sources', status:{t:'ok', text:'126 ACTIVE'}},
        {icon:'badge', title:'Water Quality Testing', sub:'Independent lab certification', status:{t:'ok', text:'PASSED'}},
        {icon:'coverage', title:'Community Access Score', sub:'Households within 1km', status:{t:'ok', text:'94% COVERED'}}
      ], tags:['Watershed Alpha','Watershed Beta','Watershed Gamma'], history:'View Testing History' },

    shield:{ num:'05', cat:'IDENTITY & VERIFICATION', title:'Verification Status', sub:'GLOBAL IDENTITY HUB',
      section:'Identity Profiles', accent:'#dc7519', hero:'shield',
      rows:[
        {icon:'shield', title:'Dual KYC/KYB Check', sub:'Shield Check', status:{t:'ok', text:'VERIFIED'}},
        {icon:'badge', title:'Hedera Verified Badge', sub:'', status:{t:'ok', text:'ACTIVE'}, trail:'lock'},
        {icon:'wallet', title:'Social Wallet Link', sub:'Web3Auth | Magic.link', status:{t:'ok', text:'CONNECTED'}}
      ], tags:['Mathematics','Biology','Chemistry'], history:'View History' },

    lock:{ num:'06', cat:'VAULT SECURITY', title:'Access Control', sub:'SECURE VAULT SETTINGS',
      section:'Permission Layers', accent:'#6b7280', hero:'lock',
      rows:[
        {icon:'lock', title:'Multi-Sig Wallet Lock', sub:'2-of-3 signer threshold', status:{t:'ok', text:'ENABLED'}},
        {icon:'clock', title:'Session Key Expiry', sub:'Auto-revoke after 24h', status:{t:'ok', text:'ACTIVE'}},
        {icon:'wallet', title:'Cold Storage Reserve', sub:'Offline custody balance', status:{t:'warn', text:'82% LOCKED'}}
      ], tags:['Vault Alpha','Vault Beta','Vault Gamma'], history:'View Access Log' },

    sun:{ num:'07', cat:'ENERGY GRID', title:'Energy Output', sub:'RENEWABLE OPERATIONS',
      section:'Grid Performance', accent:'#f2a71b', hero:'sun',
      rows:[
        {icon:'sun', title:'Solar Array Uptime', sub:'Field station generation', status:{t:'ok', text:'99.2% ACTIVE'}},
        {icon:'lock', title:'Battery Storage Reserve', sub:'Off-grid capacity buffer', status:{t:'warn', text:'74% CHARGED'}},
        {icon:'trend', title:'Energy Credit Ledger', sub:'Tokenized surplus trading', status:{t:'ok', text:'LIVE FEED'}}
      ], tags:['Station 01','Station 02','Station 03'], history:'View Output History' },

    receipt:{ num:'08', cat:'PAYMENTS & LEDGER', title:'Payments & Ledger', sub:'DECENTRALIZED TREASURY OPERATIONS',
      section:'Transaction Control Center', accent:'#e07a3f', hero:'receipt',
      rows:[
        {icon:'wallet', title:'Hybrid Fiat vs. Crypto Payment', sub:'Stripe/MoonPay or HashPack/Kabila', status:{t:'toggle'}, trail:'swap'},
        {icon:'trend', title:'Real-time Disbursement Feed', sub:'Monitor all outgoing payment activity', status:{t:'ok', text:'LIVE FEED'}},
        {icon:'link', title:'Block Explorer Hash Links', sub:'View immutable transaction proofs', status:{t:'ok', text:'INDEXED'}, trail:'link'}
      ], tags:['Global Disbursements','Regional Disbursements','Pending Disbursements'], history:'View History' },

    milestone:{ num:'09', cat:'DECENTRALIZED VAULT', title:'Escrow & Milestones', sub:'DECENTRALIZED VAULT PROJECT',
      section:'Project Operations', accent:'#7c5cff', hero:'milestone',
      rows:[
        {icon:'receipt', title:'Smart Contract Escrow Balance', sub:'View contract value in ETH/USDC', status:{t:'ok', text:'FUNDED'}, action:'escrow'},
        {icon:'milestone', title:'Phase Roadmap Visualizer', sub:'', status:{t:'ok', text:'ACTIVE - Milestone 2'}, trail:'route', action:'roadmap'},
        {icon:'users', title:'Multi-Party Validator Sign-off', sub:'Awaiting 2/3 approvals', status:{t:'warn', text:'PENDING SIGNATURES'}, action:'signoff'}
      ], tags:['Development Sprint 4','Development Sprint 3','Development Sprint 2'], history:'View Contract History' },

    wallet:{ num:'10', cat:'TREASURY', title:'Wallet Overview', sub:'TREASURY BALANCE HUB',
      section:'Fund Allocation', accent:'#16a34a', hero:'wallet',
      rows:[
        {icon:'wallet', title:'Operating Wallet Balance', sub:'USDC / stablecoin reserve', status:{t:'warn', text:'EMPTY'}},
        {icon:'clock', title:'Payout Queue', sub:'Open Checkout sessions (24h)', status:{t:'ok', text:'0 PENDING'}},
        {icon:'pie', title:'Spend Category Breakdown', sub:'Field vs. operations split', status:{t:'ok', text:'85/15 SPLIT'}}
      ], tags:['Ledger Summary','Ledger Detail','Ledger Archive'], history:'View Ledger History' },

    handshake:{ num:'11', cat:'FIELD EXECUTION & STIPENDS', title:'Ground Team & Stipends', sub:'PROJECT EXECUTION & FUNDS',
      section:'Field Team Functions', accent:'#d97706', hero:'handshake',
      rows:[
        {icon:'pie', title:'Automated 85/15 Fund Split', sub:'Calculates field-vs-operations allocation', status:{t:'ok', text:'85% FUNDED'}},
        {icon:'handshake', title:'Execution Stipend Wallet Settings', sub:'', status:{t:'ok', text:'ACTIVE'}},
        {icon:'globe', title:'On-chain Reputation & Impact', sub:'View domain verification history', status:{t:'ok', text:'4.8 / 5.0'}}
      ], tags:['Project Domains','Project Alpha','Project Beta'], history:'View Domain History' },

    link:{ num:'12', cat:'FIELD PROOFS & AUDIT LOG', title:'Field Proofs & Audit Log', sub:'DECENTRALIZED AUDIT TRAIL',
      section:'Audit Streams', accent:'#0ea5a4', hero:'link',
      rows:[
        {icon:'camera', title:'Geotagged Photo/Video Upload', sub:'Verifiable field evidence', status:{t:'ok', text:'LIVE STREAM'}},
        {icon:'clock', title:'Hedera Consensus (HCS) Timestamp', sub:'Immutable proof of time', status:{t:'ok', text:'HASHED'}},
        {icon:'users', title:'Donor Audit/Flag Dispute Toggle', sub:'Community oversight panel', status:{t:'toggle'}, trail:'flag'}
      ], tags:['Project Delta Audit','Project Gamma Audit','Project Beta Audit'], history:'View Detailed Log' }
  };

  var CARD_IDS = Object.keys(DATA);

  var modal   = document.getElementById('uxmodal');
  var card    = document.getElementById('uxcard');
  var elNum   = document.getElementById('uxNum');
  var elCat   = document.getElementById('uxCat');
  var elTitle = document.getElementById('uxTitle');
  var elSub   = document.getElementById('uxSub');
  var elSection = document.getElementById('uxSection');
  var elRows  = document.getElementById('uxRows');
  var elHero  = document.getElementById('uxHero');
  var elPillLabel = document.getElementById('uxPillLabel');
  var elHistoryLabel = document.getElementById('uxHistoryLabel');
  var stepUp  = document.getElementById('uxStepUp');
  var stepDown= document.getElementById('uxStepDown');
  var pagerUp = document.getElementById('uxPagerUp');
  var pagerDown = document.getElementById('uxPagerDown');
  var dotsEl  = document.getElementById('uxDots');
  var prevCard= document.getElementById('uxPrevCard');
  var nextCard= document.getElementById('uxNextCard');
  var prevCardPwa = document.getElementById('uxPrevCardPwa');
  var nextCardPwa = document.getElementById('uxNextCardPwa');
  var toast   = document.getElementById('uxToast');
  var closeBtn= document.getElementById('uxClose');
  var closePwa= document.getElementById('uxClosePwa');
  var ledgerBtns = document.getElementById('uxLedgerBtns');
  var ledgerSheet = document.getElementById('uxLedgerSheet');
  var ledgerTitle = document.getElementById('uxLedgerTitle');
  var ledgerList = document.getElementById('uxLedgerList');
  var ledgerClose = document.getElementById('uxLedgerClose');
  var asidePreview = document.getElementById('uxAsidePreview');
  var balanceDock = document.getElementById('uxBalanceDock');

  var current = null, tagIndex = 0, toastTimer = null;

  function pwaPhone(){
    var r = document.documentElement;
    return r.classList.contains('embed') && innerWidth <= 760;
  }

  var LEDGER_LISTS = {
    summary: [
      { t:'Operating cash', s:'Stripe available balance', a:'$0.00' },
      { t:'Payout queue', s:'Open Checkout sessions (24h)', a:'0 pending' },
      { t:'Spend split', s:'Field ops / treasury', a:'85 / 15' },
      { t:'Restoration credit', s:'Paid one-off orders', a:'$0.00' }
    ],
    history: [
      { t:'Treasury opened', s:'Wallet Overview · live Stripe', a:'—' },
      { t:'Checkout', s:'No settled charges yet', a:'$0.00' }
    ]
  };

  function svg(paths, extra){ return '<svg viewBox="0 0 24 24"' + (extra||'') + '>' + paths + '</svg>'; }

  function renderRow(r){
    var statusHtml;
    if(r.status.t === 'toggle'){
      statusHtml = '<button class="uxtoggle" type="button"></button>';
    } else {
      var glyph = r.status.t === 'warn' ? WARN : CHECK;
      statusHtml = '<span class="uxrow-status ' + r.status.t + '">' + svg(glyph) + r.status.text + '</span>';
    }
    var trailHtml = r.trail ? '<span class="uxrow-trail">' + svg(ICON[r.trail]) + '</span>' : '';
    var isBtn = !!r.action;
    var openTag = isBtn
      ? '<button type="button" class="uxrow uxrow-btn" data-action="' + r.action + '">'
      : '<div class="uxrow">';
    var closeTag = isBtn ? '</button>' : '</div>';
    return openTag +
        '<div class="uxrow-ico">' + svg(ICON[r.icon]) + '</div>' +
        '<div class="uxrow-text"><div class="uxrow-title">' + r.title + '</div>' +
          (r.sub ? '<div class="uxrow-sub">' + r.sub + '</div>' : '') +
        '</div>' +
        '<div class="uxrow-right">' + statusHtml + trailHtml + '</div>' +
      closeTag;
  }

  function updateStepState(){
    var d = DATA[current];
    elPillLabel.textContent = d.tags[tagIndex];
    var atStart = tagIndex === 0;
    var atEnd = tagIndex === d.tags.length - 1;
    stepUp.disabled = atStart;
    stepDown.disabled = atEnd;
    stepUp.classList.toggle('active', !atStart);
    stepDown.classList.toggle('active', !atEnd);
    if (pagerUp) pagerUp.disabled = atStart;
    if (pagerDown) pagerDown.disabled = atEnd;
    if (dotsEl) {
      dotsEl.innerHTML = d.tags.map(function (_, i) {
        return '<i class="' + (i === tagIndex ? 'on' : '') + '"></i>';
      }).join('');
    }
  }

  function shiftTag(dir){
    var d = DATA[current];
    if (!d) return;
    var next = tagIndex + dir;
    if (next < 0 || next >= d.tags.length) return;
    tagIndex = next;
    updateStepState();
  }

  function cycleCard(dir){
    var i = CARD_IDS.indexOf(current);
    if (i < 0) return;
    openCard(CARD_IDS[(i + dir + CARD_IDS.length) % CARD_IDS.length]);
  }

  function openCard(id){
    var d = DATA[id];
    if(!d) return;
    current = id; tagIndex = 0;

    card.style.setProperty('--ux-accent', d.accent);
    elNum.textContent = d.num;
    elCat.textContent = d.cat;
    elTitle.textContent = d.title;
    elSub.textContent = d.sub;
    elSection.textContent = d.section;
    elRows.innerHTML = d.rows.map(renderRow).join('');
    if (elHero) {
      elHero.innerHTML = svg(ICON[d.hero], ' style="stroke:' + d.accent + ';stroke-width:1.3"');
      elHero.classList.remove('preview');
    }
    elHistoryLabel.textContent = d.history;
    paintAside(d);
    updateStepState();
    syncCheckout(id);
    if (ledgerBtns) {
      var showLedger = pwaPhone() && id === 'wallet';
      ledgerBtns.hidden = !showLedger;
      ledgerBtns.classList.toggle('show', showLedger);
    }
    closeLedgerSheet();

    [].slice.call(document.querySelectorAll('.icon-wrap')).forEach(function(o){ o.classList.remove('show'); });

    modal.classList.add('open');
  }
  window.openUxCard = openCard;

  function closeLedgerSheet(){
    if (!ledgerSheet) return;
    ledgerSheet.classList.remove('open');
    ledgerSheet.hidden = true;
  }

  function paintAside(d){
    var wallet = current === 'wallet';
    if (balanceDock) balanceDock.hidden = !wallet;
    if (!asidePreview) return;
    asidePreview.hidden = wallet;
    if (wallet || !d) return;
    var kpis = (d.rows || []).slice(0, 3).map(function(r){
      var label = (r.status && r.status.text) ? r.status.text : '—';
      var unit = String(r.title || '').split(' ').slice(0, 2).join(' ').toUpperCase();
      return '<div class="tpop-kpi"><b>' + label + '</b><i>' + unit + '</i></div>';
    }).join('');
    asidePreview.innerHTML =
      '<div class="tpop-h">' +
        '<span class="tpop-rank">' + d.num + '</span>' +
        '<div><b>' + String(d.title || '').toUpperCase() + '</b><i>' + d.sub + '</i></div>' +
        '<span class="tpop-ph">' + String(d.cat || '').split(' ')[0] + '</span>' +
      '</div>' +
      '<div class="tpop-kpis">' + kpis + '</div>' +
      '<div class="tpop-fund">' + d.section + '</div>';
  }

  function openLedgerSheet(kind){
    if (!ledgerSheet || !ledgerList) return;
    var title = kind === 'history' ? 'Ledger History' : 'Ledger Summary';
    var rows = LEDGER_LISTS[kind] || LEDGER_LISTS.summary;
    if (ledgerTitle) ledgerTitle.textContent = title;
    ledgerList.innerHTML = rows.map(function(r){
      return '<li><span>' + r.t + '<i>' + r.s + '</i></span><b>' + r.a + '</b></li>';
    }).join('');
    ledgerSheet.hidden = false;
    ledgerSheet.classList.add('open');
  }

  function closeCard(){
    closeLedgerSheet();
    modal.classList.remove('open');
    if (elHero) elHero.classList.remove('preview');
  }

  document.querySelectorAll('.icon-tip').forEach(function(tip){
    tip.addEventListener('click', function(ev){
      ev.stopPropagation();
      openCard(tip.dataset.card);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeCard);
  if (closePwa) closePwa.addEventListener('click', closeCard);
  if (ledgerClose) ledgerClose.addEventListener('click', closeLedgerSheet);
  if (ledgerSheet) ledgerSheet.addEventListener('click', function(ev){
    if (ev.target === ledgerSheet) closeLedgerSheet();
  });
  if (ledgerBtns) ledgerBtns.addEventListener('click', function(ev){
    var btn = ev.target.closest('[data-ledger]');
    if (!btn) return;
    openLedgerSheet(btn.getAttribute('data-ledger'));
  });
  if (balanceDock) balanceDock.addEventListener('click', function(ev){
    var led = ev.target.closest('[data-ledger]');
    if (led) {
      openLedgerSheet(led.getAttribute('data-ledger'));
      return;
    }
    if (ev.target.id === 'uxFundRefresh' || ev.target.id === 'uxPayRefresh') {
      if (window.GooWallet) window.GooWallet.reload();
    }
  });
  modal.addEventListener('click', function(ev){ if(ev.target === modal) closeCard(); });

  stepUp.addEventListener('click', function(){ shiftTag(-1); });
  stepDown.addEventListener('click', function(){ shiftTag(1); });
  if (pagerUp) pagerUp.addEventListener('click', function(){ shiftTag(-1); });
  if (pagerDown) pagerDown.addEventListener('click', function(){ shiftTag(1); });
  if (prevCard) prevCard.addEventListener('click', function(){ cycleCard(-1); });
  if (nextCard) nextCard.addEventListener('click', function(){ cycleCard(1); });
  if (prevCardPwa) prevCardPwa.addEventListener('click', function(){ cycleCard(-1); });
  if (nextCardPwa) nextCardPwa.addEventListener('click', function(){ cycleCard(1); });

  elRows.addEventListener('click', function(ev){
    var t = ev.target.closest('.uxtoggle');
    if(t){ t.classList.toggle('on'); return; }
    var row = ev.target.closest('[data-action]');
    if(!row) return;
    var act = row.dataset.action;
    if(act === 'roadmap'){
      if(window.openTerraRoadmap) window.openTerraRoadmap();
    } else if(act === 'escrow'){
      showToast('Escrow funded · 2.3M USDC');
    } else if(act === 'signoff'){
      showToast('Awaiting 2 of 3 signatures');
    }
  });

  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 1700);
  }

  var checkoutWrap = document.getElementById('uxCheckoutWrap');

  function applyLedgerToCard(ledger, meta) {
    var rows = DATA.wallet.rows;
    if (!rows) return;
    if (!ledger) {
      rows[0].sub = 'Connect treasury API to show live Stripe balances';
      if (current === 'wallet') elRows.innerHTML = rows.map(renderRow).join('');
      return;
    }
    var fund = ledger.fund || {};
    var personal = ledger.personal || {};
    var avail = meta && meta.avail ? meta.avail : '$0.00';
    var settled = meta && meta.settled ? meta.settled : '$0.00';
    var split = meta && meta.split ? meta.split : '85/15';
    var pendingCount = meta && meta.pendingCount != null ? meta.pendingCount : 0;
    rows[0].sub = avail + ' · live Stripe available';
    rows[0].status = { t: fund.available && fund.available.cents > 0 ? 'ok' : 'warn', text: (fund.available && fund.available.status) || 'EMPTY' };
    rows[1].sub = 'Open Checkout sessions (24h)';
    rows[1].status = { t: pendingCount > 0 ? 'warn' : 'ok', text: pendingCount + ' PENDING' };
    rows[2].status = { t: 'ok', text: fund.split && fund.split.label ? fund.split.label : '85/15 SPLIT' };
    LEDGER_LISTS.summary[0].a = avail;
    LEDGER_LISTS.summary[1].a = pendingCount + ' pending';
    LEDGER_LISTS.summary[2].a = split;
    LEDGER_LISTS.summary[3].a = settled;
    if (personal.recent && personal.recent.length) {
      LEDGER_LISTS.history = personal.recent.map(function(r){
        return { t: r.status === 'paid' ? 'Payout settled' : 'Payout ' + r.status, s: (personal.email || 'order') + ' · ' + r.id.slice(-8), a: r.amount };
      });
    } else {
      LEDGER_LISTS.history = [
        { t: 'Checkout', s: personal.email ? personal.email + ' · no orders yet' : 'No settled charges yet', a: '$0.00' }
      ];
    }
    if (current === 'wallet') elRows.innerHTML = rows.map(renderRow).join('');
  }

  function syncCheckout(id) {
    if (!checkoutWrap) return;
    var on = id === 'wallet';
    checkoutWrap.classList.toggle('show', on);
    checkoutWrap.hidden = !on;
    if (window.GooWallet) window.GooWallet.setActive(on);
  }

  if (window.GooWallet) {
    window.GooWallet.bind({
      source: 'desktop',
      onPaint: applyLedgerToCard,
      onError: function (msg) { showToast(msg); }
    });
  }

  document.querySelectorAll('.uxaction').forEach(function(btn){
    btn.addEventListener('click', function(){
      var act = btn.dataset.act;
      var d = DATA[current];
      if(act === 'preview'){
        if (elHero) elHero.classList.toggle('preview');
        showToast(elHero && elHero.classList.contains('preview') ? 'Previewing asset' : 'Preview closed');
      } else if(act === 'download'){
        var svgText = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="' + d.accent + '" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round">' + ICON[d.hero] + '</svg>';
        var blob = new Blob([svgText], {type:'image/svg+xml'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = d.title.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '.svg';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
        showToast('Asset downloaded');
      } else if(act === 'share'){
        var link = 'https://cbcnotebooks.app/card/' + current;
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(link).then(function(){ showToast('Link copied'); }, function(){ showToast(link); });
        } else {
          showToast(link);
        }
      }
    });
  });

  addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    var ov = document.getElementById('terraOverlay');
    if(ov && ov.classList.contains('open')){
      if(window.closeTerraRoadmap) window.closeTerraRoadmap();
      return;
    }
    if(modal.classList.contains('open')) closeCard();
  });
})();

/* ------------------------------------------------------------- card list */
function pictureHtml(c, eager){
  if(!c.img) return '';
  var local = c.img.indexOf('assets/images/') === 0;
  var load = eager ? 'eager' : 'lazy';
  var pri = eager ? ' fetchpriority="high"' : '';
  var img = '<img src="' + c.img + '" alt="" width="480" height="320" loading="' + load + '" decoding="async"' + pri + '>';
  if(!local) return img;
  var webp = c.img.replace(/\.jpe?g$/i, '.webp');
  var sm = c.img.replace(/\.jpe?g$/i, '-sm.webp');
  return '<picture>' +
    '<source type="image/webp" media="(max-width:760px)" srcset="' + sm + '">' +
    '<source type="image/webp" media="(min-width:761px)" srcset="' + webp + '">' +
    img +
  '</picture>';
}

var moved = false;
function buildCard(c, idx){
  var b = document.createElement('button');
  b.className = 'card';
  b.type = 'button';
  b.dataset.id = c.id;
  var eager = idx != null && idx < 3;
  b.innerHTML =
    '<div class="shot" style="background:' + c.fall + '">' +
      pictureHtml(c, eager) +
    '</div>' +
    '<span class="cap">' + c.l1 + '<br>' + c.l2 + '</span>';
  var im = b.querySelector('img');
  if(im) im.addEventListener('error', function(){ im.remove(); });
  b.addEventListener('click', function(){ if(moved){ moved = false; return; } open(c, b); });
  return b;
}

function hStrip(){
  var r = document.documentElement;
  var pwa = r.classList.contains('embed') || r.classList.contains('from-pwa');
  return pwa && innerWidth <= 760;
}

function sizeCards(){
  // card height is 15.1% of the frame, gap 1.36% — same size on PWA
  var h = innerHeight * 0.151;
  var g = innerHeight * 0.0136;
  var strip = hStrip();
  var w = Math.max(innerWidth * 0.14, h * 1.65);
  [].forEach.call(track.querySelectorAll('.card'), function(el){
    el.style.height = h + 'px';
    if(strip){
      el.style.width = w + 'px';
      el.style.marginBottom = '0';
      el.style.marginRight = g + 'px';
    } else {
      el.style.width = '';
      el.style.marginRight = '';
      el.style.marginBottom = g + 'px';
    }
  });
  return strip ? (w + g) : (h + g);
}

CARDS.forEach(function(c, i){ track.appendChild(buildCard(c, i)); });
CARDS.forEach(function(c){ track.appendChild(buildCard(c, 99)); });

var pitch = sizeCards();
var loopLen = pitch * CARDS.length;
addEventListener('resize', function(){ pitch = sizeCards(); loopLen = pitch * CARDS.length; });

var off = 0, vel = 0, drift = 0.22, dragging = false, lastY = 0, lastX = 0, boost = 0;
function render(){
  if(!dragging){ off += drift + vel; vel *= 0.93; }
  if(off >= loopLen) off -= loopLen;
  if(off < 0) off += loopLen;
  var strip = hStrip();
  track.style.transform = strip
    ? 'translate3d(' + (-off).toFixed(2) + 'px,0,0)'
    : 'translate3d(0,' + (-off).toFixed(2) + 'px,0)';

  var p = (off % loopLen) / loopLen;
  var sbEl = document.getElementById('sb');
  var trackLen = sbEl ? (strip ? sbEl.clientWidth : sbEl.clientHeight) : 0;
  sbThumb.style.transform = strip
    ? 'translateX(' + (p * trackLen * 0.78).toFixed(1) + 'px)'
    : 'translateY(' + (p * trackLen * 0.78).toFixed(1) + 'px)';

  // the globe visibly scales up while the list moves (frame 0 vs frame 90)
  var speed = Math.min(Math.abs(drift + vel) / 6, 1);
  boost += (speed - boost) * 0.06;
  document.getElementById('globeWrap').querySelector('.globe')
    .style.setProperty('--gscale', (1 + boost * 0.10).toFixed(4));
  if(!app.classList.contains('globe-focus')) window.__spinBoost = boost * 0.004;

  requestAnimationFrame(render);
}
render();

list.addEventListener('wheel', function(e){
  e.preventDefault();
  var delta = hStrip() ? (e.deltaX || e.deltaY) : e.deltaY;
  vel += delta * 0.06;
  vel = Math.max(-26, Math.min(26, vel));
}, {passive:false});

var downY = 0, downX = 0, armed = false;
list.addEventListener('pointerdown', function(e){
  armed = true; moved = false; downY = lastY = e.clientY; downX = lastX = e.clientX;
});
list.addEventListener('pointermove', function(e){
  if(!armed) return;
  var strip = hStrip();
  var dx = e.clientX - downX, dy = e.clientY - downY;
  if(!dragging && Math.abs(strip ? dx : dy) > 4){ dragging = true; moved = true; }
  if(!dragging) return;
  if(strip){
    var d = e.clientX - lastX; lastX = e.clientX;
    off -= d; vel = -d * 0.5;
  } else {
    var d2 = e.clientY - lastY; lastY = e.clientY;
    off -= d2; vel = -d2 * 0.5;
  }
});
['pointerup','pointercancel','pointerleave'].forEach(function(t){
  list.addEventListener(t, function(){ armed = false; dragging = false; });
});

/* -------------------------------------------------- detail + FLIP motion */
var openState = false;

function open(c, cardEl){
  if(openState) return;
  openState = true;
  if(c.cityId) window.__chosenCity = c.cityId;
  if(window.GOO && GOO.Notify) GOO.Notify.toast({ tone:'blue', title:c.l1+' '+c.l2, sub:'Field card unlocked.', n:'●' });

  dTitle.innerHTML = c.l1 + '<br>' + c.l2;
  dCopy.textContent = c.text;
  dShot.style.background = c.fall;
  if(c.img){ dImg.src = c.img; dImg.style.display = ''; }
  else { dImg.removeAttribute('src'); dImg.style.display = 'none'; }
  dCamp.textContent = c.campaign || '';
  dCamp.style.display = c.campaign ? '' : 'none';

  var from  = cardEl.querySelector('.shot').getBoundingClientRect();
  var fromT = cardEl.querySelector('.cap').getBoundingClientRect();

  app.classList.add('detail');

  var panelEl = document.getElementById('panel');
  panelEl.style.transition = 'none';
  panelEl.style.transform = 'translateY(0)';

  // measure targets after the class flip, then run the FLIP
  requestAnimationFrame(function(){
    var to  = dShot.getBoundingClientRect();
    var toT = dTitle.getBoundingClientRect();
    panelEl.style.transform = 'translateY(46%)';
    panelEl.offsetHeight;
    panelEl.style.transition = '';
    panelEl.style.transform = '';

    var fly = document.createElement('div');
    fly.className = 'flyer';
    fly.style.cssText =
      'left:' + from.left + 'px;top:' + from.top + 'px;' +
      'width:' + from.width + 'px;height:' + from.height + 'px;' +
      'background:' + c.fall + ';';
    if(c.img) fly.innerHTML = '<img src="' + c.img + '" alt="">';
    document.body.appendChild(fly);

    var ft = document.createElement('div');
    ft.className = 'flytitle';
    ft.innerHTML = c.l1 + '<br>' + c.l2;
    ft.style.cssText =
      'left:' + fromT.left + 'px;top:' + fromT.top + 'px;' +
      'font-size:' + getComputedStyle(cardEl.querySelector('.cap')).fontSize + ';';
    document.body.appendChild(ft);

    var titleScale = toT.width && fromT.width
      ? parseFloat(getComputedStyle(dTitle).fontSize) /
        parseFloat(getComputedStyle(cardEl.querySelector('.cap')).fontSize)
      : 1;

    fly.animate([
      { transform:'translate(0,0)', width:from.width + 'px', height:from.height + 'px' },
      { transform:'translate(' + (to.left - from.left) + 'px,' + (to.top - from.top) + 'px)',
        width:to.width + 'px', height:to.height + 'px' }
    ], { duration:900, easing:'cubic-bezier(.66,0,.2,1)', fill:'forwards' });

    ft.animate([
      { transform:'translate(0,0) scale(1)' },
      { transform:'translate(' + (toT.left - fromT.left) + 'px,' + (toT.top - fromT.top) + 'px) scale(' + titleScale + ')' }
    ], { duration:900, easing:'cubic-bezier(.66,0,.2,1)', fill:'forwards' });

    setTimeout(function(){
      dTitle.style.opacity = '1';
      fly.remove(); ft.remove();
    }, 880);
  });
}

function close(){
  if(!openState) return;
  openState = false;
  dTitle.style.opacity = '0';
  app.classList.remove('detail');
}
document.getElementById('back').addEventListener('click', close);
addEventListener('keydown', function(e){
  if(e.key !== 'Escape') return;
  var ov = document.getElementById('terraOverlay');
  if(ov && ov.classList.contains('open')) return;
  close();
});

(function(){
  var wrap = document.getElementById('globeWrap');
  var plus = document.getElementById('gPlus');
  var minus = document.getElementById('gMinus');
  var layerBtn = document.getElementById('gLayersBtn');
  var panel = document.getElementById('gLayersPanel');
  var mul = 0.62;
  function applyMul(){
    if(wrap) wrap.style.setProperty('--gmul', mul.toFixed(3));
  }
  applyMul();
  if(plus) plus.addEventListener('click', function(){
    mul = Math.min(1.28, mul * 1.12);
    applyMul();
  });
  if(minus) minus.addEventListener('click', function(){
    mul = Math.max(0.62, mul / 1.12);
    applyMul();
  });
  if(layerBtn && panel){
    layerBtn.addEventListener('click', function(e){
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    panel.querySelectorAll('[data-tex]').forEach(function(btn){
      btn.addEventListener('click', function(){
        panel.querySelectorAll('[data-tex]').forEach(function(b){ b.classList.remove('selected'); });
        btn.classList.add('selected');
        if(window.__globeTex) window.__globeTex(btn.dataset.tex);
        panel.classList.remove('open');
      });
    });
    document.addEventListener('click', function(){ panel.classList.remove('open'); });
  }
})();

})();
