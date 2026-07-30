/**
 * Legal routes are excluded from search until the entity details land — nobody
 * should be able to find, cache or cite draft terms. The visible chrome lives
 * in `components/legal/legal-page.tsx`, which pages compose so they can supply
 * their own contents rail.
 */
export const metadata = {
  robots: { index: false, follow: false },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
