#!/bin/bash
set -e
echo "Resetting database..."
npx prisma db push --force-reset
npm run db:seed
echo "Done."
