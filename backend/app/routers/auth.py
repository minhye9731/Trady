from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import supabase

router = APIRouter(prefix="/auth", tags=["auth"])

class SignUpInput(BaseModel):
    email: str
    password: str
    nickname: str

class SignInInput(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(body: SignUpInput):
    try:
        res = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })
        user = res.user
        supabase.table("users").insert({
            "id": str(user.id),
            "nickname": body.nickname,
            "plan": "free"
        }).execute()
        return {"message": "가입 완료", "user_id": str(user.id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/signin")
def signin(body: SignInInput):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
        return {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "user_id": str(res.user.id)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))