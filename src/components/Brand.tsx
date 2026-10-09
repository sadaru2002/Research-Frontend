import { Orbit } from "lucide-react";
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon">
        <Orbit size={24} />
      </span>
      <span>
        research<span className="brand-dot">.</span>
      </span>
    </div>
  );
}
