"""
Clerk JWT verification dependency for FastAPI.

Verifies the Bearer token from Clerk using their JWKS endpoint,
then extracts the clerk_id (sub claim) for use in route handlers.
"""

import os
import jwt
import httpx
from fastapi import Depends, HTTPException, Request
from functools import lru_cache

CLERK_ISSUER = os.getenv("CLERK_ISSUER")  # e.g. https://clean-crow-47.clerk.accounts.dev

_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    """Fetch and cache Clerk's JWKS (JSON Web Key Set)."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    jwks_url = f"{CLERK_ISSUER}/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        return _jwks_cache


async def require_clerk_user(request: Request) -> str:
    """
    FastAPI dependency that verifies the Clerk JWT and returns the clerk_id.

    Usage:
        @router.post("/some-endpoint")
        async def handler(clerk_id: str = Depends(require_clerk_user)):
            ...
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.split(" ", 1)[1]

    try:
        # Get Clerk's public keys
        jwks = await _get_jwks()
        # Decode the JWT header to find the key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find the matching public key
        matching_key = None
        for key_data in jwks.get("keys", []):
            if key_data["kid"] == kid:
                matching_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
                break

        if matching_key is None:
            raise HTTPException(status_code=401, detail="No matching key found in JWKS")

        # Verify and decode
        payload = jwt.decode(
            token,
            matching_key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
        )

        clerk_id = payload.get("sub")
        if not clerk_id:
            raise HTTPException(status_code=401, detail="Token missing sub claim")

        return clerk_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
