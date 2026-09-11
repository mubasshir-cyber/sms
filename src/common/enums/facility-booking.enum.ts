export enum FacilityType {
  CLUBHOUSE = 'clubhouse',
  SWIMMING_POOL = 'swimming_pool',
  GYM = 'gym',
  PARTY_HALL = 'party_hall',
  TENNIS_COURT = 'tennis_court',
  BADMINTON_COURT = 'badminton_court',
  COMMUNITY_HALL = 'community_hall',
  ROOFTOP = 'rooftop',
  BBQ_AREA = 'bbq_area',
  GUEST_ROOM = 'guest_room',
  OTHER = 'other',
}

export enum CapacityType {
  /** Private amenity: only 1 booking allowed per time window. Any overlap is rejected. */
  EXCLUSIVE = 'exclusive',
  /** Shared amenity: multiple bookings allowed concurrently up to facility capacity. */
  SHARED = 'shared',
}

export enum BookingStatus {
  PENDING_APPROVAL = 'pending_approval',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum BookingSlotType {
  HOURLY = 'hourly',
  FIXED_SLOT = 'fixed_slot',
  FULL_DAY = 'full_day',
  CUSTOM = 'custom',
}
