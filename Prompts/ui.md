https://stitch.withgoogle.com/projects/1498159939795339604
Act as a Senior Frontend Engineer and UI System Architect.

Your task is to read and analyze ALL UI screens/components from the provided Stitch MCP link, then generate production-ready frontend code for the existing React Vite TypeScript project.

IMPORTANT:
- STRICTLY follow all conventions and architecture rules defined in FE_RULES.md
- DO NOT generate mock/demo code
- Generate real reusable application code
- Maintain scalable enterprise architecture

---

# INPUT SOURCE

Read all UI screens, flows, layouts, components, spacing, typography, and interactions from the provided Stitch MCP/UI link.

Convert those designs into actual React components and pages.

---

# TECH STACK (MANDATORY)

- React + Vite + TypeScript
- HeroUI ONLY for UI components
- TailwindCSS ONLY for styling
- React Query for server state
- Zustand for local/global UI state
- React Router for routing

DO NOT use:
- Material UI
- Ant Design
- Chakra
- Bootstrap
- Random CSS libraries
- Inline CSS unless absolutely necessary

---

# REQUIRED PROJECT STRUCTURE

Generate code following this exact architecture:

src/
├── modules/
├── components/
├── layouts/
├── hooks/
├── api/
├── store/
├── types/
├── pages/
├── routes/
└── main.tsx

---

# UI REQUIREMENTS

Match the Stitch design as closely as possible:
- layout
- spacing
- typography
- responsiveness
- interactions
- hover states
- loading states
- empty states

---

# DESIGN SYSTEM RULES

Theme:
- Build a modern enterprise dashboard aesthetic inspired by Datadog, GitLab CI/CD, Jira, and Vercel Dashboard.
- Primary color palette must use light blue / cyan tones:
  - #E6F4FF
  - #BAE0FF
  - #91CAFF
- Background colors:
  - Main background: soft gray (#F5F7FA)
  - Card/container background: white (#FFFFFF)
- Accent status colors:
  - Success: #52C41A
  - Error: #FF4D4F
  - Warning: #FAAD14
  - Info: #1677FF
- Terminal/log panel:
  - Background: #000000
  - Normal text: #D9F7BE
  - Error text: #FF7875

Style:
- Minimal
- Clean
- Professional
- Technical enterprise UI
- Focused on monitoring, debugging, and automation workflows

Avoid:
- Heavy gradients
- Neon colors
- Glassmorphism
- Overly playful UI
- Crowded layouts
- Thick borders

Use:
- Soft shadows
- Layered cards
- Subtle hover effects
- Clear visual hierarchy
- Spacious layouts

Border Radius:
- Cards: 10px–14px
- Buttons/Input/Table: 6px–8px
- Modal/Dialog: 12px

Spacing:
- Strictly use 8px spacing system:
  - 8 / 16 / 24 / 32 / 40
- Page padding: 24px
- Card padding: 16px–20px
- Proper spacing between sections and widgets

Grid System:
- Responsive 12-column layout
- Max content width: 1440px

Typography:
- Font family: Inter
- Text color:
  - Primary: #1F1F1F
  - Secondary: #595959

Headings:
- H1:
  - 28px–32px
  - semibold/bold
  - line-height: 1.2
- H2:
  - 20px–24px
  - semibold
- H3:
  - 16px–18px
  - medium

Body Text:
- 14px–16px
- regular
- line-height: 1.5–1.6

Small Labels:
- 12px–13px
- medium weight

Tables:
- Header background: #FAFAFA
- Rounded row containers
- Pill-style status badges
- Comfortable row height

Buttons:
- Height: 36px
- Horizontal padding: 16px
- Rounded corners
- Subtle hover transition

Inputs:
- Minimal border style
- Light focus ring
- Consistent height and spacing

Cards:
- White background
- Soft shadow
- Rounded corners
- Slight hover elevation

Icons:
- Use Lucide icons or Heroicons only
- Outline style preferred

Animation:
- Very subtle transitions only
- Fast and responsive interactions
- No flashy animations

Responsive Behavior:
- Desktop-first
- Support tablet and large screens
- Sidebar collapses automatically on smaller widths

Overall UX Direction:
- Build a UI optimized for QA engineers and automation monitoring
- Prioritize readability, debugging visibility, realtime status clarity, and fast navigation
- The application should feel scalable, professional, and production-ready
---

# HERO UI REQUIREMENTS

Use HeroUI components wherever possible:
- Table
- Card
- Button
- Input
- Modal
- Tabs
- Chip
- Spinner
- Code
- Dropdown
- Navbar
- Pagination

Create reusable wrappers if needed.

---

# RESPONSIVENESS

Must support:
- Desktop
- Tablet
- Large screens

Sidebar should collapse properly on smaller screens.

---

# REQUIRED PAGES

Generate full code for:
- Dashboard
- Test Case List
- Test Run Detail
- Test History
- Settings
- Sidebar Layout
- Topbar/Header

---

# REALTIME LOG UI

For TestRunDetail:
- Build terminal-style realtime log panel
- Black/dark background
- Monospace font
- Green/white text
- Auto-scroll to latest logs
- Error logs highlighted in red

---

# CODE QUALITY

- 100% TypeScript typed
- Reusable components
- Feature-based architecture
- Clean imports
- No duplicated UI logic
- No hardcoded API URLs
- Use environment variables

---

# OUTPUT REQUIREMENTS

- Generate COMPLETE code
- Include folder structure
- Include routing setup
- Include reusable components
- Include Tailwind classes
- Ensure code compiles without manual fixes

---

# FINAL INSTRUCTION

First analyze all Stitch screens carefully, then generate the frontend implementation screen-by-screen while preserving the original UI/UX as closely as possible.