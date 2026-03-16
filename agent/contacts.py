"""
Otto Voice Agent - Contacts Registry
Maps known contact names/aliases to their email addresses.
Add new contacts by adding entries to the CONTACTS dictionary.
"""

from typing import Optional

# ──────────────────────────────────────────────
# Known Contacts
# Keys: lowercase name variants / aliases
# Values: email address
# ──────────────────────────────────────────────
CONTACTS: dict[str, str] = {
    # Abdullah Rajput
    "abdullah": "abdrajput29@gmail.com",
    "abdullah rajput": "abdrajput29@gmail.com",
    "abd": "abdrajput29@gmail.com",
    "abdrajput": "abdrajput29@gmail.com",
    "zayd": "abdullahrajput209@gmail.com",
    "zaid": "abdullahrajput209@gmail.com"
}


def resolve_contact(name: str) -> Optional[str]:
    """
    Resolve a contact name or alias to an email address.

    Performs case-insensitive lookup against the CONTACTS registry.
    Returns the email address if found, or None if no match.

    Args:
        name: The contact name or alias to look up

    Returns:
        The resolved email address, or None if not found
    """
    if not name:
        return None

    lookup = name.strip().lower()

    # Direct match
    if lookup in CONTACTS:
        return CONTACTS[lookup]

    # Partial match: check if any contact key is contained in the input
    # or if the input is contained in any contact key
    for key, email in CONTACTS.items():
        if key in lookup or lookup in key:
            return email

    return None


def get_contacts_summary() -> str:
    """
    Get a formatted summary of known contacts for the LLM prompt.
    Groups unique contacts by email to avoid duplication.
    """
    # Group aliases by email
    email_to_names: dict[str, list[str]] = {}
    for name, email in CONTACTS.items():
        email_to_names.setdefault(email, []).append(name)

    lines = []
    for email, names in email_to_names.items():
        primary = max(names, key=len)  # Use longest name as primary
        lines.append(f"- {primary.title()}: {email}")

    return "\n".join(lines)
