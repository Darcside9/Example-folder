export const apiLanguages = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node.js / JS' },
  { id: 'python', label: 'Python' },
];

export const apiSnippets = {
  curl: `curl -X POST "https://api.chrisshopper.com/v1/numbers/order" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "service": "telegram",
    "country": "US",
    "webhook_url": "https://yourapp.com/api/webhooks/sms"
  }'

# Response:
# {
#   "status": "success",
#   "order_id": "ord_8f932a",
#   "phone_number": "+14155550192",
#   "expires_in_seconds": 1200,
#   "sms_code": null
# }`,

  node: `import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.chrisshopper.com/v1',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

// 1. Request temporary virtual number
const { data: order } = await client.post('/numbers/order', {
  service: 'whatsapp',
  country: 'US'
});

console.log(\`Allocated Number: \${order.phone_number}\`);

// 2. Poll or await incoming SMS verification code
const { data: result } = await client.get(\`/numbers/status/\${order.order_id}\`);
console.log(\`Received OTP: \${result.sms_code}\`);`,

  python: `import requests
import time

API_KEY = "YOUR_API_KEY"
headers = {"Authorization": f"Bearer {API_KEY}"}

# 1. Order dedicated SMS verification line
payload = {"service": "openai", "country": "US"}
res = requests.post("https://api.chrisshopper.com/v1/numbers/order", json=payload, headers=headers)
order = res.json()

print(f"Number ready: {order['phone_number']}")

# 2. Wait for incoming OTP code
for _ in range(30):
    status = requests.get(f"https://api.chrisshopper.com/v1/numbers/status/{order['order_id']}", headers=headers).json()
    if status.get("sms_code"):
        print(f"Verification Code: {status['sms_code']}")
        break
    time.sleep(2)`
};
