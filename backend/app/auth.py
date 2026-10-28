from fastapi import Header, HTTPException
from .db import supabase


def current_user(authorization: str = Header(None)) -> str:
    """Supabase JWT verify karke user_id return karta hai."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        res = supabase.auth.get_user(token)
        return res.user.id
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
