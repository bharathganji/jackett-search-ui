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
            <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <img
              src={jackettLogo}
              alt="jackett logo"
              className="relative w-10 h-10 rounded-full flex-shrink-0 dark:invert transition-all duration-500 group-hover:scale-110 group-hover:rotate-12"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground transition-all duration-300">
              Jackett Search
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
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
