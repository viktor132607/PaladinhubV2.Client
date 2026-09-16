import s from "./account.module.css";
export default function SecurityRing({ score }: { score: number }) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <svg
      className={s.ring}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Account security ${value}%`}
    >
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke="#233436"
        strokeWidth="14"
      />
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke="#1bdd82"
        strokeWidth="14"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset={100 - value}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="67"
        textAnchor="middle"
        fill="#e9ecef"
        fontSize="23"
        fontWeight="700"
      >
        {value}%
      </text>
    </svg>
  );
}
