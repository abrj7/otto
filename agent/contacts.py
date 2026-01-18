# Contact Database for Voice Agent
# Maps common names to email addresses for easy voice commands

CONTACTS = {
    "abdullah": "abdrajput29@gmail.com",
    "aidan": "aidanjeon07@gmail.com",
    "ali": "contact.ali@gmail.com",
}

def resolve_contact(name_or_email: str) -> str:
    """
    Resolve a contact name to email address.
    If input is already an email, return as-is.
    If input is a name, look it up in CONTACTS.
    
    Args:
        name_or_email: Either a person's name or an email address
        
    Returns:
        Email address
    """
    # If already an email (contains @), return as-is
    if "@" in name_or_email:
        return name_or_email
    
    # Otherwise, look up in contacts
    name_lower = name_or_email.lower().strip()
    return CONTACTS.get(name_lower, name_or_email)
