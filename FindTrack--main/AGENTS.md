# System Instructions for FindTrack AI Assistant

## Core Architecture & Context
This is **FindTrack**, a full-stack Lost & Found system utilizing React, Tailwind CSS, and Firebase (Firestore + Auth).

## Mobile-First Layout & Modal Guidelines
When building or modifying overlays, modals, or fullscreen pages (like the "Log Ownership Claim" screen), adhere to the following UI/UX rules to prevent content from being cut off or hidden on mobile devices:

1. **Viewport Strategy**:
   - Use `h-[100dvh]` or `style={{ height: '100dvh' }}` instead of `100vh` on fixed overlays to account for mobile browser UI (address bars, navigation bars) expanding and contracting.

2. **Modal/Overlay Containers**:
   - Limit the inner container's height using `max-h-[85dvh]` or `max-h-[90dvh]` so it never bleeds off-screen.
   - Example structure:
     ```tsx
     <div className="fixed inset-0 flex items-center justify-center p-4 z-[1000]" style={{ height: '100dvh' }}>
       <div className="relative w-full max-w-2xl flex flex-col max-h-[85dvh]">
         {/* Internal content goes here */}
       </div>
     </div>
     ```

3. **Scrollable Content**:
   - The middle content body of a modal MUST use `flex-1 overflow-y-auto` to allow internal scrolling when the content exceeds the screen height.
   - Ensure the header and footer of the modal are `shrink-0` so they stay fixed while the middle scrolls.

4. **Z-Index Management**:
   - Use appropriate `z-index` layers (e.g., `z-50`, `z-[1000]`) to ensure modals always render above background panels, banners, and floating action buttons.

## Styling & Tailwind Preferences
- Maintain the current aesthetic: clean borders, specific box-shadows, and the teal brand color (`teal-600`, `teal-800` gradients) for prominent headers.
- Continue using Lucide React icons for standard actions but allow native emoji for quick labels as established in the design syntax.
