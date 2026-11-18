export function currentLocalHour() {
  const now = new Date();
  return now.getTime() - elapsedInHour(now);
}

function elapsedInHour(now: Date) {
  return (now.getMinutes() * 60 + now.getSeconds()) * 1000 + now.getMilliseconds();
}

export function subscribeToHour(notify: () => void) {
  function schedule() {
    return setTimeout(
      () => {
        timer = schedule();
        notify();
      },
      3_600_000 - elapsedInHour(new Date()),
    );
  }
  let timer = schedule();
  return () => clearTimeout(timer);
}
