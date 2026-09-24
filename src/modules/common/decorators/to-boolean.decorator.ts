import { Transform } from 'class-transformer';

// Lee obj[key] y no `value`: con enableImplicitConversion, class-transformer ya aplicó
// Boolean("false") === true antes de llegar acá.
export function ToBoolean(valorPorDefecto?: boolean) {
  return Transform(({ obj, key }) => {
    const raw = obj[key];
    if (raw === true || raw === 'true' || raw === '1' || raw === 1) return true;
    if (raw === false || raw === 'false' || raw === '0' || raw === 0) return false;
    if (raw === undefined || raw === null || raw === '') return valorPorDefecto;
    return raw;
  });
}
