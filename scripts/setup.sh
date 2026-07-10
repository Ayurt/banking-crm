#!/bin/bash
set -e
cp -n .env.example .env 2>/dev/null || true
npm install
npm run db:generate
npm run db:push
npm run db:seed
echo "Setup complete. Run: npm run dev"
