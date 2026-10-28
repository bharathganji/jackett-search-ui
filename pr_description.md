🧹 [code health improvement] Refactor JackettSearch component into a custom hook

🎯 **What:** The `JackettSearch` component was overly complex, managing a lot of state, side effects, and business logic directly within the UI component. I've extracted all of this logic into a new custom hook called `useJackettSearch`.

💡 **Why:** This significantly improves the readability and maintainability of the `JackettSearch` component by separating the business logic from the presentation layer. The component itself is now much smaller and focused solely on rendering the UI based on the state provided by the hook. This also makes the logic potentially reusable if needed elsewhere and easier to test in isolation in the future.

✅ **Verification:** I ran `npm run format` and `npm run test` to ensure no issues were introduced. The tests passed, and formatting is correct. I also verified the application builds successfully with `npm run build`.

✨ **Result:** The `JackettSearch.tsx` file is now much smaller and easier to understand, with the complex logic neatly encapsulated in `useJackettSearch.ts`.
