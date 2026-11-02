const unit = (n, name) => `${n} ${name}${n === 1 ? '' : 's'}`;

/** "23 hours, 53 minutes and 12 seconds", with days when there are any. */
export function formatSignal(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const parts = [
    days ? unit(days, 'day') : null,
    unit(Math.floor((s % 86400) / 3600), 'hour'),
    unit(Math.floor((s % 3600) / 60), 'minute')
  ].filter(Boolean);
  return `${parts.join(', ')} and ${unit(s % 60, 'second')}`;
}

const span = seconds => {
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return unit(days, 'day');
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return unit(hours, 'hour');
  return unit(Math.max(1, Math.ceil(seconds / 60)), 'minute');
};

/** The sentence about the one-light-day milestone. */
export function milestoneLine({ phase, deltaSeconds }) {
  return phase === 'before'
    ? `In about ${span(deltaSeconds)}, on 18 November 2026, Voyager 1 first reaches one light-day from Earth.`
    : `Voyager 1 first reached one light-day from Earth on 18 November 2026, about ${span(deltaSeconds)} ago.`;
}
