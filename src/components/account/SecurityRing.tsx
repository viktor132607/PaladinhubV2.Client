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
        strokeWidth="6"
      />
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke="#76d900"
        strokeWidth="6"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset={100 - value}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="61"
        textAnchor="middle"
        fill="#e9ecef"
        fontSize="29"
        fontWeight="700"
      >
        {value}%
      </text>
      <text
        x="60"
        y="80"
        textAnchor="middle"
        fill="#f1f3f7"
        fontSize="10"
        fontWeight="700"
      >
        {value === 100 ? "COMPLETE" : "SECURITY"}
      </text>
    </svg>
  );
}
