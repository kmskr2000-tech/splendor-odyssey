// 날짜 유틸 (리그에서 분리, 공용).
// 기존 src/data/league.js 하단에 있던 함수들을 여기로 옮김.

// 로컬 타임존 기준 YYYY-MM-DD
export function todayStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 로컬 타임존 기준 YYYY-MM 시즌 키
export function currentSeason(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// dateStr(YYYY-MM-DD)의 n일 후/전
export function shiftDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return todayStr(dt);
}

// 해당 주의 월요일 (YYYY-MM-DD)
export function mondayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7; // 월요일=0
  dt.setDate(dt.getDate() - dow);
  return todayStr(dt);
}
