#!/bin/bash

# Patch @radix-ui/react-primitive to add 'input' to NODES array
# This fixes the RadioBubbleInput undefined error in @radix-ui/react-slider with React 19

echo "Searching for @radix-ui/react-primitive instances to patch..."

# Find all react-primitive dist files
find node_modules packages -path "*/react-primitive/dist/index.js" 2>/dev/null | while read PRIMITIVE_PATH; do
  # Check if the file contains the NODES array and doesn't already have 'input'
  if grep -q "const.*NODES.*=" "$PRIMITIVE_PATH" && ! grep -A 15 "const.*NODES.*=" "$PRIMITIVE_PATH" | grep -q "'input'"; then
    echo "Patching $PRIMITIVE_PATH to add 'input' to NODES array..."

    # Use sed to add 'input', after 'img', in the NODES array
    sed -i.bak "s/'img',/'img',\n    'input',/" "$PRIMITIVE_PATH"

    # Remove backup file
    rm -f "${PRIMITIVE_PATH}.bak"

    echo "✓ Patched $PRIMITIVE_PATH"
  fi
done

echo "✓ Patch process completed"
