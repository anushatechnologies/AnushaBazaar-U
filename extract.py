import os
import re

log_path = r"C:\Users\manav\.gemini\antigravity\brain\dd456531-8b72-489f-a8f4-1e871ff69b3f\.system_generated\logs\overview.txt"
dest_dir = r"c:\Anusha Bazaar\src"
# Let's read the log path
with open(log_path, 'r', encoding='utf-8') as f:
    text = f.read()

# We need to find the text after "Frontend updated code only:" or "Below are the full updated frontend files."
# The user's message says:
# "Frontend updated code only:\n\n1. CartContext.tsx"
# Let's regex it.

parts = text.split("Frontend updated code only:")
if len(parts) > 1:
    relevant_text = parts[-1]
else:
    relevant_text = text

# Let's look for markdown code blocks or file names like "1. CartContext.tsx"
files_to_extract = {
    'CartContext.tsx': r'context\CartContext.tsx',
    'AllProductsFeed.tsx': r'components\AllProductsFeed.tsx',
    'CartScreen.tsx': r'screens\CartScreen.tsx',
    'CheckoutScreen.tsx': r'screens\CheckoutScreen.tsx',
    'OrderSuccessScreen.tsx': r'screens\OrderSuccessScreen.tsx',
    'RootStack.tsx': r'navigation\RootStack.tsx',
    'OrderTrackingScreen.tsx': r'screens\OrderTrackingScreen.tsx'
}

for name, rel_path in files_to_extract.items():
    print(f"Extracting {name}...")
    
    # Try to find the file header like "1. CartContext.tsx" or just "CartContext.tsx"
    pattern = rf"(?:\d+\.\s+)?{re.escape(name)}[\r\n]+(.*?)((?:\d+\.\s+[A-Za-z0-9_]+\.tsx)|$)"
    # Wait, the code might be inside ```tsx ... ``` blocks or not.
    # We will just write the script to dump everything, wait, a better way is to dump the log text to see what it looks like locally here.
    
print("done")
