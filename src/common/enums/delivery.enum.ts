export enum DeliveryType {
  COURIER = 'courier',
  FOOD = 'food',
  ECOMMERCE = 'ecommerce',
  GROCERY = 'grocery',
  DOCUMENTS = 'documents',
  MEDICINE = 'medicine',
  OTHER = 'other',
}

export enum DeliveryStatus {
  PENDING_PICKUP = 'pending_pickup',
  DELIVERED_TO_UNIT = 'delivered_to_unit',
  COLLECTED = 'collected',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}
