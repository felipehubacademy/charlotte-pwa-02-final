-- Drop PWA-only push subscriptions table.
-- RN uses charlotte.users.expo_push_token instead.
DROP TABLE IF EXISTS notifications.push_subscriptions CASCADE;
