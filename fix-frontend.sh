#!/bin/bash

echo "🚀 FIXING FRONTEND..."

# 1. Ensure correct folder
if [ ! -f "index.html" ]; then
  echo "❌ Run this inside your frontend folder"
  exit 1
fi

# 2. Clean junk files
echo "🧹 Cleaning junk files..."
rm -f *"Copy.html" *"new 5.html" *"terms and privacy.html"

# 3. Create js folder
mkdir -p js

# 4. Create API file
echo "⚙️ Creating API config..."
cat > js/api.js << 'EOF'
const API_BASE = "http://localhost:3000";

export async function apiRequest(endpoint, method = "GET", data = null, token = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : null,
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "API error");

  return result;
}
EOF

# 5. Inject login script into signin.html
echo "🔐 Fixing signin.html..."

sed -i '/<\/body>/i \
<script type="module">\
import { apiRequest } from "./js/api.js";\
document.querySelector("form").addEventListener("submit", async (e) => {\
e.preventDefault();\
const email = document.querySelector("input[type=email]").value;\
const password = document.querySelector("input[type=password]").value;\
try {\
const res = await apiRequest("/auth/login","POST",{email,password});\
localStorage.setItem("token", res.token);\
window.location.href="dashboard.html";\
} catch(e){ alert(e.message);}\
});\
</script>' signin.html

# 6. Protect dashboard
echo "🛡️ Securing dashboard..."
sed -i '1i <script>if(!localStorage.getItem("token")){window.location.href="signin.html";}</script>' dashboard.html

# 7. Create auth helper
cat > js/auth.js << 'EOF'
export function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "signin.html";
  return token;
}
EOF

# 8. Init git if not exists
if [ ! -d ".git" ]; then
  echo "📦 Initializing git..."
  git init
fi

# 9. Add & commit
git add .
git commit -m "🔥 Auto fix frontend + API integration"

# 10. Push (change branch if needed)
echo "🚀 Pushing to GitHub..."
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git 2>/dev/null
git push -u origin main

echo "🌍 Deploying to Netlify..."

# 11. Netlify deploy (requires netlify-cli)
if command -v netlify &> /dev/null
then
  netlify deploy --prod --dir .
else
  echo "⚠️ Netlify CLI not installed. Run:"
  echo "npm install -g netlify-cli"
  echo "netlify login"
  echo "netlify deploy --prod --dir ."
fi

echo "✅ DONE"