#!/bin/bash

echo "===== 🔍 FRONTEND ROOT DEBUG START ====="

echo ""
echo "📁 Current Directory:"
pwd

echo ""
echo "📦 Node Version:"
node -v

echo ""
echo "📦 Installed Packages:"
npm list --depth=0

echo ""
echo "🔐 ENV VARIABLES:"
if [ -f .env ]; then
  cat .env
else
  echo "❌ No .env file"
fi

echo ""
echo "🛠 BUILD TEST:"
npm run build > build.log 2>&1

echo ""
echo "📄 BUILD LOG:"
cat build.log

echo ""
echo "🔥 BUILD ERRORS:"
grep -i "error" build.log || echo "✅ No build errors"

echo ""
echo "🌍 CHECK API URL IN CODE:"
grep -r "http" src/ || echo "❌ No API URLs found"

echo ""
echo "===== ✅ FRONTEND DEBUG COMPLETE ====="