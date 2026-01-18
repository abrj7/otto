"""
Otto Voice Agent - Token Company Compression
Uses bear-1 model to compress context before LLM processing
"""

import os
import logging
from tokenc import TokenClient

# Initialize Token Company client
TTC_API_KEY = os.getenv("TTC_API_KEY")
_client = None


def get_client() -> TokenClient:
    """Get or create Token Company client."""
    global _client
    if _client is None and TTC_API_KEY:
        _client = TokenClient(api_key=TTC_API_KEY)
    return _client


async def compress_text(text: str, aggressiveness: float = 0.7) -> str:
    """
    Compress text using Token Company's bear-1 model.
    
    Args:
        text: The text to compress
        aggressiveness: Compression level 0.0-1.0 (higher = more compression)
    
    Returns:
        Compressed text, or original if compression fails/unavailable
    """
    client = get_client()
    
    if not client:
        logging.debug("Token Company not configured, skipping compression")
        return text
    
    # Skip short text
    if len(text) < 500:
        return text
    
    try:
        result = client.compress_input(
            input=text,
            aggressiveness=aggressiveness
        )
        
        compressed = result.output
        ratio = len(text) / len(compressed) if compressed else 1.0
        logging.info(f"Compressed {len(text)} -> {len(compressed)} chars ({ratio:.1f}x)")
        
        return compressed
        
    except Exception as e:
        logging.warning(f"Token Company compression failed: {e}")
        return text


def compress_text_sync(text: str, aggressiveness: float = 0.7) -> str:
    """Synchronous version for non-async contexts."""
    import asyncio
    return asyncio.run(compress_text(text, aggressiveness))
