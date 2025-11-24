# Yacht Recommendation Feature

## Overview
Captains can now "recommend" specific yachts from the list, which will be visually highlighted to guests with special styling and a star badge.

## What's New

### Visual Indicators
- **Star Badge**: Recommended yachts display a pulsing yellow star icon in the top-left corner of the yacht image
- **Highlighted Row**: Recommended yachts have a subtle yellow background glow
- **Golden Border**: The yacht image has a yellow/golden border with a ring effect
- **Left Border**: A yellow border accent on the left side of the table row

### Captain Controls
- **Star Toggle Button**: In the Actions column, captains see a star button
  - Empty star = not recommended
  - Filled yellow star = recommended
  - Clicking toggles the recommendation status
  - Tooltip shows "Recommend to guests" or "Remove recommendation"

### Guest View
- Guests can see which yachts are recommended by the captain
- Recommended yachts stand out visually with all the highlighting effects
- This helps guide guests toward the captain's preferred choices

## Technical Implementation

### Database Schema
Added a new `recommended` boolean field to each yacht document in Firestore:
```javascript
{
  name: "Bavaria 46",
  recommended: true,  // New field
  // ... other yacht fields
}
```

### Components Modified
1. **YachtTable.jsx**: Added visual styling and star badge for recommended yachts
2. **useYachtActions.js**: Added `toggleRecommend()` function to update Firestore
3. **YachtManager.jsx**: Connected the toggle handler to the table component

### Priority System
When multiple states apply (selected, recommended, over capacity):
1. Selected yacht styling takes highest priority
2. Recommended styling is second priority
3. Over capacity warnings show if not recommended

## Usage

### For Captains
1. Hover over any yacht row in the table
2. Click the star icon in the Actions column
3. The star fills in yellow and the yacht gains special highlighting
4. Click again to remove the recommendation

### For Guests
- Simply view the list
- Recommended yachts will automatically stand out with yellow/golden styling
- No action needed—it's purely informational

## Color Scheme
- Recommended color: `yellow-400` (golden yellow)
- Background tint: `yellow-500/5` (very subtle)
- Border: `yellow-400/50` (semi-transparent)
- Star badge: `yellow-400` with pulse animation
