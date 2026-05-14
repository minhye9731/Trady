from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from app.db import supabase

router = APIRouter(prefix="/principles", tags=["principles"])
security = HTTPBearer()

def get_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        user = supabase.auth.get_user(token)
        return str(user.user.id)
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다")

class PrincipleInput(BaseModel):
    title: str
    content: Optional[str] = None
    category: Optional[str] = None  # entry | takeprofit | stoploss | position | psychology
    is_active: bool = True

@router.post("/")
def create_principle(body: PrincipleInput, user_id: str = Depends(get_user_id)):
    data = body.model_dump()
    data["user_id"] = user_id
    data["version"] = 1
    res = supabase.table("principles").insert(data).execute()
    return res.data[0]

@router.get("/")
def get_principles(user_id: str = Depends(get_user_id)):
    res = supabase.table("principles").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data

@router.get("/{principle_id}")
def get_principle(principle_id: str, user_id: str = Depends(get_user_id)):
    res = supabase.table("principles").select("*").eq("id", principle_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="투자 원칙을 찾을 수 없습니다")
    return res.data[0]

@router.put("/{principle_id}")
def update_principle(principle_id: str, body: PrincipleInput, user_id: str = Depends(get_user_id)):
    existing = supabase.table("principles").select("version").eq("id", principle_id).eq("user_id", user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="투자 원칙을 찾을 수 없습니다")
    current_version = existing.data[0]["version"]
    data = body.model_dump()
    data["version"] = current_version + 1
    res = supabase.table("principles").update(data).eq("id", principle_id).eq("user_id", user_id).execute()
    return res.data[0]

@router.delete("/{principle_id}")
def delete_principle(principle_id: str, user_id: str = Depends(get_user_id)):
    supabase.table("principles").delete().eq("id", principle_id).eq("user_id", user_id).execute()
    return {"message": "삭제 완료"}