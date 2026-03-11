import { useState, useEffect } from 'react';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function CountdownTimer({ targetDate, label, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));

  function getTimeLeft(target) {
    const diff = new Date(target) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium">
        {label && <span className="text-surface-400">{label}</span>}
        <div className="flex items-center gap-0.5 font-mono">
          {timeLeft.days > 0 && <span className="text-primary-600">{timeLeft.days}d</span>}
          <span className="text-primary-600">{pad(timeLeft.hours)}h</span>
          <span className="text-surface-400">:</span>
          <span className="text-primary-600">{pad(timeLeft.minutes)}m</span>
          <span className="text-surface-400">:</span>
          <span className="text-primary-600">{pad(timeLeft.seconds)}s</span>
        </div>
      </div>
    );
  }

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="text-center">
      {label && <p className="text-sm font-medium text-surface-500 mb-2">{label}</p>}
      <div className="flex items-center justify-center gap-2">
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="bg-white/90 backdrop-blur-sm border border-surface-200 rounded-lg px-3 py-2 min-w-[3.5rem] shadow-sm">
                <span className="text-xl sm:text-2xl font-bold font-mono text-primary-700 tabular-nums">
                  {pad(unit.value)}
                </span>
              </div>
              <span className="text-[10px] font-medium text-surface-400 mt-1 uppercase tracking-wider">
                {unit.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="text-xl font-bold text-surface-300 -mt-4">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
