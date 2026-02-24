# LatchPay API Metadata

This folder contains example metadata JSON files for LatchPay API endpoints.

## How to Use

When registering an endpoint on LatchPay, you need to provide a **Metadata URI** — a public URL pointing to a JSON file that describes your API.

### Quick Start (for testing)

Use these raw GitHub URLs directly in the "Register Endpoint" form:

| API | Metadata URI | Category | Suggested Price |
|-----|-------------|----------|-----------------|
| Weather Forecast | `https://raw.githubusercontent.com/NOVA1358X/LatchPay/main/metadata/weather-api.json` | Data & Analytics | $0.01 |
| AI Text Summarizer | `https://raw.githubusercontent.com/NOVA1358X/LatchPay/main/metadata/ai-summarizer.json` | AI & ML | $0.05 |
| Crypto Price Oracle | `https://raw.githubusercontent.com/NOVA1358X/LatchPay/main/metadata/crypto-oracle.json` | Oracles | $0.01 |

### Metadata JSON Schema

```json
{
  "name": "Your API Name",
  "description": "What your API does",
  "version": "1.0.0",
  "category": "ai | data | compute | storage | oracle | identity",
  "apiEndpoint": "https://your-api.com/v1/endpoint",
  "documentation": "https://docs.your-api.com",
  "tags": ["tag1", "tag2"],
  "author": "Your Name",
  "requestExample": {
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "body": { "example": "request" }
  },
  "responseExample": {
    "example": "response"
  }
}
```

### Registration Parameters

When using the Seller Dashboard to register:

1. **Metadata URI**: Paste one of the raw GitHub URLs above, or host your own JSON file
2. **Price per Call**: The USDC amount charged per API call (e.g., 0.01 = 1 cent)
3. **Category**: Must match your API type (dropdown selection)
4. **Dispute Window**: Minimum 1 hour (contract enforced), recommended 1-24 hours

### Hosting Your Metadata

You can host your metadata JSON anywhere publicly accessible:

- **GitHub**: Push a JSON file and use the raw URL (`raw.githubusercontent.com/...`)
- **IPFS**: Pin to IPFS and use `ipfs://` URI
- **Your domain**: Host at any HTTPS URL
- **Arweave**: For permanent storage

### Example Registration Flow

1. Go to Seller Dashboard → Click "Register Endpoint"
2. Paste: `https://raw.githubusercontent.com/NOVA1358X/LatchPay/main/metadata/weather-api.json`
3. Set price: `0.01` (1 cent per call)
4. Select category: `Data & Analytics`
5. Set dispute window: `24` hours
6. Click "Register Endpoint" → Confirm wallet transaction
7. Done! Your API appears in the Marketplace
