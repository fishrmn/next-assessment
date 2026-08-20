export type NavbarElementConfig = {
  type: "navbar"
  /** Shown as a text logo when no logoUrl is set. */
  brandName: string
  /** Optional logo image URL — replaces the brand name text. */
  logoUrl?: string
  links: { label: string; href: string }[]
  /** Any valid CSS color for the bar background. */
  backgroundColor?: string
  /** Any valid CSS color for the brand name and links. */
  textColor?: string
  ctaLabel?: string
  ctaHref?: string
}

export function NavbarElement({ config }: { config: NavbarElementConfig }) {
  return (
    <nav
      aria-label="Site"
      style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
      }}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-6 py-4">
        <a href="#" className="flex shrink-0 items-center gap-2">
          {config.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-supplied remote URLs; next/image requires whitelisted hosts
            <img
              src={config.logoUrl}
              alt={config.brandName}
              className="h-8 w-auto"
            />
          ) : (
            <span className="font-heading text-lg font-semibold tracking-tight">
              {config.brandName}
            </span>
          )}
        </a>
        <ul className="hidden flex-1 items-center justify-center gap-6 text-sm sm:flex">
          {config.links.map((link, index) => (
            <li key={index}>
              <a
                href={link.href}
                className="opacity-80 transition-opacity hover:opacity-100"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        {config.ctaLabel ? (
          <a
            href={config.ctaHref ?? "#"}
            className="ml-auto inline-flex items-center rounded-full border border-current px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-80 sm:ml-0"
          >
            {config.ctaLabel}
          </a>
        ) : null}
      </div>
    </nav>
  )
}
