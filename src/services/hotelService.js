import {
  sampleHotels,
  getStoredHotels,
  getStoredHotelBySlug,
  publishNewHotel,
  setHotelDelisted,
  deleteHotel,
  restoreHotel,
  saveHotelOverrides,
  syncHotelRooms,
  getHotelOverrides,
  getCustomHotels,
  saveCustomHotel,
} from '../data/hotels';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Maps PostgreSQL hotel, room_categories, and rooms records
 * into the rich object format expected by Lodgekeys UI components.
 */
export function mapHotelRecord(h, categories = [], rooms = []) {
  if (!h) return null;

  const mappedRooms = (categories || []).map((cat) => ({
    id: cat.id,
    uuid: cat.id,
    slug: cat.slug,
    name: cat.name,
    bed: cat.bed_configuration || 'King bed',
    capacity: cat.capacity || 'Up to 2 guests',
    size: cat.room_size || '36 m²',
    view: cat.view_description || 'Courtyard View',
    features: cat.features || `${cat.bed_configuration} · ${cat.capacity}`,
    price: `₦${Number(cat.base_rate_nightly || 0).toLocaleString('en-NG')}`,
    priceNumeric: Number(cat.base_rate_nightly || 0),
    image: cat.image_url || '/images/room-deluxe.jpg',
    description: cat.description || '',
  }));

  const sampleFallback = sampleHotels.find((sh) => sh.slug === h.slug);
  const roomsAvailable = rooms && rooms.length > 0
    ? rooms.filter((r) => r.operational_status === 'available').length
    : (sampleFallback?.roomsAvailable || 4);

  return {
    id: h.id,
    uuid: h.id,
    slug: h.slug,
    name: h.name,
    subTag: h.sub_tag || `${(h.category || 'Hotel').toUpperCase()} · ${(h.area || 'ABRAKA').toUpperCase()}`,
    badge: h.badge || (sampleFallback?.badge || 'Verified Stay'),
    location: h.location || `${h.area} · Abraka`,
    area: h.area,
    address: h.address,
    category: h.category,
    rating: Number(h.rating) || 5.0,
    reviewsCount: h.reviews_count || (sampleFallback?.reviewsCount || 0),
    tagline: h.tagline || (sampleFallback?.tagline || h.description?.slice(0, 80)),
    description: h.description,
    image: h.image_url || (sampleFallback?.image || '/images/hotel-1.jpg'),
    heroImage: h.hero_image_url || (sampleFallback?.heroImage || '/images/hero-resort.jpg'),
    secondaryGallery: h.secondary_gallery && h.secondary_gallery.main
      ? h.secondary_gallery
      : (sampleFallback?.secondaryGallery || {
          main: h.hero_image_url || '/images/hero-resort.jpg',
          top: '/images/room-deluxe.jpg',
          bottom: '/images/resort-lounge.jpg',
        }),
    aboutHeadline: h.about_headline || (sampleFallback?.aboutHeadline || 'A curated stay in Abraka'),
    aboutOverview: h.about_overview || h.description,
    amenities: Array.isArray(h.amenities) && h.amenities.length > 0
      ? h.amenities
      : (sampleFallback?.amenities || ['wifi', 'pool', 'restaurant']),
    price: `₦${Number(h.starting_rate || sampleFallback?.priceNumeric || 45000).toLocaleString('en-NG')}`,
    priceNumeric: Number(h.starting_rate || sampleFallback?.priceNumeric || 45000),
    priceLabel: 'Rate from',
    roomsAvailable: roomsAvailable,
    checkIn: h.check_in_time || '2:00 PM',
    checkOut: h.check_out_time || '11:00 AM',
    extras: Array.isArray(h.extras) && h.extras.length > 0
      ? h.extras
      : (sampleFallback?.extras || [
          { title: 'Free Wi-Fi (Fiber)', icon: 'wifi' },
          { title: '24/7 Power Assurance', icon: 'zap' },
          { title: 'Secure On-site Parking', icon: 'car' },
        ]),
    policies: {
      checkIn: h.check_in_time || '2:00 PM',
      checkOut: h.check_out_time || '11:00 AM',
      arrivalPolicy: h.arrival_policy || (sampleFallback?.policies?.arrivalPolicy || 'Government-issued ID required upon check-in.'),
      cancellationPolicy: h.cancellation_policy || (sampleFallback?.policies?.cancellationPolicy || 'Free cancellation up to 48 hours prior to arrival.'),
    },
    rooms: mappedRooms.length > 0 ? mappedRooms : (sampleFallback?.rooms || []),
    galleryImages: Array.isArray(h.gallery_images) && h.gallery_images.length > 0
      ? h.gallery_images
      : (sampleFallback?.galleryImages || []),
    isDelisted: Boolean(h.is_delisted),
    isDeleted: Boolean(h.is_deleted),
  };
}

export const hotelService = {
  // Synchronous getters (fallback to memory/localStorage)
  getHotels(options = {}) {
    return getStoredHotels(options);
  },

  getHotelBySlug(slug, options = {}) {
    return getStoredHotelBySlug(slug, options);
  },

  /**
   * Asynchronously fetches published hotels directly from Supabase public.hotels
   */
  async getHotelsAsync(options = {}) {
    if (!isSupabaseConfigured) {
      return getStoredHotels(options);
    }

    try {
      let query = supabase
        .from('hotels')
        .select(`
          *,
          room_categories (
            id,
            slug,
            name,
            bed_configuration,
            capacity,
            room_size,
            view_description,
            features,
            base_rate_nightly,
            image_url,
            description,
            is_active
          ),
          rooms (
            id,
            operational_status,
            is_active
          )
        `)
        .eq('is_deleted', false);

      if (!options.includeDelisted) {
        query = query.eq('is_published', true).eq('is_delisted', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase getHotels query warning:', error.message);
        return getStoredHotels(options);
      }

      if (data && data.length > 0) {
        return data.map((h) => {
          const activeCategories = (h.room_categories || []).filter((c) => c.is_active);
          const activeRooms = (h.rooms || []).filter((r) => r.is_active);
          return mapHotelRecord(h, activeCategories, activeRooms);
        });
      }

      return getStoredHotels(options);
    } catch (err) {
      console.warn('Error fetching hotels from Supabase:', err);
      return getStoredHotels(options);
    }
  },

  /**
   * Asynchronously fetches a single hotel by slug directly from Supabase,
   * including room categories and available physical room counts.
   */
  async getHotelBySlugAsync(slug, options = {}) {
    if (!slug) return null;
    const cleanSlug = slug.trim().toLowerCase();

    if (!isSupabaseConfigured) {
      return getStoredHotelBySlug(cleanSlug, options);
    }

    try {
      let query = supabase
        .from('hotels')
        .select(`
          *,
          room_categories (
            id,
            slug,
            name,
            bed_configuration,
            capacity,
            room_size,
            view_description,
            features,
            base_rate_nightly,
            image_url,
            description,
            is_active
          ),
          rooms (
            id,
            room_number,
            operational_status,
            is_active
          )
        `)
        .eq('slug', cleanSlug);

      if (!options.includeDeleted) {
        query = query.eq('is_deleted', false);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.warn(`Supabase getHotelBySlug for "${cleanSlug}" warning:`, error.message);
        return getStoredHotelBySlug(cleanSlug, options);
      }

      if (data) {
        const activeCategories = (data.room_categories || []).filter((c) => c.is_active);
        const activeRooms = (data.rooms || []).filter((r) => r.is_active);
        return mapHotelRecord(data, activeCategories, activeRooms);
      }

      return getStoredHotelBySlug(cleanSlug, options);
    } catch (err) {
      console.warn(`Error fetching hotel "${cleanSlug}" from Supabase:`, err);
      return getStoredHotelBySlug(cleanSlug, options);
    }
  },

  /**
   * Updates hotel policies, contacts, and amenities in public.hotels
   */
  async updateHotelSettings(slug, settings) {
    if (!slug) throw new Error('Hotel slug is required.');

    // Save to local overrides for instant reactivity
    saveHotelOverrides(slug, settings);

    if (isSupabaseConfigured) {
      try {
        const payload = {
          updated_at: new Date().toISOString(),
        };

        if (settings.checkInTime) payload.check_in_time = settings.checkInTime;
        if (settings.checkOutTime) payload.check_out_time = settings.checkOutTime;
        if (settings.contactPhone) payload.contact_phone = settings.contactPhone;
        if (settings.contactEmail) payload.contact_email = settings.contactEmail;
        if (settings.website) payload.website = settings.website;
        if (settings.arrivalPolicy) payload.arrival_policy = settings.arrivalPolicy;
        if (settings.cancellationPolicy) payload.cancellation_policy = settings.cancellationPolicy;

        if (Array.isArray(settings.amenitiesList)) {
          payload.amenities = settings.amenitiesList.filter((a) => a.enabled).map((a) => a.id);
        }

        const { error } = await supabase
          .from('hotels')
          .update(payload)
          .eq('slug', slug.toLowerCase());

        if (error) throw error;
      } catch (err) {
        console.warn('Could not sync hotel settings to Supabase:', err.message);
      }
    }

    return settings;
  },

  /**
   * Sets delisted state in Supabase and local storage
   */
  async setDelistedAsync(slug, isDelisted) {
    setHotelDelisted(slug, isDelisted);
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('hotels')
          .update({ is_delisted: Boolean(isDelisted), updated_at: new Date().toISOString() })
          .eq('slug', slug.toLowerCase());
      } catch (err) {
        console.warn('Could not update delist status on Supabase:', err.message);
      }
    }
  },

  getCustomHotels() {
    return getCustomHotels();
  },

  saveCustomHotel(hotelData) {
    return saveCustomHotel(hotelData);
  },

  publishHotel(applicationData) {
    return publishNewHotel(applicationData);
  },

  getOverrides(slug) {
    return getHotelOverrides(slug);
  },

  updateOverrides(slug, overrides) {
    return saveHotelOverrides(slug, overrides);
  },

  syncRooms(slug, rooms) {
    return syncHotelRooms(slug, rooms);
  },

  setDelisted(slug, isDelisted) {
    return setHotelDelisted(slug, isDelisted);
  },

  deleteProperty(slug) {
    return deleteHotel(slug);
  },

  restoreProperty(slug) {
    return restoreHotel(slug);
  },

  /**
   * Approves a hotel application and provisions real database records in Supabase
   */
  async approveApplicationAsync(app, published) {
    if (!isSupabaseConfigured) return published;

    try {
      const hotelSlug = published?.slug || (app.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { data: newHotel, error: hotelErr } = await supabase
        .from('hotels')
        .upsert(
          {
            slug: hotelSlug,
            name: app.name,
            area: app.area || 'Town Centre',
            address: app.address || 'Abraka, Delta State',
            category: app.category || 'Hotel',
            starting_rate: Number(app.startingRate || 40000),
            contact_email: app.contactEmail,
            contact_phone: app.contactPhone,
            description: app.description || `Experience hospitality at ${app.name} in Abraka.`,
            image_url: published?.image || '/images/hotel-1.jpg',
            hero_image_url: published?.heroImage || '/images/hero-resort.jpg',
            is_published: true,
            is_delisted: false,
            is_deleted: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        )
        .select('id, slug, name')
        .single();

      if (hotelErr) {
        console.warn('approveApplicationAsync hotel upsert warning:', hotelErr.message);
        return published;
      }

      if (newHotel) {
        // 1. Create default category if needed
        const { data: category } = await supabase
          .from('room_categories')
          .upsert(
            {
              hotel_id: newHotel.id,
              slug: 'standard-deluxe-room',
              name: 'Standard Deluxe Room',
              bed_configuration: 'King bed',
              capacity: 'Up to 2 guests',
              base_rate_nightly: Number(app.startingRate || 40000),
              image_url: '/images/room-deluxe.jpg',
              is_active: true,
            },
            { onConflict: 'hotel_id,slug' }
          )
          .select('id')
          .single();

        // 2. Provision initial physical rooms (e.g. 5 rooms)
        if (category) {
          const roomCount = Math.min(Number(app.totalRooms || 5), 10);
          for (let i = 1; i <= roomCount; i++) {
            await supabase.from('rooms').upsert(
              {
                hotel_id: newHotel.id,
                category_id: category.id,
                room_number: String(100 + i),
                floor: 1,
                operational_status: 'available',
                is_active: true,
              },
              { onConflict: 'hotel_id,room_number' }
            );
          }
        }

        // 3. Link manager profile if registered
        if (app.contactEmail) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .ilike('email', app.contactEmail.trim())
            .maybeSingle();

          if (profile) {
            await supabase.from('hotel_managers').upsert(
              {
                hotel_id: newHotel.id,
                user_id: profile.id,
                is_primary: true,
              },
              { onConflict: 'hotel_id,user_id' }
            );
          }
        }

        // 4. Update application record if exists in public.hotel_applications
        await supabase
          .from('hotel_applications')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            created_hotel_id: newHotel.id,
            feedback: 'Approved and published to live catalog.',
          })
          .ilike('contact_email', app.contactEmail);
      }
    } catch (err) {
      console.warn('approveApplicationAsync exception:', err);
    }

    return published;
  },

  getRawCatalog() {
    return sampleHotels;
  },
};

