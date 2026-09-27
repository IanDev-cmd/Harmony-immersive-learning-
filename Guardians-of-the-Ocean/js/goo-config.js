window.GOO_API = window.GOO_API || localStorage.getItem('goo-api') || (
  (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:8787'
    : location.origin
);
