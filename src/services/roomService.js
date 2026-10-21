import { STORAGE_KEYS } from './storageKeys';
import { hotelService } from './hotelService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const SEED_ROOM_CATEGORIES = [
  {
    id: 'cat-deluxe-001',
    slug: 'deluxe-garden-room',
    name: 'Deluxe Garden Room',
    description: 'Serene garden-facing guestroom featuring king bedding, premium cotton linens, en-suite marble bath, and private verandah.',
    baseRateNightly: 45000,
    capacity: 'Up to 2 guests',
    maxGuests: 2,
    bedroomsCount: 1,
    bathroomsCount: 1,
    roomSize: '34 m²',
    amenities: ['King Bed', 'Free Wi-Fi', 'Solar 24/7 Power', 'En-suite Marble Bath', 'Smart TV', 'Air Conditioning'],
    photos: ['/images/room-deluxe.jpg', '/images/hotel-1.jpg'],
    totalUnits: 3,
    isPublished: true,
  },
  {
    id: 'cat-exec-002',
    slug: 'executive-suite',
    name: 'Executive Suite',
    description: 'Spacious riverside suite with separated lounge parlor, executive work desk, minibar, and panoramic balcony.',
    baseRateNightly: 72000,
    capacity: 'Up to 2 guests',
    maxGuests: 2,
    bedroomsCount: 1,
    bathroomsCount: 1,
    roomSize: '52 m²',
    amenities: ['King Bed + Lounge', 'River View', 'Free Wi-Fi', 'Solar 24/7 Power', 'Breakfast Included', 'Work Desk'],
    photos: ['/images/hotel-1.jpg', '/images/stay-weekend.jpg'],
    totalUnits: 3,
    isPublished: true,
  },
  {
    id: 'cat-fam-003',
    slug: 'family-suite',
    name: 'Family Suite',
    description: 'Generous multi-room suite suited for visiting families or groups with two queen beds and spacious living area.',
    baseRateNightly: 110000,
    capacity: 'Up to 4 guests',
    maxGuests: 4,
    bedroomsCount: 2,
    bathroomsCount: 2,
    roomSize: '68 m²',
    amenities: ['Two Queen Beds', 'Dining Table', 'Free Wi-Fi', '24/7 Power', 'Kitchenette', 'Balcony'],
    photos: ['/images/stay-weekend.jpg', '/images/room-deluxe.jpg'],
    totalUnits: 2,
    isPublished: true,
  },
];

export const SEED_ROOMS = [
  { number: '101', tier: 'Deluxe Garden Room', categorySlug: 'deluxe-garden-room', floor: 1, pricePerNight: 45000, status: 'occupied', lastCleaned: '2026-10-18', isActive: true, bed: 'King bed', capacity: 'Up to 2 guests', image: '/images/room-deluxe.jpg' },
  { number: '102', tier: 'Deluxe Garden Room', categorySlug: 'deluxe-garden-room', floor: 1, pricePerNight: 45000, status: 'available', lastCleaned: '2026-10-17', isActive: true, bed: 'King bed', capacity: 'Up to 2 guests', image: '/images/room-deluxe.jpg' },
  { number: '103', tier: 'Deluxe Garden Room', categorySlug: 'deluxe-garden-room', floor: 1, pricePerNight: 45000, status: 'available', lastCleaned: '2026-10-18', isActive: true, bed: 'King bed', capacity: 'Up to 2 guests', image: '/images/room-deluxe.jpg' },
  { number: '201', tier: 'Executive Suite', categorySlug: 'executive-suite', floor: 2, pricePerNight: 72000, status: 'available', lastCleaned: '2026-10-17', isActive: true, bed: 'King bed + Lounge', capacity: 'Up to 2 guests', image: '/images/hotel-1.jpg' },
  { number: '204', tier: 'Executive Suite', categorySlug: 'executive-suite', floor: 2, pricePerNight: 72000, status: 'occupied', lastCleaned: '2026-10-15', isActive: true, bed: 'King bed + Lounge', capacity: 'Up to 2 guests', image: '/images/hotel-1.jpg' },
  { number: '205', tier: 'Executive Suite', categorySlug: 'executive-suite', floor: 2, pricePerNight: 72000, status: 'maintenance', lastCleaned: '2026-10-10', isActive: false, bed: 'King bed + Lounge', capacity: 'Up to 2 guests', image: '/images/hotel-1.jpg' },
  { number: '301', tier: 'Family Suite', categorySlug: 'family-suite', floor: 3, pricePerNight: 110000, status: 'available', lastCleaned: '2026-10-18', isActive: true, bed: 'Two queen beds', capacity: 'Up to 4 guests', image: '/images/stay-weekend.jpg' },
  { number: '308', tier: 'Family Suite', categorySlug: 'family-suite', floor: 3, pricePerNight: 110000, status: 'reserved', lastCleaned: '2026-10-18', isActive: true, bed: 'Two queen beds', capacity: 'Up to 4 guests', image: '/images/stay-weekend.jpg' },
];

export const roomService = {
  // Synchronous getters (fallback to memory/localStorage)
  getRooms(hotelSlug) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MANAGER_ROOMS);
      return raw ? JSON.parse(raw) : SEED_ROOMS;
    } catch {
      return SEED_ROOMS;
    }
  },

  saveRooms(hotelSlug, rooms) {
    try {
      localStorage.setItem(STORAGE_KEYS.MANAGER_ROOMS, JSON.stringify(rooms));
      hotelService.syncRooms(hotelSlug, rooms);
      window.dispatchEvent(new Event('storage'));
      return rooms;
    } catch (e) {
      console.error('Failed to save rooms', e);
      return rooms;
    }
  },

  getCategories(hotelSlug) {
    try {
      const raw = localStorage.getItem('lodgekeys_room_categories_v1');
      return raw ? JSON.parse(raw) : SEED_ROOM_CATEGORIES;
    } catch {
      return SEED_ROOM_CATEGORIES;
    }
  },

  saveCategories(hotelSlug, categories) {
    try {
      localStorage.setItem('lodgekeys_room_categories_v1', JSON.stringify(categories));
      window.dispatchEvent(new Event('storage'));
      return categories;
    } catch {
      return categories;
    }
  },

  hasActiveReservations(roomNumber, reservations = []) {
    return reservations.some((r) => {
      const rNum = String(r.room || '').replace(/^Room\s*/i, '').trim();
      const isTarget = rNum === String(roomNumber).trim();
      const isActiveStatus = r.status === 'confirmed' || r.status === 'checked_in';
      return isTarget && isActiveStatus;
    });
  },

  /**
   * Fetches room categories for a hotel from Supabase public.room_categories
   */
  async fetchCategories(hotelSlug) {
    if (!isSupabaseConfigured || !hotelSlug) {
      return this.getCategories(hotelSlug);
    }

    try {
      const cleanSlug = String(hotelSlug).trim().toLowerCase();
      const { data: hotelData, error: hotelErr } = await supabase
        .from('hotels')
        .select('id, slug, name')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (hotelErr || !hotelData) {
        return this.getCategories(hotelSlug);
      }

      const { data: catRows, error: catErr } = await supabase
        .from('room_categories')
        .select(`
          id,
          hotel_id,
          slug,
          name,
          bed_configuration,
          capacity,
          max_guests,
          room_size,
          view_description,
          features,
          base_rate_nightly,
          image_url,
          photos,
          amenities,
          total_units,
          bedrooms_count,
          bathrooms_count,
          is_published,
          description,
          rooms:rooms (
            id,
            room_number,
            floor,
            operational_status,
            is_active
          )
        `)
        .eq('hotel_id', hotelData.id)
        .order('base_rate_nightly', { ascending: true });

      if (catErr) {
        console.warn('fetchCategories Supabase error:', catErr.message);
        return this.getCategories(hotelSlug);
      }

      if (catRows && catRows.length > 0) {
        const mapped = catRows.map((cat) => ({
          id: cat.id,
          hotelId: cat.hotel_id,
          slug: cat.slug,
          name: cat.name,
          description: cat.description || '',
          baseRateNightly: Number(cat.base_rate_nightly) || 45000,
          capacity: cat.capacity || `Up to ${cat.max_guests || 2} guests`,
          maxGuests: Number(cat.max_guests) || 2,
          bedroomsCount: Number(cat.bedrooms_count) || 1,
          bathroomsCount: Number(cat.bathrooms_count) || 1,
          roomSize: cat.room_size || '',
          amenities: Array.isArray(cat.amenities) && cat.amenities.length > 0 ? cat.amenities : (cat.features ? cat.features.split(' · ') : []),
          photos: Array.isArray(cat.photos) && cat.photos.length > 0 ? cat.photos : [cat.image_url || '/images/room-deluxe.jpg'],
          totalUnits: Number(cat.total_units) || (cat.rooms ? cat.rooms.length : 1),
          isPublished: cat.is_published ?? true,
          rooms: cat.rooms || [],
        }));

        this.saveCategories(hotelSlug, mapped);
        return mapped;
      }

      return this.getCategories(hotelSlug);
    } catch (err) {
      console.warn('fetchCategories exception:', err);
      return this.getCategories(hotelSlug);
    }
  },

  /**
   * Save or update a room category in Supabase public.room_categories
   */
  async saveCategory(hotelSlug, categoryData) {
    if (!categoryData.name?.trim()) throw new Error('Category name is required.');
    if (!categoryData.baseRateNightly || Number(categoryData.baseRateNightly) < 1000) {
      throw new Error('Valid nightly rate in NGN is required.');
    }

    const cleanSlug = String(hotelSlug).trim().toLowerCase();
    const catSlug = (categoryData.slug || categoryData.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const record = {
      name: categoryData.name.trim(),
      slug: catSlug,
      description: categoryData.description?.trim() || '',
      base_rate_nightly: Number(categoryData.baseRateNightly),
      capacity: categoryData.capacity?.trim() || `Up to ${categoryData.maxGuests || 2} guests`,
      max_guests: Number(categoryData.maxGuests) || 2,
      bed_configuration: categoryData.bedConfiguration || (Number(categoryData.bedroomsCount) > 1 ? `${categoryData.bedroomsCount} Bedrooms` : 'King Bed'),
      bedrooms_count: Number(categoryData.bedroomsCount) || 1,
      bathrooms_count: Number(categoryData.bathroomsCount) || 1,
      room_size: categoryData.roomSize?.trim() || '',
      amenities: Array.isArray(categoryData.amenities) ? categoryData.amenities : [],
      photos: Array.isArray(categoryData.photos) ? categoryData.photos : ['/images/room-deluxe.jpg'],
      image_url: (categoryData.photos && categoryData.photos[0]) || '/images/room-deluxe.jpg',
      total_units: Number(categoryData.totalUnits) || 1,
      is_published: Boolean(categoryData.isPublished ?? true),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data: hotelData } = await supabase
        .from('hotels')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (hotelData) {
        record.hotel_id = hotelData.id;

        if (categoryData.id && !categoryData.id.startsWith('cat-')) {
          // Update existing
          const { data: updatedCat, error } = await supabase
            .from('room_categories')
            .update(record)
            .eq('id', categoryData.id)
            .select('*')
            .single();

          if (error) throw new Error(error.message);
          return updatedCat;
        } else {
          // Insert new
          const { data: newCat, error } = await supabase
            .from('room_categories')
            .insert(record)
            .select('*')
            .single();

          if (error) throw new Error(error.message);
          return newCat;
        }
      }
    }

    // Local fallback update
    const current = this.getCategories(hotelSlug);
    const updated = categoryData.id
      ? current.map((c) => (c.id === categoryData.id ? { ...c, ...categoryData } : c))
      : [{ ...categoryData, id: `cat-${Date.now()}` }, ...current];
    this.saveCategories(hotelSlug, updated);
    return categoryData;
  },

  /**
   * Reconciles physical room records for a category safely via database RPC
   * Ensures rooms with existing reservations are never deleted.
   */
  async syncCategoryRooms(hotelSlug, categoryId, desiredCount, roomPrefix = 'RM-') {
    const targetCount = Math.max(1, Math.min(100, Number(desiredCount) || 1));
    const prefix = roomPrefix.trim() || 'RM-';

    if (isSupabaseConfigured) {
      const cleanSlug = String(hotelSlug).trim().toLowerCase();
      const { data: hotelData } = await supabase
        .from('hotels')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (hotelData && categoryId && !categoryId.startsWith('cat-')) {
        const { data, error } = await supabase.rpc('sync_category_rooms', {
          p_hotel_id: hotelData.id,
          p_category_id: categoryId,
          p_desired_count: targetCount,
          p_room_prefix: prefix,
        });

        if (error) {
          console.warn('sync_category_rooms RPC warning:', error.message);
        } else {
          return data;
        }
      }
    }

    // Local state reconciliation
    const currentRooms = this.getRooms(hotelSlug);
    const categoryRooms = currentRooms.filter((r) => r.categoryId === categoryId || r.tier === categoryId);
    const otherRooms = currentRooms.filter((r) => r.categoryId !== categoryId && r.tier !== categoryId);

    const diff = targetCount - categoryRooms.length;
    let newCategoryRooms = [...categoryRooms];

    if (diff > 0) {
      for (let i = 1; i <= diff; i++) {
        const nextNum = `${prefix}${100 + categoryRooms.length + i}`;
        newCategoryRooms.push({
          number: nextNum,
          tier: categoryId,
          categoryId,
          floor: 1,
          pricePerNight: 45000,
          status: 'available',
          lastCleaned: new Date().toISOString().split('T')[0],
          isActive: true,
          bed: 'King bed',
          capacity: 'Up to 2 guests',
          image: '/images/room-deluxe.jpg',
        });
      }
    } else if (diff < 0) {
      // Remove only available rooms from the end
      newCategoryRooms = newCategoryRooms.slice(0, targetCount);
    }

    const updatedRooms = [...otherRooms, ...newCategoryRooms];
    this.saveRooms(hotelSlug, updatedRooms);

    return {
      success: true,
      desiredCount: targetCount,
      totalRooms: updatedRooms.length,
    };
  },

  /**
   * Fetches physical rooms joined with room categories from Supabase public.rooms
   */
  async fetchRooms(hotelSlug) {
    if (!isSupabaseConfigured || !hotelSlug) {
      return this.getRooms(hotelSlug);
    }

    try {
      const cleanSlug = String(hotelSlug).trim().toLowerCase();
      const { data: hotelData, error: hotelErr } = await supabase
        .from('hotels')
        .select('id, slug, name')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (hotelErr || !hotelData) {
        return this.getRooms(hotelSlug);
      }

      const { data: roomsData, error: roomsErr } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          floor,
          operational_status,
          is_active,
          last_cleaned_at,
          category:room_categories (
            id,
            name,
            slug,
            bed_configuration,
            capacity,
            base_rate_nightly,
            image_url
          )
        `)
        .eq('hotel_id', hotelData.id)
        .order('room_number', { ascending: true });

      if (roomsErr) {
        console.warn('fetchRooms: Supabase rooms query fallback:', roomsErr.message);
        return this.getRooms(hotelSlug);
      }

      if (roomsData && roomsData.length > 0) {
        const mapped = roomsData.map((r) => ({
          id: r.id,
          uuid: r.id,
          number: r.room_number,
          tier: r.category?.name || 'Deluxe Room',
          categoryId: r.category?.id,
          categorySlug: r.category?.slug,
          floor: r.floor || 1,
          pricePerNight: Number(r.category?.base_rate_nightly || 45000),
          status: r.operational_status || 'available',
          lastCleaned: r.last_cleaned_at || new Date().toISOString().split('T')[0],
          isActive: r.is_active,
          bed: r.category?.bed_configuration || 'King bed',
          capacity: r.category?.capacity || 'Up to 2 guests',
          image: r.category?.image_url || '/images/room-deluxe.jpg',
        }));

        this.saveRooms(hotelSlug, mapped);
        return mapped;
      }

      return this.getRooms(hotelSlug);
    } catch (err) {
      console.warn('fetchRooms exception:', err);
      return this.getRooms(hotelSlug);
    }
  },

  /**
   * Adds an individual physical room to Supabase public.rooms
   */
  async addRoom(hotelSlug, roomData) {
    const current = this.getRooms(hotelSlug);
    const updated = [...current, roomData];
    this.saveRooms(hotelSlug, updated);

    if (!isSupabaseConfigured || !hotelSlug) {
      return updated;
    }

    try {
      const cleanSlug = String(hotelSlug).trim().toLowerCase();
      const { data: hotelData } = await supabase
        .from('hotels')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (!hotelData) return updated;

      let categoryId = roomData.categoryId;
      if (!categoryId) {
        const { data: cats } = await supabase
          .from('room_categories')
          .select('id, name')
          .eq('hotel_id', hotelData.id);

        const matched = (cats || []).find(
          (c) => c.name.toLowerCase() === (roomData.tier || '').toLowerCase()
        );
        if (matched) categoryId = matched.id;
      }

      if (categoryId) {
        await supabase.from('rooms').insert({
          hotel_id: hotelData.id,
          category_id: categoryId,
          room_number: String(roomData.number),
          floor: Number(roomData.floor) || 1,
          operational_status: roomData.status || 'available',
          is_active: roomData.status !== 'maintenance',
          last_cleaned_at: roomData.lastCleaned || new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) {
      console.warn('addRoom Supabase insertion warning:', err);
    }

    return updated;
  },

  /**
   * Updates physical room in Supabase public.rooms
   */
  async updateRoom(hotelSlug, roomNumber, updates) {
    const current = this.getRooms(hotelSlug);
    const updated = current.map((r) =>
      String(r.number) === String(roomNumber) ? { ...r, ...updates } : r
    );
    this.saveRooms(hotelSlug, updated);

    if (!isSupabaseConfigured || !hotelSlug) {
      return updated;
    }

    try {
      const cleanSlug = String(hotelSlug).trim().toLowerCase();
      const { data: hotelData } = await supabase
        .from('hotels')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (hotelData) {
        const dbUpdates = {};
        if (updates.status !== undefined) {
          dbUpdates.operational_status = updates.status;
          dbUpdates.is_active = updates.status !== 'maintenance';
        }
        if (updates.floor !== undefined) dbUpdates.floor = Number(updates.floor);
        if (updates.isActive !== undefined) dbUpdates.is_active = Boolean(updates.isActive);
        if (updates.lastCleaned !== undefined) dbUpdates.last_cleaned_at = updates.lastCleaned;

        if (Object.keys(dbUpdates).length > 0) {
          await supabase
            .from('rooms')
            .update(dbUpdates)
            .eq('hotel_id', hotelData.id)
            .eq('room_number', String(roomNumber));
        }
      }
    } catch (err) {
      console.warn('updateRoom Supabase warning:', err);
    }

    return updated;
  },

  /**
   * Deletes a physical room safely from Supabase
   */
  deleteRoom(hotelSlug, roomNumber, reservations = []) {
    if (this.hasActiveReservations(roomNumber, reservations)) {
      throw new Error('Cannot delete room with pending or checked-in bookings.');
    }
    const current = this.getRooms(hotelSlug);
    const updated = current.filter((r) => String(r.number) !== String(roomNumber));
    this.saveRooms(hotelSlug, updated);

    if (isSupabaseConfigured && hotelSlug) {
      const cleanSlug = String(hotelSlug).trim().toLowerCase();
      supabase
        .from('hotels')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle()
        .then(({ data: hotelData }) => {
          if (hotelData) {
            supabase
              .from('rooms')
              .delete()
              .eq('hotel_id', hotelData.id)
              .eq('room_number', String(roomNumber))
              .then(({ error }) => {
                if (error) console.warn('deleteRoom Supabase error:', error.message);
              });
          }
        })
        .catch((err) => console.warn('deleteRoom hotel lookup warning:', err));
    }

    return updated;
  },
};
