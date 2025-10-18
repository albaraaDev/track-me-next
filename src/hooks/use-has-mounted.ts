import * as React from "react";

/**
 * Returns true only after the component has mounted on the client.
 * Useful to avoid SSR/CSR mismatches when combined with client-only data.
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

