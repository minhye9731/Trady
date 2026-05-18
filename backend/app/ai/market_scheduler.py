import requests
import os
from app.db import supabase

FRED_API_KEY = os.getenv("FRED_API_KEY")

INDICATORS = [
    {"type": "yield_spread", "series_id": "T10Y2Y", "label": "장단기 금리차"},
    {"type": "fed_funds", "series_id": "FEDFUNDS", "label": "기준금리"},
    {"type": "credit_spread", "series_id": "BAMLH0A0HYM2", "label": "하이일드 크레딧 스프레드"},
]

def fetch_fred(series_id: str):
    try:
        url = (
            f"https://api.stlouisfed.org/fred/series/observations"
            f"?series_id={series_id}"
            f"&api_key={FRED_API_KEY}"
            f"&file_type=json"
            f"&limit=2"
            f"&sort_order=desc"
        )
        res = requests.get(url, timeout=10)
        data = res.json()
        observations = data["observations"]
        latest = float(observations[0]["value"])
        prev = float(observations[1]["value"]) if len(observations) > 1 else latest
        return {
            "value": latest,
            "prev_value": prev,
            "date": observations[0]["date"],
            "change": round(latest - prev, 4),
        }
    except Exception as e:
        print(f"FRED fetch error ({series_id}): {e}")
        return None

def collect_and_save():
    for ind in INDICATORS:
        data = fetch_fred(ind["series_id"])
        if data:
            supabase.table("market_indicators").insert({
                "indicator_type": ind["type"],
                "value": data["value"],
                "raw_json": data,
            }).execute()
            print(f"✅ {ind['label']}: {data['value']} (전일比 {data['change']:+.4f})")