from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.db import supabase, supabase_with_token, supabase_auth_with_token

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

class SignUpInput(BaseModel):
    email: str
    password: str
    nickname: str

class SignInInput(BaseModel):
    email: str
    password: str

class PasswordChangeInput(BaseModel):
    new_password: str

class PasswordResetInput(BaseModel):
    email: str

def get_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return credentials.credentials

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
    
@router.post("/change-password")
def change_password(body: PasswordChangeInput, token: str = Depends(get_token)):
    try:
        authed = supabase_auth_with_token(token)
        authed.auth.update_user({"password": body.new_password})
        return {"message": "비밀번호 변경 완료"}
    except Exception as e:
        print(f"ERROR TYPE: {type(e).__name__}")
        print(f"ERROR MSG: {e}")
        raise HTTPException(status_code=400, detail=f"{type(e).__name__}: {str(e)}")
    
@router.post("/reset-password")
def reset_password(body: PasswordResetInput):
    try:
        supabase.auth.reset_password_email(body.email)
        return {"message": "재설정 이메일을 발송했습니다"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me")
def get_me(token: str = Depends(get_token)):
    try:
        user = supabase.auth.get_user(token)
        user_id = str(user.user.id)
        res = supabase.table("users").select("*").eq("id", user_id).execute()
        return {
            "id": user_id,
            "email": user.user.email,
            "nickname": res.data[0]["nickname"] if res.data else "",
            "plan": res.data[0]["plan"] if res.data else "free",
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.put("/me")
def update_me(body: dict, token: str = Depends(get_token)):
    try:
        user = supabase.auth.get_user(token)
        user_id = str(user.user.id)
        supabase.table("users").update({"nickname": body.get("nickname")}).eq("id", user_id).execute()
        return {"message": "업데이트 완료"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))





