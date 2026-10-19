import GitHubButton from "react-github-btn";

import jackettLogo from "../assets/jackett-icon.png";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8 mb-8">
      {/* Main header row */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full px-2">
        <div className="flex gap-4 items-center min-w-0 flex-1 group cursor-default">
          <div className="relative">
            <div className="absolute -inset-2 bg-primary/30 rounded-full blur-md opacity-40 group-hover:opacity-70 transition duration-500"></div>
            <img
              src={jackettLogo}
              alt="jackett logo"
              className="relative w-12 h-12 rounded-full flex-shrink-0 dark:invert transition-all duration-500 group-hover:scale-110 group-hover:-rotate-12 drop-shadow-md"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground/90 transition-all duration-300 drop-shadow-sm">
              Jackett Search
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80 font-bold mt-0.5">
              Enhanced Torrent Search
            </p>
          </div>
        </div>

        {/* Secondary info row */}
        <div className="flex items-center gap-4">
          <div className="transition-all duration-300 hover:scale-105 opacity-80 hover:opacity-100">
            <GitHubButton
              href="https://github.com/bharathganji/jackett-search-ui"
              data-color-scheme="no-preference: light; light: light; dark: dark;"
              data-icon="octicon-star"
              data-size="small"
              data-show-count="true"
              aria-label="Star bharathganji/jackett-search-ui on GitHub"
            >
              Star
            </GitHubButton>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
