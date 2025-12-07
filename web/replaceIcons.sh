#!/bin/bash

# Create a Python script to do the replacements
cat > /tmp/replace_icons.py << 'PYTHON_SCRIPT'
import re
import sys

def convert_icon_name(name):
    """Convert kebab-case to camelCase with bootstrap prefix"""
    parts = name.split('-')
    camel = ''.join(word.capitalize() for word in parts)
    return f'bootstrap{camel}'

def process_file(content):
    # Replace imports
    content = re.sub(
        r"import\s*\{\s*BiComponent\s*\}\s*from\s*['\"]dfx-bootstrap-icons['\"]",
        r"import { NgIcon } from '@ng-icons/core'",
        content
    )

    # Replace BiComponent with NgIcon
    content = re.sub(r'\bBiComponent\b', 'NgIcon', content)

    # Replace <bi> tags (but not [name] bindings) - self-closing
    def replace_bi_tag(match):
        before = match.group(1)
        quote = match.group(2)
        icon_name = match.group(3)
        after = match.group(4)
        closing = match.group(5)

        new_name = convert_icon_name(icon_name)
        return f'<ng-icon {before}name={quote}{new_name}{quote}{after}{closing}'

    # Pattern for bi tags without [name] binding
    # Self-closing: <bi class="..." name="icon-name" />
    content = re.sub(
        r'<bi\s+(?![^>]*\[name\])([^>]*?)name=([\"\'])([a-zA-Z0-9-]+)\2([^>]*?)\s*(\/?>)',
        replace_bi_tag,
        content
    )

    # Replace closing tags
    content = re.sub(r'</bi>', '</ng-icon>', content)

    return content

if __name__ == '__main__':
    file_path = sys.argv[1]

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = process_file(content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
PYTHON_SCRIPT

# Find all TypeScript and HTML files
find . -type f \( -name "*.ts" -o -name "*.html" \) | while read -r file; do
    echo "Processing: $file"
    python3 /tmp/replace_icons.py "$file"
done

# Cleanup
rm /tmp/replace_icons.py

echo "Replacement complete!"
