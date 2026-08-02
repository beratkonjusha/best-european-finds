import { useEffect, useState } from "react";

type Conn = {
  effectiveType?: string;
  saveData?: boolean;
  type?: string;
  addEventListener?: (t: string, cb: () => void) => void;
  removeEventListener?: (t: string, cb: () => void) => void;
};

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);
  const [metered, setMetered] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: Conn };
    const update = () => {
      setOnline(navigator.onLine);
      const c = nav.connection;
      const type = c?.type;
      const eff = c?.effectiveType;
      setMetered(
        Boolean(c) &&
          (type === "cellular" ||
            c?.saveData === true ||
            (type === undefined && (eff === "2g" || eff === "3g"))),
      );
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    nav.connection?.addEventListener?.("change", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      nav.connection?.removeEventListener?.("change", update);
    };
  }, []);

  return { online, metered };
}
