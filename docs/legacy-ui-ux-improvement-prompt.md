# Legacy Hengo Dashboard UI/UX Improvement Prompt

You are an expert Frontend Developer and UI/UX Engineer. We have just completed a comprehensive UI/UX audit of the Hengo dashboard (a React/Next.js application). The audit identified several areas for improvement, particularly concerning design consistency, accessibility, and overall polish.

Your task is to implement the highest priority fixes across the codebase.

## High Priority Fixes

1.  **Accessibility: Color Contrast in Light Mode**
    *   **Issue:** Several text elements on white backgrounds in light mode have insufficient contrast, failing WCAG AA standards. This is particularly noticeable with lighter grey text used for secondary information or descriptions.
    *   **Action:** Audit the color palette (likely defined in CSS variables, Tailwind config, or a theme file). Adjust the text colors (e.g., text-gray-400 or text-gray-500) and background colors to ensure they meet WCAG AA contrast ratios (at least 4.5:1 for normal text). Use a contrast checker tool to verify. Ensure these changes do not negatively impact the dark mode theme.

2.  **Design Consistency: Spacing and Alignment**
    *   **Issue:** The use of white space, padding, and margins is inconsistent across different components (cards, sidebars, lists) and pages. There are also minor alignment issues within cards and the navigation sidebar.
    *   **Action:** Implement a stricter grid system. Review the spacing utility classes (if using Tailwind) or CSS variables for margins and padding. Standardize the padding inside cards, the spacing between sections, and the alignment of icons and text in the sidebar. Ensure a consistent vertical and horizontal rhythm.

## Medium Priority Fixes

3.  **Interaction Design: Error Handling and Feedback**
    *   **Issue:** Form validation error messages are sometimes generic. Feedback after actions (like saving or deleting) is present but could be more explicit.
    *   **Action:** Review form components. Ensure error messages are specific and actionable (e.g., instead of "Invalid input," use "Please enter a valid email address"). Improve the visibility and design of success/error toast notifications or inline feedback messages.

4.  **Accessibility: Hover and Focus States**
    *   **Issue:** Hover effects on some text links and smaller icons are too subtle. Keyboard focus indicators are sometimes subtle or inconsistent, hindering keyboard navigation.
    *   **Action:** Enhance the visual feedback for hover states (e.g., more pronounced color changes, underlines, or background highlights). Standardize and increase the visibility of focus rings (`:focus-visible`) across all interactive elements (buttons, inputs, links) to ensure they are clearly visible for keyboard users.

5.  **Design Consistency: Component Styling**
    *   **Issue:** While basic styles are consistent, there are minor variations in button padding, input border styles, and icon sizes across different sections, indicating a potential lack of strict adherence to a central component library.
    *   **Action:** Conduct a quick review of core UI components (Buttons, Inputs, Cards). Ensure they are using the standardized design tokens (colors, spacing, typography) consistently. Refactor instances where custom styles override the standard component styles unnecessarily.

## Instructions for Execution

*   Please review the codebase to locate the relevant theme configuration files, global CSS, and core UI components.
*   Implement the fixes systematically, starting with the High Priority items.
*   Ensure that all changes are responsive and do not break the layout on mobile devices.
*   Test the changes in both light and dark modes to ensure consistency.
*   Provide a summary of the files modified and the specific changes made for each fix.
