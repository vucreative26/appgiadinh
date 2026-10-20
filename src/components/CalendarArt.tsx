export function CalendarArt({ day }: { day: number }) {
  return (
    <svg viewBox="0 0 280 260" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id="calendar-paper"
          x1="90"
          y1="60"
          x2="220"
          y2="230"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#fff" />
          <stop offset="1" stop-color="#b8d9fa" />
        </linearGradient>
        <linearGradient
          id="calendar-top"
          x1="80"
          y1="60"
          x2="220"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#92c9ff" />
          <stop offset="1" stop-color="#4a8fdf" />
        </linearGradient>
        <filter
          id="calendar-shadow"
          x="0"
          y="0"
          width="280"
          height="280"
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow dx="0" dy="18" stdDeviation="12" flood-color="#020d25" flood-opacity=".3" />
        </filter>
      </defs>
      <circle cx="155" cy="138" r="106" fill="#fff" fill-opacity=".04" />
      <circle cx="155" cy="138" r="83" stroke="#b5dbff" stroke-opacity=".14" />
      <circle cx="229" cy="48" r="17" fill="#ffdda1" />
      <path
        d="M38 82h12m-6-6v12M231 199h10m-5-5v10"
        stroke="#c1e3ff"
        stroke-width="3"
        stroke-linecap="round"
      />
      <g transform="rotate(9 145 137)" filter="url(#calendar-shadow)">
        <rect x="70" y="65" width="157" height="162" rx="24" fill="#70a9df" />
        <rect x="62" y="57" width="157" height="162" rx="24" fill="url(#calendar-paper)" />
        <path d="M62 81a24 24 0 0 1 24-24h109a24 24 0 0 1 24 24v26H62Z" fill="url(#calendar-top)" />
        <rect x="94" y="40" width="12" height="37" rx="6" fill="#d6ecff" />
        <rect x="173" y="40" width="12" height="37" rx="6" fill="#d6ecff" />
        <path
          d="M90 128h12m18 0h12m18 0h12m18 0h12"
          stroke="#a9c9e8"
          stroke-width="5"
          stroke-linecap="round"
        />
        <text
          x="140"
          y="192"
          text-anchor="middle"
          font-family="system-ui, sans-serif"
          font-size="63"
          font-weight="650"
          letter-spacing="-4"
          fill="#183b69"
        >
          {String(day).padStart(2, '0')}
        </text>
      </g>
      <circle cx="211" cy="209" r="29" fill="#d8eaff" />
      <path
        d="m198 208 9 9 17-18"
        stroke="#3874be"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
