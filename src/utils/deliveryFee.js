/**
 * Delivery fee calculation helper
 * Rules:
 * - Free for distance <= freeUntilKm (default 3 km)
 * - Charge `perKm` (default ₹20) for each started km beyond `freeUntilKm`
 * - Charges apply only up to `maxKm` (default 10 km). If distance > maxKm, returned object marks `overMax: true`.
 */

export const calculateDeliveryFeeByDistance = (
  distanceKm,
  { freeUntilKm = 3, perKm = 20, maxKm = 10 } = {},
) => {
  const result = {
    fee: 0,
    extraKm: 0,
    overMax: false,
    distanceKm: Number.isFinite(Number(distanceKm)) ? Number(distanceKm) : null,
    freeUntilKm,
    perKm,
    maxKm,
  };

  const d = result.distanceKm;
  if (d == null) return result;

  if (d <= freeUntilKm) {
    return result; // fee 0
  }

  if (d > maxKm) {
    // mark over max and compute fee up to maxKm
    result.overMax = true;
    const extraKm = Math.ceil(maxKm - freeUntilKm);
    result.extraKm = extraKm;
    result.fee = extraKm * perKm;
    return result;
  }

  const extraKm = Math.ceil(d - freeUntilKm);
  result.extraKm = extraKm;
  result.fee = extraKm * perKm;
  return result;
};

export default calculateDeliveryFeeByDistance;
