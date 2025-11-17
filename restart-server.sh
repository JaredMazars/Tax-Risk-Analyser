#!/bin/bash
echo "🧹 Cleaning Next.js cache..."
rm -rf .next

echo "✨ Restarting development server..."
echo "Press Ctrl+C to stop the server when needed"
echo ""
npm run dev
