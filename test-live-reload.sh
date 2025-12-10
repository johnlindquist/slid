#!/bin/bash
# Test script to verify live reload functionality

SLIDES_DIR="./slides"
TEST_FILE="${SLIDES_DIR}/99_test_live_reload.md"

echo "=== Live Reload Test ==="
echo "This script tests the file watcher functionality."
echo ""

# Create a test slide
echo "1. Creating test slide..."
cat > "$TEST_FILE" << 'EOF'
# Live Reload Test

This slide was created to test the live reload feature.

## Success!

If you can see this slide appear without restarting the app,
the live reload feature is working correctly.
EOF
echo "   Created: $TEST_FILE"

sleep 2

# Modify the test slide
echo "2. Modifying test slide..."
cat > "$TEST_FILE" << 'EOF'
# Live Reload Test (Modified)

This slide was **modified** to test the live reload feature.

## Changes Detected!

- The title changed
- This content was updated
- The app should have reloaded automatically
EOF
echo "   Modified: $TEST_FILE"

sleep 2

# Delete the test slide
echo "3. Deleting test slide..."
rm "$TEST_FILE"
echo "   Deleted: $TEST_FILE"

echo ""
echo "=== Test Complete ==="
echo "If you were watching the slides app, you should have seen:"
echo "  - A new slide appear (99_test_live_reload.md)"
echo "  - The slide content update"
echo "  - The slide disappear (slide count decrease)"
