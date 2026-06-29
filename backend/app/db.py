from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def supabase_with_token(token: str) -> Client:
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    client.postgrest.auth(token)
    return client

def supabase_auth_with_token(token: str) -> Client:
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    client.auth.set_session(access_token=token, refresh_token="dummy") #CHECK - refresh token logic 보완 (필요시)
    return client