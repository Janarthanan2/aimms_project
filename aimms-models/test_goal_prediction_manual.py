import requests
import json

url = "http://localhost:8001/predict_goal_completion"

payload = {
    "transactions": [
        {"date": "2025-12-01", "amount": 50000, "type": "Credit", "category": "Income"},
        {"date": "2025-12-02", "amount": 10, "type": "Debit", "category": "Food"},
        {"date": "2025-12-03", "amount": 20, "type": "Debit", "category": "Transport"},
        {"date": "2025-12-04", "amount": 50000, "type": "Credit", "category": "Income"},
        {"date": "2025-12-05", "amount": 15, "type": "Debit", "category": "Food"}
    ],
    "goal_target": 200000,
    "goal_current": 5000,
    "goal_deadline": "2026-03-31",
    "goal_created_at": "2024-01-01T10:00:00Z"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
