export enum VehicleType {
  CAR = 'car',
  BIKE = 'bike',
  BICYCLE = 'bicycle',
  EV_CAR = 'ev_car',
  EV_BIKE = 'ev_bike',
  OTHER = 'other',
}

export enum VehicleVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum ParkingSlotType {
  COVERED = 'covered',
  OPEN = 'open',
  BASEMENT = 'basement',
  STILT = 'stilt',
  EV_CHARGING = 'ev_charging',
}

export enum ParkingSlotStatus {
  AVAILABLE = 'available',
  ALLOCATED = 'allocated',
  BLOCKED = 'blocked',
  MAINTENANCE = 'maintenance',
}

export enum AllocationType {
  PRIMARY = 'primary',
  ADDITIONAL = 'additional',
  TEMPORARY = 'temporary',
  VISITOR = 'visitor',
}

export enum TransferStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}
