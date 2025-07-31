#!/bin/bash
echo "🔥 Testing Felipe Xavier (Desktop)..."
curl -X POST https://charlotte.hubacademybr.com/api/notifications/test-direct \
-H "Content-Type: application/json" \
-d '{"user_id": "5ebb9b09-46f3-4499-b099-46a804da6fb6", "name": "Felipe"}'