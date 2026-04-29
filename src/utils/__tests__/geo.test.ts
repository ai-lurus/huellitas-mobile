import { distanceMeters } from '../geo';

describe('distanceMeters', () => {
  it('devuelve ~0 para el mismo punto', () => {
    const p = { lat: 40.4168, lng: -3.7038 };
    expect(distanceMeters(p, p)).toBeLessThan(1);
  });

  it('aproxima la distancia entre dos puntos conocidos', () => {
    const a = { lat: 40.4168, lng: -3.7038 };
    const b = { lat: 40.4178, lng: -3.7038 };
    const d = distanceMeters(a, b);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(130);
  });
});
