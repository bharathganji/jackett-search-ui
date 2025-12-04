import GitHubButton from "react-github-btn";

import jackettLogo from "../assets/jackett-icon.png";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 animate-fadeIn">
      {/* Main header row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center min-w-0 flex-1 group cursor-default">
          <img
            src={jackettLogo}
            alt="jackett logo"
            className="w-8 h-8 rounded-full flex-shrink-0 dark:invert transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
          />
          <h1 className="text-lg sm:text-xl font-bold truncate bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 dark:from-white dark:to-white/60 transition-all duration-300 group-hover:tracking-wide">
            Jackett Search
          </h1>
        </div>
        {/* Secondary info row */}
        <div className="flex items-center gap-3">
          <div className="transition-transform duration-200 hover:scale-105">
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
