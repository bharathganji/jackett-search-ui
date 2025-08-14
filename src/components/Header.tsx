import GitHubButton from "react-github-btn";

import jackettLogo from "../assets/jackett-icon.png";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Main header row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center min-w-0 flex-1">
          <img
            src={jackettLogo}
            alt="jackett logo"
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
          <h1 className="text-lg sm:text-xl font-semibold truncate">
            Jackett Search
          </h1>
        </div>
        {/* Secondary info row */}
        <div className="flex items-center gap-3">
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
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
