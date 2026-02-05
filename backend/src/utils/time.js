export function now() {
  return new Date();
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}
