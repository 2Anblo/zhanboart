import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { navigationConfig, siteConfig } from "@/config";

export const dynamic = "force-static";

export default function MenuPage() {
  return (
    <main className="menu-page">
      <nav className="menu-page__nav">
        <Link href="/" className="menu-page__brand">
          {siteConfig.brandName || "zhanbo.art"}
        </Link>
        <div className="menu-page__actions">
          <ThemeToggle />
          <Link href="/" className="menu-page__close">
            {navigationConfig.closeLabel || "Close"}
          </Link>
        </div>
      </nav>

      <div className="menu-page__inner">
        <div className="menu-page__links" aria-label="Site menu">
          {navigationConfig.fullscreenMenuLinks.map((link) => (
            <Link key={link.target} href={`/#${link.target}`} className="menu-page__link">
              {link.label}
            </Link>
          ))}
        </div>

        {navigationConfig.menuSideInfo.length > 0 ? (
          <div className="menu-page__side">
            {navigationConfig.menuSideInfo.map((info) => (
              <div key={info}>{info}</div>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
