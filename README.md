# ThreatCrush DeFi TVL Alert

ThreatCrush module that monitors DeFiLlama for sudden TVL drops across DeFi protocols — a key early-warning signal for active exploits.

## What it does

- Polls the DeFiLlama `/protocols` API every 5 minutes
- Compares current TVL against the last snapshot
- Emits a `ThreatEvent` when any protocol drops > **15%** in a single poll cycle
- Includes protocol name, TVL before/after, percentage drop, and DeFiLlama URL

## Install

```bash
threatcrush module install defi-tvl-alert
```

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `threshold_pct` | `15` | Minimum TVL drop % to trigger an alert |
| `min_tvl_usd` | `1000000` | Ignore protocols with TVL below this (filters noise) |
| `poll_interval_seconds` | `300` | How often to poll DeFiLlama |

## Example alert

```json
{
  "type": "defi-tvl-drop",
  "severity": "high",
  "protocol": "ExampleProtocol",
  "tvl_before": 45000000,
  "tvl_after": 28000000,
  "drop_pct": 37.8,
  "url": "https://defillama.com/protocol/exampleprotocol"
}
```

## License

MIT
