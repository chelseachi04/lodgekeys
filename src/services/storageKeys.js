/**
 * Lodgekeys Centralized Storage Keys
 * 
 * Defines all localStorage keys used across the platform during development / client-mock mode.
 * Centralizing these prevents key mismatch and enables systematic cache purging upon backend migration.
 */
export const STORAGE_KEYS = {
  USERS: 'lodgekeys_users_v1',
  SESSION: 'lodgekeys_session_v1',
  SAVED_HOTELS: 'lodgekeys_saved_hotels',
  NOTIFICATIONS: 'lodgekeys_notifications_v1',
  BOOKINGS: 'lodgekeys_bookings_v1',
  CUSTOM_HOTELS: 'lodgekeys_custom_hotels_v1',
  HOTEL_OVERRIDES: 'lodgekeys_hotel_overrides_v1',
  MANAGER_SETTINGS: 'lodgekeys_manager_settings_v1',
  MANAGER_RESERVATIONS: 'lodgekeys_manager_reservations_v1',
  MANAGER_ROOMS: 'lodgekeys_manager_rooms_v1',
  MANAGER_ACTIVITY: 'lodgekeys_manager_activity_v1',
  ADMIN_APPLICATIONS: 'lodgekeys_admin_applications_v1',
  ADMIN_ACTIVITY: 'lodgekeys_admin_activity_v1',
  ADMIN_SETTINGS: 'lodgekeys_admin_platform_settings_v1',
};
