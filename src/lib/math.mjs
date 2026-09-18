export const normalize = value => ((value % 360) + 360) % 360;
const finite = (...values) => { if (!values.every(Number.isFinite)) throw new TypeError('유한한 숫자를 입력하세요.'); };
export function antiscia(longitude) { finite(longitude); return normalize(180 - longitude); }
export function fortune(asc, sun, moon, night = false) { finite(asc, sun, moon); return normalize(asc + (night ? sun - moon : moon - sun)); }
export function profection(age, sign = 0) {
  if (!Number.isInteger(age) || age < 0 || age > 150 || !Number.isInteger(sign) || sign < 0 || sign > 11) throw new RangeError('나이는 0~150, 사인은 0~11의 정수여야 합니다.');
  return { house: age % 12 + 1, sign: (sign + age) % 12 };
}
export const signs = ['양자리','황소자리','쌍둥이자리','게자리','사자자리','처녀자리','천칭자리','전갈자리','사수자리','염소자리','물병자리','물고기자리'];
export function position(value) { const v = normalize(value); const minutes = Math.round(v * 60) % 21600; return `${signs[Math.floor(minutes / 1800)]} ${Math.floor(minutes % 1800 / 60)}° ${minutes % 60}′`; }
