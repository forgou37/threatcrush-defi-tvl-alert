#!/usr/bin/env node
/**
 * ThreatCrush DeFi TVL Alert Module
 * Polls DeFiLlama and emits events when a protocol TVL drops sharply.
 */

const DEFILLAMA_URL = 'https://api.llama.fi/protocols';
const THRESHOLD_PCT = parseFloat(process.env.TC_THRESHOLD_PCT || '15');
const MIN_TVL_USD  = parseFloat(process.env.TC_MIN_TVL_USD  || '1000000');
const POLL_MS      = parseInt(process.env.TC_POLL_INTERVAL_SECONDS || '300') * 1000;

let snapshot = {};

async function fetchProtocols() {
  const res = await fetch(DEFILLAMA_URL);
  if (!res.ok) throw new Error(`DeFiLlama HTTP ${res.status}`);
  return res.json();
}

function emitEvent(event) {
  // ThreatCrush event protocol: write JSON lines to stdout
  process.stdout.write(JSON.stringify(event) + '\n');
}

async function poll() {
  let protocols;
  try {
    protocols = await fetchProtocols();
  } catch (err) {
    process.stderr.write(`[defi-tvl-alert] fetch error: ${err.message}\n`);
    return;
  }

  for (const p of protocols) {
    const tvl = p.tvl;
    if (!tvl || tvl < MIN_TVL_USD) continue;

    const name = p.slug || p.name;
    const prev = snapshot[name];

    if (prev !== undefined) {
      const dropPct = ((prev - tvl) / prev) * 100;
      if (dropPct >= THRESHOLD_PCT) {
        emitEvent({
          type: 'defi-tvl-drop',
          severity: dropPct >= 50 ? 'critical' : 'high',
          protocol: p.name,
          slug: name,
          tvl_before: prev,
          tvl_after: tvl,
          drop_pct: Math.round(dropPct * 10) / 10,
          url: `https://defillama.com/protocol/${name}`,
          ts: new Date().toISOString()
        });
      }
    }

    snapshot[name] = tvl;
  }
}

// Initial snapshot load (no alerts)
fetchProtocols()
  .then(protocols => {
    for (const p of protocols) {
      if (p.tvl && p.tvl >= MIN_TVL_USD) {
        snapshot[p.slug || p.name] = p.tvl;
      }
    }
    process.stderr.write(`[defi-tvl-alert] loaded ${Object.keys(snapshot).length} protocols\n`);
    setInterval(poll, POLL_MS);
  })
  .catch(err => {
    process.stderr.write(`[defi-tvl-alert] init error: ${err.message}\n`);
    process.exit(1);
  });
