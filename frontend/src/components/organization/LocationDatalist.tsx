"use client";

import { useEffect, useState } from "react";
import { organizationAPI } from "@/lib/api/organizationAPI";

// Suggests active locations for a free-text posting field; pair with
// <Input list={id} />. Typing a name that is not listed is still allowed.
export function LocationDatalist({ id }: { id: string }) {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    organizationAPI.listLocations(true)
      .then(locations => setNames(locations.map(l => l.name)))
      // No suggestions is a usable fallback: the field stays free text.
      .catch(() => setNames([]));
  }, []);

  return (
    <datalist id={id}>
      {names.map(name => <option key={name} value={name} />)}
    </datalist>
  );
}
