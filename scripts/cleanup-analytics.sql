-- Cleanup Script for Analytics Data
-- Run this to remove restaurant owner analytics from public metrics

-- 1. Remove owner events from analytics_events (optional - for historical cleanup)
-- Uncomment the following to delete historical owner events from non-dashboard events
/*
DELETE FROM analytics_events 
WHERE restaurant_id IN (
    SELECT ae.restaurant_id 
    FROM analytics_events ae
    JOIN restaurants r ON ae.restaurant_id = r.id
    WHERE ae.user_id = r.owner_id
    AND ae.event_type NOT IN (
        'dashboard_view', 'menu_management_click', 'preview_restaurant_click',
        'photo_upload_click', 'analytics_view_click', 'settings_click', 'location_enable_click'
    )
);
*/

-- 2. Recalculate restaurant analytics excluding owner events
-- This will update the aggregated analytics to exclude owner interactions
UPDATE restaurant_analytics 
SET 
    total_views = COALESCE((
        SELECT COUNT(*) 
        FROM analytics_events ae
        JOIN restaurants r ON ae.restaurant_id = r.id
        WHERE ae.restaurant_id = restaurant_analytics.restaurant_id
        AND ae.event_type = 'view'
        AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
    ), 0),
    
    total_clicks = COALESCE((
        SELECT COUNT(*) 
        FROM analytics_events ae
        JOIN restaurants r ON ae.restaurant_id = r.id
        WHERE ae.restaurant_id = restaurant_analytics.restaurant_id
        AND ae.event_type = 'click'
        AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
    ), 0),
    
    total_favorites = COALESCE((
        SELECT COUNT(*) 
        FROM analytics_events ae
        JOIN restaurants r ON ae.restaurant_id = r.id
        WHERE ae.restaurant_id = restaurant_analytics.restaurant_id
        AND ae.event_type = 'favorite'
        AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
    ), 0),
    
    total_calls = COALESCE((
        SELECT COUNT(*) 
        FROM analytics_events ae
        JOIN restaurants r ON ae.restaurant_id = r.id
        WHERE ae.restaurant_id = restaurant_analytics.restaurant_id
        AND ae.event_type = 'call'
        AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
    ), 0),
    
    total_directions = COALESCE((
        SELECT COUNT(*) 
        FROM analytics_events ae
        JOIN restaurants r ON ae.restaurant_id = r.id
        WHERE ae.restaurant_id = restaurant_analytics.restaurant_id
        AND ae.event_type = 'directions'
        AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
    ), 0),
    
    views_today = COALESCE((
        SELECT COUNT(*) 
        FROM analytics_events ae
        JOIN restaurants r ON ae.restaurant_id = r.id
        WHERE ae.restaurant_id = restaurant_analytics.restaurant_id
        AND ae.event_type = 'view'
        AND ae.created_at >= CURRENT_DATE
        AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
    ), 0),
    
    views_this_week = COALESCE((
        SELECT COUNT(*) 
        FROM analytics_events ae
        JOIN restaurants r ON ae.restaurant_id = r.id
        WHERE ae.restaurant_id = restaurant_analytics.restaurant_id
        AND ae.event_type = 'view'
        AND ae.created_at >= DATE_TRUNC('week', NOW())
        AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
    ), 0),
    
    views_this_month = COALESCE((
        SELECT COUNT(*) 
        FROM analytics_events ae
        JOIN restaurants r ON ae.restaurant_id = r.id
        WHERE ae.restaurant_id = restaurant_analytics.restaurant_id
        AND ae.event_type = 'view'
        AND ae.created_at >= DATE_TRUNC('month', NOW())
        AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
    ), 0),
    
    peak_hour = COALESCE((
        SELECT EXTRACT(hour FROM ae.created_at)::INTEGER as hour
        FROM analytics_events ae
        JOIN restaurants r ON ae.restaurant_id = r.id
        WHERE ae.restaurant_id = restaurant_analytics.restaurant_id
        AND ae.event_type = 'view'
        AND ae.created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
        GROUP BY EXTRACT(hour FROM ae.created_at)
        ORDER BY COUNT(*) DESC 
        LIMIT 1
    ), 12),
    
    updated_at = NOW()
WHERE restaurant_id IN (SELECT id FROM restaurants);

-- 3. Update last_view_at to exclude owner views
UPDATE restaurant_analytics 
SET last_view_at = (
    SELECT MAX(ae.created_at)
    FROM analytics_events ae
    JOIN restaurants r ON ae.restaurant_id = r.id
    WHERE ae.restaurant_id = restaurant_analytics.restaurant_id
    AND ae.event_type = 'view'
    AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
)
WHERE restaurant_id IN (SELECT id FROM restaurants);

-- 4. Verify the cleanup results
SELECT 
    r.name as restaurant_name,
    r.owner_id,
    ra.total_views,
    ra.total_clicks,
    ra.total_favorites,
    ra.views_today,
    ra.views_this_week,
    ra.views_this_month,
    ra.last_view_at
FROM restaurants r
LEFT JOIN restaurant_analytics ra ON r.id = ra.restaurant_id
ORDER BY r.name;
