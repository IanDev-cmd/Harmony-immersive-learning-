/* Leaflet coastal map, overlays, and roadmap */
(function(){
  'use strict';
  var overlay = document.getElementById('terraOverlay');
  if(!overlay) return;

  function loadLeaflet(){
    if(window.L) return Promise.resolve();
    if(window.GOOLoad) return window.GOOLoad.leaflet();
    return Promise.reject(new Error('Leaflet loader missing'));
  }

  var GLYPH = {
    barrier:'<path d="M3 20h18"/><path d="M4 20V10l4-4 4 4 4-4 4 4v10"/>',
    coral:'<path d="M12 21v-6"/><path d="M12 15c-3-3-6-4-7-8 3 0 5 3 7 8"/><path d="M12 15c3-3 6-4 7-8-3 0-5 3-7 8"/>',
    mangrove:'<path d="M12 22v-7"/><path d="M12 15c-4-3-6-8-4-12 3 2 4 6 4 12"/><path d="M12 15c4-3 6-8 4-12-3 2-4 6-4 12"/><path d="M5 18c4-2 10-2 14 0"/>',
    plastic:'<path d="M12 3v5"/><path d="M7 8h10l1.2 13H5.8L7 8Z"/><circle cx="12" cy="15" r="2.2"/>',
    kelp:'<path d="M12 22V8"/><path d="M12 14c-4-2-6-6-4-10"/><path d="M12 12c4-2 6-5 5-9"/>',
    energy:'<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>'
  };

  var CITIES = [
    {id:'jakarta', name:'Jakarta', country:'Indonesia', sector:'Bay North · Erosion Line',
      ll:[-6.2088,106.8456], rank:1, risk:'critical', ocean:[1,0], marker:'barrier',
      phase:1, phaseMax:4, milestone:'Bay Erosion Barrier Construction', fund:310000,
      kpis:[{n:'8.5',u:'KM'},{n:'42k',u:'PPL'},{n:'12',u:'IoT'}],
      tags:['barriers'], shoreline:18.4, cleanups:1, operators:28,
      hash:'0.0.78421@1726584400.441221903'},
    {id:'manila', name:'Manila', country:'Philippines', sector:'Manila Bay · Reef Line',
      ll:[14.5995,120.9842], rank:2, risk:'critical', ocean:[0,-1], marker:'coral',
      phase:3, phaseMax:4, milestone:'Artificial Reef Structure Deployment', fund:145000,
      kpis:[{n:'2.5k',u:'CORAL'},{n:'+38%',u:'FISH'},{n:'15',u:'CO-OP'}],
      tags:['coral'], shoreline:9.2, cleanups:2, operators:15,
      hash:'0.0.78422@1726584412.882901334'},
    {id:'hcmc', name:'Ho Chi Minh', country:'Vietnam', sector:'Mekong Delta · Saline Edge',
      ll:[10.8231,106.6297], rank:3, risk:'critical', ocean:[-0.7,0.7], marker:'mangrove',
      phase:2, phaseMax:4, milestone:'Delta Sediment & Vegetation Replanting', fund:210000,
      kpis:[{n:'85k',u:'TREES'},{n:'24',u:'KM'},{n:'520',u:'FAM'}],
      tags:['mangroves','barriers'], shoreline:24.0, cleanups:1, operators:42,
      hash:'0.0.78423@1726584425.109334872'},
    {id:'lagos', name:'Lagos', country:'Nigeria', sector:'Barrier Island · Atlantic',
      ll:[6.5244,3.3792], rank:4, risk:'critical', ocean:[-1,0], marker:'plastic',
      phase:2, phaseMax:4, milestone:'Floating Waste Trap Deployment', fund:250000,
      kpis:[{n:'310t',u:'PLASTIC'},{n:'14.2',u:'KM'},{n:'4',u:'SKIM'}],
      tags:['plastic','barriers'], shoreline:14.2, cleanups:4, operators:24,
      hash:'0.0.78424@1726584438.551002119'},
    {id:'miami', name:'Miami', country:'USA', sector:'Biscayne · Living Shore',
      ll:[25.7617,-80.1918], rank:5, risk:'elevated', ocean:[0,1], marker:'coral',
      phase:2, phaseMax:4, milestone:'Living Shoreline Hybrid Modules', fund:400000,
      kpis:[{n:'1.2k',u:'CORAL'},{n:'6.8',u:'KM'},{n:'99.8',u:'%IOT'}],
      tags:['coral','barriers'], shoreline:6.8, cleanups:1, operators:18,
      hash:'0.0.78425@1726584451.773448201'},
    {id:'mumbai', name:'Mumbai', country:'India', sector:'Mithi Estuary · Creek',
      ll:[19.0760,72.8777], rank:6, risk:'elevated', ocean:[-0.3,-1], marker:'plastic',
      phase:3, phaseMax:4, milestone:'Mithi River Estuary Reclaim', fund:175000,
      kpis:[{n:'145t',u:'WASTE'},{n:'600',u:'HA'},{n:'8',u:'TEL'}],
      tags:['plastic'], shoreline:12.5, cleanups:3, operators:22,
      hash:'0.0.78426@1726584464.220198774'},
    {id:'mombasa', name:'Mombasa', country:'Kenya', sector:'Kilifi Coastal Line',
      ll:[-4.0435,39.6682], rank:7, risk:'elevated', ocean:[0,1], marker:'mangrove',
      phase:3, phaseMax:4, milestone:'Community Estuary Replanting', fund:120000,
      kpis:[{n:'120k',u:'SEED'},{n:'85t',u:'WASTE'},{n:'320',u:'OPS'}],
      tags:['mangroves','plastic'], shoreline:16.4, cleanups:2, operators:86,
      hash:'0.0.78427@1726584477.998112045'},
    {id:'sydney', name:'Sydney', country:'Australia', sector:'Harbour · Living Seawall',
      ll:[-33.8688,151.2093], rank:8, risk:'managed', ocean:[0,1], marker:'barrier',
      phase:4, phaseMax:4, milestone:'Living Seawall Tile Expansion', fund:220000,
      kpis:[{n:'850',u:'TILE'},{n:'12.5',u:'HA'},{n:'45',u:'SPP'}],
      tags:['barriers','coral'], shoreline:11.2, cleanups:1, operators:22,
      hash:'0.0.78428@1726584490.334889120'},
    {id:'capetown', name:'Cape Town', country:'South Africa', sector:'Seaforest Sanctuary',
      ll:[-33.9249,18.4241], rank:9, risk:'managed', ocean:[-0.5,-0.85], marker:'kelp',
      phase:4, phaseMax:4, milestone:'Great African Seaforest Audit', fund:180000,
      kpis:[{n:'4.2k',u:'HA'},{n:'92',u:'SPP'},{n:'18',u:'DRONE'}],
      tags:['mangroves'], shoreline:8.6, cleanups:1, operators:18,
      hash:'0.0.78429@1726584503.667221908'},
    {id:'rotterdam', name:'Rotterdam', country:'Netherlands', sector:'Estuarine Bio-Parks',
      ll:[51.9244,4.4777], rank:10, risk:'managed', ocean:[0.5,-0.85], marker:'energy',
      phase:4, phaseMax:4, milestone:'Estuarine Biodiversity Parks', fund:290000,
      kpis:[{n:'12',u:'ISLE'},{n:'1.8k',u:'MWH'},{n:'100',u:'%HCS'}],
      tags:['barriers'], shoreline:21.2, cleanups:2, operators:45,
      hash:'0.0.78430@1726584516.102334556'}
  ];
  window.CITIES = CITIES;

  var SCHOOLS = [
    {city:'jakarta', type:'uni', name:'BINUS University', ll:[-6.2019,106.7820]},
    {city:'jakarta', type:'uni', name:'Universitas Trisakti', ll:[-6.1684,106.7902]},
    {city:'jakarta', type:'hs', name:'SMA Negeri 8 Jakarta', ll:[-6.2374,106.8473]},
    {city:'jakarta', type:'hs', name:'SMA Negeri 70 Jakarta', ll:[-6.2411,106.7994]},
    {city:'manila', type:'uni', name:'UP Manila', ll:[14.5772,120.9859]},
    {city:'manila', type:'uni', name:'De La Salle University', ll:[14.5642,120.9932]},
    {city:'manila', type:'uni', name:'University of Santo Tomas', ll:[14.6097,120.9893]},
    {city:'manila', type:'hs', name:'Manila Science High School', ll:[14.5912,120.9814]},
    {city:'hcmc', type:'uni', name:'RMIT Vietnam', ll:[10.7295,106.6940]},
    {city:'hcmc', type:'uni', name:'UEH University', ll:[10.7800,106.6930]},
    {city:'hcmc', type:'hs', name:'Le Hong Phong High School', ll:[10.7752,106.6798]},
    {city:'hcmc', type:'hs', name:'Nguyen Thi Minh Khai HS', ll:[10.7768,106.6954]},
    {city:'lagos', type:'uni', name:'University of Lagos', ll:[6.5158,3.3873]},
    {city:'lagos', type:'uni', name:'Lagos State University', ll:[6.4692,3.2004]},
    {city:'lagos', type:'hs', name:"King's College Lagos", ll:[6.4501,3.3960]},
    {city:'lagos', type:'hs', name:'CMS Grammar School', ll:[6.4552,3.3901]},
    {city:'miami', type:'uni', name:'University of Miami', ll:[25.7217,-80.2793]},
    {city:'miami', type:'uni', name:'Florida International Univ.', ll:[25.7541,-80.3733]},
    {city:'miami', type:'hs', name:'Miami Beach Senior High', ll:[25.7954,-80.1331]},
    {city:'miami', type:'hs', name:'MAST Academy', ll:[25.7324,-80.1622]},
    {city:'mumbai', type:'uni', name:'University of Mumbai', ll:[18.9297,72.8331]},
    {city:'mumbai', type:'uni', name:"St. Xavier's College", ll:[18.9433,72.8314]},
    {city:'mumbai', type:'uni', name:'IIT Bombay', ll:[19.1334,72.9154]},
    {city:'mumbai', type:'hs', name:'Cathedral & John Connon', ll:[18.9378,72.8334]},
    {city:'mombasa', type:'uni', name:'Technical Univ. of Mombasa', ll:[-4.0369,39.6684]},
    {city:'mombasa', type:'uni', name:'Pwani University', ll:[-3.6274,39.8561]},
    {city:'mombasa', type:'hs', name:'Mama Ngina Girls High', ll:[-4.0621,39.6772]},
    {city:'mombasa', type:'hs', name:'Allidina Visram High School', ll:[-4.0532,39.6664]},
    {city:'sydney', type:'uni', name:'University of Sydney', ll:[-33.8883,151.1873]},
    {city:'sydney', type:'uni', name:'UTS', ll:[-33.8832,151.2005]},
    {city:'sydney', type:'uni', name:'UNSW', ll:[-33.9173,151.2312]},
    {city:'sydney', type:'hs', name:'Sydney Boys High School', ll:[-33.8943,151.2198]},
    {city:'capetown', type:'uni', name:'University of Cape Town', ll:[-33.9577,18.4612]},
    {city:'capetown', type:'uni', name:'CPUT Cape Town', ll:[-33.9324,18.4298]},
    {city:'capetown', type:'hs', name:'SACS High School', ll:[-33.9701,18.4624]},
    {city:'capetown', type:'hs', name:'Rondebosch Boys High', ll:[-33.9612,18.4781]},
    {city:'rotterdam', type:'uni', name:'Erasmus University', ll:[51.9180,4.5258]},
    {city:'rotterdam', type:'uni', name:'Rotterdam UAS', ll:[51.9172,4.4831]},
    {city:'rotterdam', type:'hs', name:'Gymnasium Erasmianum', ll:[51.9174,4.4692]},
    {city:'rotterdam', type:'hs', name:'Wolfert Tweetalig', ll:[51.9051,4.4678]}
  ];
  var schoolsReady = null;
  function loadSchools(){
    if(schoolsReady) return schoolsReady;
    schoolsReady = fetch('assets/maps/schools.geojson').then(function(r){
      if(!r.ok) throw new Error('schools');
      return r.json();
    }).then(function(gj){
      var next = (gj.features || []).map(function(f){
        var p = f.properties || {};
        var c = f.geometry && f.geometry.coordinates;
        if(!c) return null;
        return { city:p.city, type:p.type, name:p.name, ll:[c[1], c[0]] };
      }).filter(Boolean);
      if(next.length) SCHOOLS = next;
      return SCHOOLS;
    }).catch(function(){ return SCHOOLS; });
    return schoolsReady;
  }

  var EDU_GLYPH = {
    hs:'<path d="M3 10l9-5 9 5-9 5-9-5Z"/><path d="M7 12.2V17c2 1.2 4 1.8 5 1.8S15 18.2 17 17v-4.8"/>',
    uni:'<path d="M3 10l9-5 9 5-9 5-9-5Z"/><path d="M12 15v5"/><path d="M8 21h8"/>'
  };

  var filters = { mangroves:true, coral:true, plastic:true, barriers:true, edu:true };
  var map, satLayer, streetLayer, topoLayer, heatTemp, heatPlastic, riskLayer, routeLayer, markerLayer, eduLayer;
  var currentBase = 'sat';
  var ready = false;
  var toastTimer = null;
  var heatLoading = false;
  var heatWaiters = [];

  var COASTS = {
    jakarta:[[-6.092,106.735],[-6.100,106.762],[-6.108,106.792],[-6.116,106.822],[-6.122,106.848],[-6.124,106.872],[-6.118,106.900],[-6.108,106.932],[-6.096,106.962],[-6.088,106.990]],
    manila:[[14.720,120.932],[14.680,120.942],[14.640,120.950],[14.610,120.958],[14.580,120.972],[14.560,120.984],[14.530,120.992],[14.500,120.998],[14.470,121.002]],
    hcmc:[[10.790,106.748],[10.760,106.762],[10.720,106.780],[10.680,106.798],[10.620,106.828],[10.560,106.858],[10.500,106.888],[10.450,106.918],[10.400,106.948]],
    lagos:[[6.393,3.210],[6.398,3.260],[6.403,3.310],[6.407,3.360],[6.410,3.400],[6.414,3.440],[6.420,3.490],[6.425,3.540],[6.429,3.590],[6.432,3.640]],
    miami:[[25.930,-80.121],[25.900,-80.120],[25.860,-80.121],[25.820,-80.126],[25.790,-80.130],[25.770,-80.131],[25.750,-80.134],[25.730,-80.142],[25.705,-80.156],[25.680,-80.168]],
    mumbai:[[19.175,72.795],[19.140,72.808],[19.105,72.818],[19.070,72.821],[19.035,72.818],[18.995,72.816],[18.960,72.821],[18.930,72.826],[18.905,72.810],[18.875,72.793]],
    mombasa:[[-3.880,39.782],[-3.910,39.768],[-3.940,39.755],[-3.970,39.742],[-4.000,39.728],[-4.020,39.712],[-4.035,39.698],[-4.043,39.688],[-4.052,39.680],[-4.062,39.676],[-4.078,39.670],[-4.100,39.662],[-4.130,39.654],[-4.170,39.644],[-4.220,39.628],[-4.270,39.598]],
    sydney:[[-33.848,151.225],[-33.852,151.218],[-33.856,151.215],[-33.860,151.212],[-33.864,151.209],[-33.868,151.207],[-33.872,151.201],[-33.876,151.196],[-33.882,151.192]],
    capetown:[[-33.880,18.402],[-33.895,18.388],[-33.908,18.378],[-33.918,18.375],[-33.925,18.377],[-33.938,18.372],[-33.952,18.368],[-33.970,18.360],[-33.995,18.348]],
    rotterdam:[[51.918,4.120],[51.910,4.180],[51.902,4.250],[51.898,4.320],[51.900,4.380],[51.905,4.430],[51.910,4.480],[51.912,4.530],[51.905,4.590]]
  };

  var PHASE_ICON = {
    doc:'<path d="M8 3h6l4 4v14H8Z"/><path d="M14 3v4h4"/><path d="M10 12h6M10 16h5"/>',
    person:'<circle cx="12" cy="8" r="3"/><path d="M6 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/>',
    group:'<circle cx="9" cy="9" r="2.4"/><circle cx="16" cy="9.2" r="2"/><path d="M4.5 18c.4-2.6 2.4-4 4.6-4s4 1.3 4.4 3.6"/><path d="M13.2 14.4c1.8-.2 3.6.8 4.3 3.6"/>',
    moon:'<path d="M15 4.5A8.2 8.2 0 1 0 20 14 6.4 6.4 0 0 1 15 4.5Z"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M12 4.2v2.2M12 17.6v2.2M4.2 12h2.2M17.6 12h2.2M6.4 6.4l1.6 1.6M16 16l1.6 1.6M17.6 6.4l-1.6 1.6M8 16l-1.6 1.6"/>',
    brain:'<path d="M9.2 6.2a3.2 3.2 0 0 1 5.6 0 3 3 0 0 1 3.4 4.2 3.1 3.1 0 0 1-1.4 5.4v2.4H9.2v-2.4A3.1 3.1 0 0 1 7.8 10.4 3 3 0 0 1 9.2 6.2Z"/><path d="M12 6.5v13"/>',
    pin:'<path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"/><circle cx="12" cy="11" r="1.8"/><path d="M16.8 6.2c1.5.2 2.8 1 3.4 2.4"/>',
    globe:'<circle cx="12" cy="12" r="7.2"/><path d="M5 12h14M12 5c2.2 2.2 3.3 4.6 3.3 7s-1.1 4.8-3.3 7c-2.2-2.2-3.3-4.6-3.3-7S9.8 7.2 12 5Z"/><circle cx="9.2" cy="8.4" r="1.1"/><circle cx="15.2" cy="9.2" r="1"/>'
  };

  var PHASES = [
    {n:1, short:'APPROVAL', title:'Local Approval & Community Onboarding', sub:'Secure municipal permits, engage community leaders, and onboard local field teams.', icon:'doc'},
    {n:2, short:'SURVEY', title:'Site Reconnaissance & Geospatial Mapping', sub:'Survey target coastal/river zones, mark pollution hot spots, and set GIS coordinates.', icon:'person'},
    {n:3, short:'DEPLOY', title:'Volunteer & Worker Group Deployment', sub:'Assemble field units, distribute gear, and assign operational sectors.', icon:'group'},
    {n:4, short:'CLEANUP', title:'Site Cleanup & Waste Extraction', sub:'Execute collection drives and clear plastic along mapped shorelines.', icon:'moon'},
    {n:5, short:'BINS', title:'Waste Bin & Collection Hub Installation', sub:'Place smart bins and containment booms at strategic hot spots.', icon:'gear'},
    {n:6, short:'AUDIT', title:'Waste Audit, Weighing & Sorting', sub:'Categorize PET, HDPE, microplastics and record verified weights.', icon:'brain'},
    {n:7, short:'PAYOUT', title:'Treasury Payouts & Stipend Disbursement', sub:'Distribute stipends via Stripe and register proof-of-work receipts.', icon:'pin'},
    {n:8, short:'HASHSCAN', title:'On-Chain HashScan Audit & Public Record', sub:'Publish metrics, hashes, and proof-of-reserve to the Hedera ledger.', icon:'globe'}
  ];

  function densify(lls, per){
    var out = [];
    for(var i=0;i<lls.length-1;i++){
      var a = lls[i], b = lls[i+1];
      for(var k=0;k<per;k++){
        var t = k/per;
        out.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t]);
      }
    }
    out.push(lls[lls.length-1]);
    return out;
  }
  function coastLine(c){
    var raw = COASTS[c.id];
    if(!raw) return [c.ll];
    return densify(raw, 6);
  }

  function cityVisible(c){
    return c.tags.some(function(t){ return filters[t]; });
  }

  function nrm(a,b){
    var l = Math.sqrt(a*a+b*b) || 1;
    return [a/l, b/l];
  }
  function offset(lat, lng, dLat, dLng, km){
    return [lat + (dLat * km)/111, lng + (dLng * km)/(111 * Math.cos(lat * Math.PI/180))];
  }
  function fan(lat, lng, dir, radiusKm, spread, steps, lngLat){
    var d = nrm(dir[0], dir[1]);
    var pts = [];
    for(var i=0;i<=steps;i++){
      var t = (i/steps - 0.5) * spread;
      var c = Math.cos(t), s = Math.sin(t);
      var eLat = d[0]*c - d[1]*s;
      var eLng = d[0]*s + d[1]*c;
      var km = radiusKm * (0.62 + 0.38*Math.cos(t));
      var p = offset(lat, lng, eLat, eLng, km);
      pts.push(lngLat ? [p[1], p[0]] : p);
    }
    return pts;
  }
  function polyFor(c, kind, radius, spread){
    var ring = fan(c.ll[0], c.ll[1], c.ocean, radius, spread, 12, true);
    ring.push([c.ll[1], c.ll[0]]);
    ring.push(ring[0]);
    return { type:'Feature', properties:{ kind:kind, city:c.id, tags:c.tags },
      geometry:{ type:'Polygon', coordinates:[ring] } };
  }

  function cityBounds(c){
    var pts = [[c.ll[0], c.ll[1]]];
    var shore = COASTS[c.id];
    if(shore && shore.length){
      for(var i=0;i<shore.length;i++) pts.push(shore[i]);
    }
    var outer = fan(c.ll[0], c.ll[1], c.ocean, 38, Math.PI * 1.35, 14, false);
    for(var j=0;j<outer.length;j++) pts.push(outer[j]);
    if(c.tags && c.tags.indexOf('coral') !== -1){
      var reef = fan(c.ll[0], c.ll[1], c.ocean, 12, Math.PI * 0.7, 8, false);
      for(var k=0;k<reef.length;k++) pts.push(reef[k]);
    }
    return L.latLngBounds(pts);
  }

  function cityPad(){
    return {
      paddingTopLeft: [18, 92],
      paddingBottomRight: [92, 228]
    };
  }

  function flyToCity(c, duration){
    if(!map || !c) return;
    var pad = cityPad();
    var opts = {
      paddingTopLeft: pad.paddingTopLeft,
      paddingBottomRight: pad.paddingBottomRight,
      maxZoom: 12,
      easeLinearity: 0.22
    };
    if(duration === 0){
      map.fitBounds(cityBounds(c), opts);
      return;
    }
    opts.duration = duration == null ? 1.2 : duration;
    map.flyToBounds(cityBounds(c), opts);
  }

  function eduIcon(s){
    var cls = s.type === 'uni' ? 't-edu uni' : 't-edu';
    var html = '<div class="' + cls + '"><svg viewBox="0 0 24 24">' + EDU_GLYPH[s.type] + '</svg></div>';
    return L.divIcon({ className:'t-edu-wrap', html:html, iconSize:[26,26], iconAnchor:[13,13], popupAnchor:[0,-12] });
  }

  function heatCluster(c, n, spreadKm, intensity){
    var pts = [];
    for(var i=0;i<n;i++){
      var a = ((i * 137.508) % 360) * Math.PI/180;
      var r = ((i * 19) % 100) / 100 * spreadKm;
      var p = offset(c.ll[0], c.ll[1], Math.cos(a), Math.sin(a), r);
      pts.push([p[0], p[1], intensity * (0.35 + (i % 6) * 0.1)]);
    }
    return pts;
  }

  function pinIcon(c){
    var color = c.risk==='critical' ? '#e3593f' : c.risk==='elevated' ? '#f2a71b' : '#8bc53f';
    var html = '<div class="t-pin" style="--c:' + color + '">' +
      '<div class="t-pin-pulse"></div>' +
      '<div class="t-pin-core"><svg viewBox="0 0 24 24">' + (GLYPH[c.marker]||GLYPH.barrier) + '</svg></div>' +
    '</div>';
    return L.divIcon({ className:'t-pin-wrap', html:html, iconSize:[36,36], iconAnchor:[18,18], popupAnchor:[0,-18] });
  }

  function fmtFund(n){
    return '$' + (n/1000) + 'k USD';
  }

  function popupHtml(c){
    var kpis = c.kpis.map(function(k){
      return '<div class="tpop-kpi"><b>' + k.n + '</b><i>' + k.u + '</i></div>';
    }).join('');
    return '<div class="tpop">' +
      '<div class="tpop-h">' +
        '<span class="tpop-rank">' + c.rank + '</span>' +
        '<div><b>' + c.name.toUpperCase() + '</b><i>' + c.country + ' · ' + c.sector + '</i></div>' +
        '<span class="tpop-ph">P' + c.phase + '/' + c.phaseMax + '</span>' +
      '</div>' +
      '<div class="tpop-kpis">' + kpis + '</div>' +
      '<div class="tpop-fund">' + fmtFund(c.fund) + ' · HCS</div>' +
      '<div class="tpop-cta">' +
        '<button type="button" class="pow" data-id="' + c.id + '">POW</button>' +
        '<button type="button" class="hash" data-hash="' + c.hash + '">HASH</button>' +
      '</div>' +
    '</div>';
  }

  function toast(msg){
    var el = document.getElementById('terraToast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 2200);
  }

  function polyStyle(f){
    var k = f.properties.kind;
    var climate = currentBase === 'climate';
    if(k==='flood') return { color:'#1f7ea6', weight:1, fillColor:'#1f7ea6', fillOpacity: climate ? 0.42 : 0.22 };
    if(k==='erosion') return { color:'#e3593f', weight:1, fillColor:'#e3593f', fillOpacity: climate ? 0.36 : 0.18 };
    return { color:'#7c5cff', weight:1.2, dashArray:'5 6', fillColor:'#7c5cff', fillOpacity: climate ? 0.28 : 0.14 };
  }

  function buildRiskGeo(){
    var feats = [];
    CITIES.filter(cityVisible).forEach(function(c){
      feats.push(polyFor(c, 'flood', 28, Math.PI * 1.15));
      feats.push(polyFor(c, 'erosion', 16, Math.PI * 0.9));
      feats.push(polyFor(c, 'surge', 38, Math.PI * 1.35));
    });
    return { type:'FeatureCollection', features:feats };
  }

  function syncEdu(){
    if(!map || !eduLayer) return;
    var show = filters.edu && map.getZoom() >= 7;
    if(show && !map.hasLayer(eduLayer)) eduLayer.addTo(map);
    if(!show && map.hasLayer(eduLayer)) map.removeLayer(eduLayer);
  }

  function paintEdu(){
    if(!map) return;
    if(eduLayer && map.hasLayer(eduLayer)) map.removeLayer(eduLayer);
    eduLayer = L.layerGroup();
    if(!filters.edu) return;
    var vis = {};
    CITIES.filter(cityVisible).forEach(function(c){ vis[c.id] = true; });
    SCHOOLS.forEach(function(s){
      if(!vis[s.city]) return;
      var m = L.marker(s.ll, { icon:eduIcon(s), interactive:true });
      m.bindTooltip((s.type==='uni' ? 'UNI · ' : 'HS · ') + s.name, { direction:'top', offset:[0,-10], opacity:0.95 });
      m.addTo(eduLayer);
    });
    syncEdu();
  }
  function rebuildEdu(){
    paintEdu();
    loadSchools().then(function(){ paintEdu(); });
  }

  function ensureHeat(done){
    if(typeof done === 'function') heatWaiters.push(done);
    if(L.heatLayer){
      var q = heatWaiters.splice(0, heatWaiters.length);
      q.forEach(function(fn){ fn(); });
      return;
    }
    if(heatLoading) return;
    heatLoading = true;
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/leaflet.heat@0.2.0/dist/leaflet-heat.js';
    s.onload = function(){ heatLoading = false; ensureHeat(); };
    s.onerror = function(){ heatLoading = false; heatWaiters.length = 0; };
    document.head.appendChild(s);
  }

  function rebuildOverlays(){
    if(!map) return;
    if(riskLayer) map.removeLayer(riskLayer);
    if(routeLayer) map.removeLayer(routeLayer);
    if(markerLayer) map.removeLayer(markerLayer);
    if(heatTemp && map.hasLayer(heatTemp)) map.removeLayer(heatTemp);
    if(heatPlastic && map.hasLayer(heatPlastic)) map.removeLayer(heatPlastic);

    var visible = CITIES.filter(cityVisible);
    riskLayer = L.geoJSON(buildRiskGeo(), { style:polyStyle, interactive:false }).addTo(map);

    routeLayer = L.layerGroup();
    visible.forEach(function(c){
      var coast = coastLine(c);
      L.polyline(coast, { color:'#0a3dff', weight:18, opacity:0.32, lineCap:'round', lineJoin:'round', interactive:false, smoothFactor:1 }).addTo(routeLayer);
      L.polyline(coast, { color:'#1d6bff', weight:9, opacity:0.96, lineCap:'round', lineJoin:'round', interactive:true, smoothFactor:1 }).bindTooltip('Cleanup shoreline · land / water', { sticky:true }).addTo(routeLayer);
      if(c.tags.indexOf('coral') !== -1){
        var reef = fan(c.ll[0], c.ll[1], c.ocean, 12, Math.PI * 0.7, 8, false);
        L.polyline(reef, { color:'#e07a3f', weight:3, opacity:0.9, interactive:false }).addTo(routeLayer);
      }
      if(c.id === 'capetown'){
        for(var i=0;i<4;i++){
          var a = (i/4 - 0.5) * 0.8;
          var d = nrm(c.ocean[0], c.ocean[1]);
          var eLat = d[0]*Math.cos(a) - d[1]*Math.sin(a);
          var eLng = d[0]*Math.sin(a) + d[1]*Math.cos(a);
          var p1 = offset(c.ll[0], c.ll[1], eLat, eLng, 6);
          var p2 = offset(c.ll[0], c.ll[1], eLat, eLng, 26);
          L.polyline([p1,p2], { color:'#fff', weight:1.4, opacity:0.7, dashArray:'2 6', interactive:false }).addTo(routeLayer);
        }
      }
    });
    routeLayer.addTo(map);

    markerLayer = L.layerGroup();
    visible.forEach(function(c){
      var m = L.marker(c.ll, { icon:pinIcon(c), riseOnHover:true });
      m.bindTooltip(c.name, { direction:'top', offset:[0,-16], opacity:0.95 });
      m.bindPopup(popupHtml(c), { maxWidth:280, className:'terra-pop' });
      m.on('click', function(){
        window.__chosenCity = c.id;
        flyToCity(c, 0.7);
      });
      m.on('popupopen', function(){
        var root = m.getPopup().getElement();
        if(!root) return;
        var pow = root.querySelector('.pow');
        var hash = root.querySelector('.hash');
        if(pow) pow.addEventListener('click', function(){
          toast('P' + c.phase + ' · ' + c.milestone);
        });
        if(hash) hash.addEventListener('click', function(){
          var h = hash.getAttribute('data-hash');
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(h).then(function(){ toast(h.slice(0,22) + '…'); });
          } else { toast(h.slice(0,22) + '…'); }
        });
      });
      m.addTo(markerLayer);
    });
    markerLayer.addTo(map);
    rebuildEdu();

    var shore = 0, ops = 0, crew = 0;
    visible.forEach(function(c){ shore += c.shoreline; ops += c.cleanups; crew += c.operators; });
    document.getElementById('statShore').textContent = shore.toFixed(1);
    document.getElementById('statOps').textContent = String(ops);
    document.getElementById('statCrew').textContent = String(crew);

    if(currentBase === 'heat') applyHeat(visible);
  }

  function applyHeat(visible){
    if(!L.heatLayer){
      ensureHeat(function(){ applyHeat(visible); });
      return;
    }
    visible = visible || CITIES.filter(cityVisible);
    var sst = [];
    visible.forEach(function(c){ sst = sst.concat(heatCluster(c, 14, 36, 0.7)); });
    if(heatTemp && map.hasLayer(heatTemp)) map.removeLayer(heatTemp);
    heatTemp = L.heatLayer(sst, { radius:26, blur:20, maxZoom:8, gradient:{0.2:'#1f7ea6', 0.5:'#8bc53f', 0.8:'#f2a71b', 1:'#e3593f'} });
    heatTemp.addTo(map);
  }

  function setBase(key){
    [satLayer, streetLayer, topoLayer].forEach(function(l){ if(l && map.hasLayer(l)) map.removeLayer(l); });
    if(heatTemp && map.hasLayer(heatTemp)) map.removeLayer(heatTemp);
    document.getElementById('terraLegend').classList.toggle('show', key==='climate');
    if(key==='street') streetLayer.addTo(map);
    else if(key==='topo') topoLayer.addTo(map);
    else satLayer.addTo(map);
    currentBase = key;
    if(key==='heat') applyHeat();
    document.querySelectorAll('#terraLayers .terra-lopt').forEach(function(el){
      el.classList.toggle('selected', el.dataset.layer===key);
    });
    if(riskLayer) riskLayer.setStyle(polyStyle);
    else riskLayer = L.geoJSON(buildRiskGeo(), { style:polyStyle, interactive:false }).addTo(map);
  }

  function fitAll(){
    var vis = CITIES.filter(cityVisible);
    if(!vis.length){ map.setView([8, 20], 2); return; }
    var b = L.latLngBounds(vis.map(function(c){ return c.ll; }));
    map.fitBounds(b, { padding:[56, 88], maxZoom:2, animate:true });
  }

  var TILE_FAST = { maxZoom:19, keepBuffer:6, updateWhenZooming:false, updateWhenIdle:true, detectRetina:false };

  function initMap(){
    if(ready) return;
    map = L.map('terraMap', {
      zoomControl:false, attributionControl:false, worldCopyJump:true, minZoom:2,
      preferCanvas:true, fadeAnimation:false, zoomAnimation:true, markerZoomAnimation:false
    }).setView([12, 20], 2);
    satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', TILE_FAST);
    streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, subdomains:'abc', keepBuffer:4, updateWhenZooming:false, detectRetina:false });
    topoLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', TILE_FAST);
    satLayer.addTo(map);
    map.on('zoomend', syncEdu);
    map.on('dragstart zoomstart click', function(){ if(typeof bumpIdle === 'function') bumpIdle(); });
    rebuildOverlays();
    ready = true;
  }

  function polar(cx, cy, r, deg){
    var a = deg * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  function donutSeg(cx, cy, r0, r1, a0, a1){
    var o0 = polar(cx,cy,r1,a0), o1 = polar(cx,cy,r1,a1);
    var i1 = polar(cx,cy,r0,a1), i0 = polar(cx,cy,r0,a0);
    return 'M'+o0[0].toFixed(1)+','+o0[1].toFixed(1)+
      ' A'+r1+','+r1+' 0 0 1 '+o1[0].toFixed(1)+','+o1[1].toFixed(1)+
      ' L'+i1[0].toFixed(1)+','+i1[1].toFixed(1)+
      ' A'+r0+','+r0+' 0 0 0 '+i0[0].toFixed(1)+','+i0[1].toFixed(1)+' Z';
  }
  var checkedPhases = {};
  var roadmapView = 'path';

  function setRoadmapView(mode){
    roadmapView = mode === 'cycle' ? 'cycle' : 'path';
    overlay.classList.toggle('path-on', roadmapView === 'path');
    overlay.classList.toggle('cycle-on', roadmapView === 'cycle');
    var pathBtn = document.getElementById('terraViewPath');
    var cycleBtn = document.getElementById('terraViewCycle');
    if(pathBtn) pathBtn.classList.toggle('active', roadmapView === 'path');
    if(cycleBtn) cycleBtn.classList.toggle('active', roadmapView === 'cycle');
    hideRmTip();
    renderRoadmap();
    if(map && overlay.classList.contains('open') && window.__chosenCity){
      flyToCity(cityById(window.__chosenCity), 0.45);
    }
  }

  function showRmTip(title, sub, x, y){
    var tip = document.getElementById('rmTip');
    if(!tip) return;
    tip.innerHTML = '<b>' + title + '</b><i>' + sub + '</i>';
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.classList.add('show');
  }
  function hideRmTip(){
    var tip = document.getElementById('rmTip');
    if(tip) tip.classList.remove('show');
  }

  function togglePhase(i){
    var p = PHASES[i];
    if(!p) return;
    checkedPhases[i] = !checkedPhases[i];
    renderRoadmap();
    if(window.GOO && GOO.Notify) GOO.Notify.toast({
      tone: checkedPhases[i] ? 'green' : 'amber',
      title: checkedPhases[i] ? ('Phase 0' + p.n + ' checked') : ('Phase 0' + p.n + ' open'),
      sub: p.title,
      n: '0' + p.n
    });
  }

  function bindPhaseHover(el, host){
    el.addEventListener('mouseenter', function(ev){
      var p = PHASES[+el.dataset.i];
      var box = host.getBoundingClientRect();
      showRmTip('PHASE 0'+p.n+' · '+p.short, p.title+' — '+p.sub, ev.clientX - box.left, ev.clientY - box.top - 12);
    });
    el.addEventListener('mousemove', function(ev){
      var tipEl = document.getElementById('rmTip');
      if(!tipEl || !tipEl.classList.contains('show')) return;
      var box = host.getBoundingClientRect();
      tipEl.style.left = (ev.clientX - box.left) + 'px';
      tipEl.style.top = (ev.clientY - box.top - 12) + 'px';
    });
    el.addEventListener('mouseleave', hideRmTip);
  }

  function renderCycle(){
    var host = document.getElementById('rmCycle');
    if(!host) return;
    var cx = 170, cy = 170, r0 = 62, r1 = 132;
    var segs = '', nums = '', icons = '', arrows = '';
    PHASES.forEach(function(p, i){
      var a0 = -112.5 + i * 45, a1 = a0 + 45, mid = a0 + 22.5;
      var on = !!checkedPhases[i];
      var fill = on ? '#14532d' : (i % 2 === 0 ? '#e4efe8' : '#d7e6dc');
      segs += '<path class="rm-seg'+(on?' on':'')+'" data-i="'+i+'" d="'+donutSeg(cx,cy,r0,r1,a0,a1)+'" fill="'+fill+'"></path>';
      var np = polar(cx,cy,118, mid);
      nums += '<text x="'+np[0].toFixed(1)+'" y="'+(np[1]+4).toFixed(1)+'" text-anchor="middle" font-size="11" font-weight="700" fill="'+(on?'#ecfdf5':'#5f6f66')+'" font-family="Space Grotesk,sans-serif">'+p.n+'.</text>';
      var ip = polar(cx,cy,92, mid);
      icons += '<g class="rm-seg-ico" data-i="'+i+'" transform="translate('+(ip[0]-12).toFixed(1)+','+(ip[1]-12).toFixed(1)+')" fill="none" stroke="'+(on?'#ecfdf5':'#14532d')+'" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+PHASE_ICON[p.icon]+'</g>';
      var aa0 = polar(cx,cy,146, a1-10), aa1 = polar(cx,cy,146, a1+8);
      var tip = polar(cx,cy,146, a1+14);
      arrows += '<path d="M'+aa0[0].toFixed(1)+','+aa0[1].toFixed(1)+' A146,146 0 0 1 '+aa1[0].toFixed(1)+','+aa1[1].toFixed(1)+'" fill="none" stroke="#166534" stroke-width="7" stroke-linecap="round"/>';
      var ang = (a1+12)*Math.PI/180;
      var tx = tip[0], ty = tip[1];
      var lx = tx - 7*Math.cos(ang-0.7), ly = ty - 7*Math.sin(ang-0.7);
      var rx = tx - 7*Math.cos(ang+0.7), ry = ty - 7*Math.sin(ang+0.7);
      arrows += '<polygon points="'+tx.toFixed(1)+','+ty.toFixed(1)+' '+lx.toFixed(1)+','+ly.toFixed(1)+' '+rx.toFixed(1)+','+ry.toFixed(1)+'" fill="#166534"/>';
    });
    host.innerHTML =
      '<svg class="rm-ring" viewBox="0 0 340 340">'+segs+nums+icons+arrows+'</svg>'+
      '<div class="rm-hub"><b>FIELD OPERATIONS<br>ROADMAP</b></div>';
    var card = document.getElementById('terraCycleCard');
    host.querySelectorAll('.rm-seg').forEach(function(el){
      el.addEventListener('click', function(){ togglePhase(+el.dataset.i); });
      if(card) bindPhaseHover(el, card);
    });
  }

  function renderPath(){
    var host = document.getElementById('rmPath');
    if(!host) return;
    var main = PHASES.slice(0, 6);
    var CHECK = '<path d="M6 12.2l3.2 3.2L18 8.2"/>';
    var FLAG = '<path d="M7 2h10l-2.6 4L17 10H7V21H5V2h2Z"/>';
    var blurbs = [
      'Local approval & community onboarding',
      'Site reconnaissance & mapping',
      'Volunteer & worker group deployment',
      'Site cleanup & waste extraction',
      'Waste bin & collection hub install',
      'Waste audit, weighing & sorting'
    ];
    var lastOn = -1;
    var steps = main.map(function(p, i){
      var on = !!checkedPhases[i];
      var now = !on && (i === 0 || checkedPhases[i - 1]);
      if(on) lastOn = i;
      var kind = (on ? ' on' : '') + (now ? ' now' : '');
      var glyph = on ? CHECK : PHASE_ICON[p.icon];
      var blurb = blurbs[i] || p.title;
      return '<button type="button" class="rm-tl-step'+kind+'" data-i="'+i+'" aria-pressed="'+(on?'true':'false')+'">'+
        '<span class="lab">'+p.short+'</span>'+
        '<span class="dot"><svg viewBox="0 0 24 24">'+glyph+'</svg></span>'+
        '<span class="sub">'+blurb+'</span>'+
      '</button>';
    }).join('');
    var fillW = lastOn < 0 ? 0 : (lastOn * (100 / 6));
    var payOn = !!checkedPhases[6];
    var hashOn = !!checkedPhases[7];
    host.innerHTML =
      '<div class="rm-tl">'+
        '<i class="rm-tl-line"></i>'+
        '<i class="rm-tl-fill" style="width:'+fillW.toFixed(3)+'%"></i>'+
        '<div class="rm-tl-row">'+steps+'</div>'+
        '<button type="button" class="rm-tl-flag early'+(payOn?' on':'')+'" data-i="6" aria-pressed="'+(payOn?'true':'false')+'">'+
          '<span class="stem"></span>'+
          '<span class="mark"><svg viewBox="0 0 24 24">'+FLAG+'</svg></span>'+
          '<span class="lab">PAYOUT</span>'+
          '<span class="sub">Treasury payouts &amp; stipends</span>'+
        '</button>'+
        '<button type="button" class="rm-tl-flag late'+(hashOn?' on':'')+'" data-i="7" aria-pressed="'+(hashOn?'true':'false')+'">'+
          '<span class="stem"></span>'+
          '<span class="mark"><svg viewBox="0 0 24 24">'+FLAG+'</svg></span>'+
          '<span class="lab">HASHSCAN</span>'+
          '<span class="sub">On-chain HashScan public record</span>'+
        '</button>'+
      '</div>';
    host.querySelectorAll('[data-i]').forEach(function(el){
      el.addEventListener('click', function(){ togglePhase(+el.dataset.i); });
    });
  }

  function renderRoadmap(){
    renderCycle();
    renderPath();
  }

  function cityById(id){
    return CITIES.filter(function(c){ return c.id===id; })[0] || CITIES[0];
  }

  function bindCitySearch(input, hits, onPick){
    if(!input || !hits) return;
    function render(q){
      q = (q||'').trim().toLowerCase();
      if(!q){ hits.innerHTML=''; hits.classList.remove('show'); return; }
      var list = CITIES.filter(function(c){
        return (c.name+' '+c.country+' '+c.sector).toLowerCase().indexOf(q) !== -1;
      });
      hits.innerHTML = list.length
        ? list.map(function(c){ return '<button type="button" data-id="'+c.id+'"><b>'+c.name+'</b><i>'+c.country+' · '+c.sector+'</i></button>'; }).join('')
        : '<div class="empty">No coastal city matched</div>';
      hits.classList.add('show');
    }
    input.addEventListener('input', function(){ render(input.value); });
    input.addEventListener('focus', function(){ if(input.value) render(input.value); });
    hits.addEventListener('click', function(e){
      var b = e.target.closest('[data-id]');
      if(!b) return;
      var c = cityById(b.dataset.id);
      input.value = c.name;
      hits.classList.remove('show');
      onPick(c);
    });
    document.addEventListener('click', function(e){
      if(!e.target.closest('.gsearch') && !e.target.closest('.terra-search')) hits.classList.remove('show');
    });
  }

  function reducedMotion(){
    return window.GOO && GOO.Device && GOO.Device.reduced;
  }

  function pwaView(){
    var d = window.GOO && GOO.Device;
    return !!(d && (d.embed || d.fromPwa));
  }

  var cinematic = false;
  var idleTimer = null;
  var tourTimer = null;
  var tourLast = '';

  function stopTour(){
    clearTimeout(tourTimer);
    tourTimer = null;
  }
  function bumpIdle(){
    clearTimeout(idleTimer);
    stopTour();
    if(pwaView()) return;
    if(!overlay.classList.contains('open') || cinematic || reducedMotion()) return;
    idleTimer = setTimeout(startIdleTour, 8000);
  }
  function startIdleTour(){
    if(pwaView()) return;
    if(!map || !overlay.classList.contains('open') || cinematic) return;
    var pool = CITIES.filter(function(c){ return c.id !== tourLast; });
    var next = pool[Math.floor(Math.random() * pool.length)] || CITIES[0];
    tourLast = next.id;
    window.__chosenCity = next.id;
    var steps = [4, 6, 8];
    var i = 0;
    function step(){
      if(!overlay.classList.contains('open') || cinematic) return;
      if(i >= steps.length){
        flyToCity(next, 1.4);
        return;
      }
      map.flyTo(next.ll, steps[i], { duration:1.2, easeLinearity:0.28 });
      i += 1;
      tourTimer = setTimeout(step, 1300);
    }
    map.setView([12, 20], 2, { animate:false });
    tourTimer = setTimeout(step, 400);
  }

  function openMap(cityId){
    if(pwaView() && window.GOO.Device.view === 'globe') return;
    var id = (typeof cityId === 'string' && cityId) ? cityId : (window.__chosenCity || 'jakarta');
    window.__chosenCity = id;
    var city = cityById(id);
    if(!city || !city.ll) return;
    var modal = document.getElementById('uxmodal');
    if(modal) modal.classList.remove('open');
    var appEl = document.getElementById('app');
    cinematic = true;
    stopTour();
    clearTimeout(idleTimer);
    var skipGlobe = pwaView() || location.hash === "#roadmap";
    if(!skipGlobe && appEl) appEl.classList.add('globe-focus');
    var spinMs = skipGlobe ? 0 : (reducedMotion() ? 800 : 5000);
    window.__spinBoost = skipGlobe || reducedMotion() ? 0 : 0.042;
    if(!skipGlobe && window.__globeLook) window.__globeLook(city.ll[0], city.ll[1]);
    var leafletReady = loadLeaflet().catch(function(){
      if(window.GOO && GOO.Notify) GOO.Notify.toast({ tone:'amber', title:'Map tiles', sub:'Leaflet failed to load. Check the network.', n:'!' });
    });

    function showWorldThenCity(){
      window.__spinBoost = 0;
      if(window.GOO && GOO.Notify) GOO.Notify.toast({ tone:'green', title:'Roadmap live', sub:'Whole Earth, then ' + city.name + '.', n:'09' });
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden','false');
      overlay.removeAttribute('inert');
      document.body.classList.add('terra-open');
      leafletReady.then(function(){
        if(!window.L) return;
        initMap();
        renderRoadmap();
        if(map){
          map.setView([12, 20], 2, { animate:false });
          map.invalidateSize();
        }
        setTimeout(function(){
          if(map){
            map.invalidateSize();
            flyToCity(city, reducedMotion() || skipGlobe ? 0 : 2.4);
          }
          if(appEl) appEl.classList.remove('globe-focus');
          renderRoadmap();
          cinematic = false;
          bumpIdle();
        }, skipGlobe ? 80 : 720);
      });
    }
    if(spinMs) setTimeout(showWorldThenCity, spinMs);
    else showWorldThenCity();
  }

  function closeMap(){
    cinematic = false;
    stopTour();
    clearTimeout(idleTimer);
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    overlay.setAttribute('inert','');
    document.body.classList.remove('terra-open');
    document.getElementById('terraLayers').classList.remove('open');
    var appEl = document.getElementById('app');
    if(appEl) appEl.classList.remove('globe-focus');
    window.__globeAim = null;
    window.__spinBoost = 0;
  }

  window.openTerraRoadmap = openMap;
  window.closeTerraRoadmap = closeMap;

  if(location.hash === '#roadmap') setTimeout(openMap, 240);

  document.getElementById('terraClose').addEventListener('click', closeMap);
  document.getElementById('terraZoomIn').addEventListener('click', function(){ if(map) map.zoomIn(); });
  document.getElementById('terraZoomOut').addEventListener('click', function(){ if(map) map.zoomOut(); });
  document.getElementById('terraCompass').addEventListener('click', function(){
    var c = cityById(window.__chosenCity);
    if(c) flyToCity(c, 0.8);
    else fitAll();
  });
  var gpsBtn = document.getElementById('terraGpsCompass');
  if(gpsBtn) gpsBtn.addEventListener('click', function(){ if(window.GOO && GOO.Compass) GOO.Compass.show(); });
  var pathBtn = document.getElementById('terraViewPath');
  var cycleBtn = document.getElementById('terraViewCycle');
  var rmClose = document.getElementById('rmClose');
  if(pathBtn) pathBtn.addEventListener('click', function(){ setRoadmapView('path'); });
  if(cycleBtn) cycleBtn.addEventListener('click', function(){ setRoadmapView('cycle'); });
  if(rmClose) rmClose.addEventListener('click', function(){ setRoadmapView('path'); });
  var rmPathClose = document.getElementById('rmPathClose');
  if(rmPathClose) rmPathClose.addEventListener('click', closeMap);
  setRoadmapView('path');

  ['pointerdown','wheel','keydown','touchstart'].forEach(function(ev){
    overlay.addEventListener(ev, bumpIdle, { passive:true });
  });

  bindCitySearch(document.getElementById('gsearchIn'), document.getElementById('gsearchHits'), function(c){
    window.__chosenCity = c.id;
    if(window.__globeLook) window.__globeLook(c.ll[0], c.ll[1]);
  });
  bindCitySearch(document.getElementById('terraSearchIn'), document.getElementById('terraSearchHits'), function(c){
    window.__chosenCity = c.id;
    if(map) flyToCity(c, 1.4);
  });

  var layersPanel = document.getElementById('terraLayers');
  document.getElementById('terraLayersBtn').addEventListener('click', function(e){
    e.stopPropagation();
    layersPanel.classList.toggle('open');
  });
  document.querySelectorAll('#terraLayers .terra-lopt').forEach(function(el){
    el.addEventListener('click', function(){
      setBase(el.dataset.layer);
      layersPanel.classList.remove('open');
    });
  });
  overlay.addEventListener('click', function(e){
    if(!layersPanel.contains(e.target) && e.target.id !== 'terraLayersBtn' && !e.target.closest('#terraLayersBtn')){
      layersPanel.classList.remove('open');
    }
  });

  document.querySelectorAll('#terraFilters .terra-filter').forEach(function(btn){
    btn.addEventListener('click', function(){
      var key = btn.dataset.layer;
      filters[key] = !filters[key];
      btn.classList.toggle('on', filters[key]);
      if(key === 'edu') rebuildEdu();
      else rebuildOverlays();
    });
  });
  addEventListener('resize', function(){
    if(overlay.classList.contains('open')) renderRoadmap();
  });
})();
