from fastapi import APIRouter
from app.db import supabase
from app.ai.market_scheduler import collect_and_save, INDICATORS

router = APIRouter(prefix="/market", tags=["market"])

@router.get("/indicators")
def get_indicators():
    result = {}
    for ind in INDICATORS:
        res = (supabase.table("market_indicators")
               .select("*")
               .eq("indicator_type", ind["type"])
               .order("recorded_at", desc=True)
               .limit(1)
               .execute())
        if res.data:
            result[ind["type"]] = {
                **res.data[0],
                "label": ind["label"]
            }
    return result

@router.post("/refresh")
def refresh_indicators():
    collect_and_save()
    return {"message": "지표 업데이트 완료"}