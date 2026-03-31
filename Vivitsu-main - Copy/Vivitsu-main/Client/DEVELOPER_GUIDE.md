# Savings Vault Tracker - Developer Quick Reference

## 🎯 Project Overview
Transform Studia edutech app into a **gamified non-custodial ALGO savings tracker** with:
- Streak system (daily deposits)
- XP & Level progression (1-10)
- Collectible badges & milestones
- Social leaderboard
- Psychological UI elements

**Status**: ✅ MVP Complete & Running
**Dev Server**: http://localhost:5173/
**Framework**: Vite + React + Framer Motion

---

## 🗺️ App Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/vault` | Dashboard | Home - shows savings progress |
| `/vault/goals` | Goals | Goal tracking + milestones |
| `/vault/social` | Leaderboard | Top savers + rankings |
| `/vault/rewards` | Rewards | Badges + level progression |
| `/vault/profile` | Profile | Account settings |

---

## 🧩 Component Architecture

### Layout
```
App.jsx
├── VaultLayout (sidebar/mobile nav)
│   └── <Page Component>
│       ├── VaultNavBar
│       └── Page Content
```

### Navigation Files
- **VaultNavBar.jsx**: Desktop sidebar + mobile bottom nav
- **VaultLayout.jsx**: Page wrapper with animations

### Vault Components (`components/vault/`)
- **CircularProgress.jsx**: SVG circle (0-100%) with animation
- **StreakCard.jsx**: 🔥 flame counter with warning states
- **XPProgressBar.jsx**: Level progress bar with shimmer
- **MilestoneTracker.jsx**: Vertical timeline of checkpoints
- **FutureSelfCard.jsx**: Daily motivational message
- **DepositModal.jsx**: Modal for ALGO deposits
- **LeaderboardCard.jsx**: User rank card (top 3 special)
- **BadgeGrid.jsx**: Grid of locked/unlocked badges

### Pages (`pages/vault/`)
- **Dashboard.jsx**: Home (progress + daily action)
- **Goals.jsx**: Goal detail (progress + history)
- **Social.jsx**: Leaderboard (top 3 + rankings)
- **Rewards.jsx**: Badges & levels
- **Profile.jsx**: User settings

### Context & Data
- **VaultContext.jsx**: Global state management
  - `user` object (level, xp, streak, totalSaved)
  - `depositHistory` array
  - `leaderboard` array
  - `makeDeposit()` action
- **mock/data.ts**: Mock data for initial load

---

## 📱 UI Customization

### Colors (via CSS variables)
```css
/* Theme variables - edit in src/index.css */
--btn: #ef4444 (Primary Red)
--txt: #262626 (Text)
--bg-primary: #ffffff (Background)
--bg-sec: #f7f7f7 (Secondary)
```

### Tailwind Classes Used
- `bg-primary`, `bg-sec`, `bg-ter` - Backgrounds
- `txt`, `txt-dim`, `txt-red` - Text colors
- `hover:bg-hover-red` - Hover state
- All animations: Framer Motion (NOT CSS)

### Font System
```
Sans: Inter (variable font)
Display: Poppins (landing only)
```

---

## 🎮 Gamification System (Key Code Snippets)

### Streak Management
```javascript
// In VaultContext.jsx
makeDeposit: (amount) => {
  user.streak += 1;  // Increment streak
  user.totalSaved += amount;
  user.xp += amount * 10;  // 10 XP per ALGO
}

// Show warning if streak < 6 hours
isWarning={streak > 0 && streak <= 1}
```

### XP & Levels
```javascript
// Level thresholds (in mock/data.ts)
const levelThresholds = [0, 500, 1500, 3000, 5000, ...]

// Find current level
const currentLevel = levelThresholds.findIndex(
  xp => user.xp < xp
) || levelThresholds.length - 1

// Calculate percentage to next level
const percentage = (user.xp - thresholds[level-1]) / 
                  (thresholds[level] - thresholds[level-1])
```

### Badge Unlocking
```javascript
// In Goals.jsx after deposit
const checkBadges = (totalSaved) => {
  if (totalSaved >= 10) unlockBadge('Seedling')
  if (totalSaved >= 50) unlockBadge('Saver')
  if (totalSaved >= 100) unlockBadge('Vault Guard')
  if (totalSaved >= 500) unlockBadge('Diamond Hands')
  if (totalSaved >= 1000) unlockBadge('Whale')
}
```

### Leaderboard Ranking
```javascript
// Sort by totalSaved (descending)
const sorted = leaderboard.sort(
  (a, b) => b.totalSaved - a.totalSaved
).map((user, idx) => ({
  ...user,
  rank: idx + 1
}))
```

---

## 🎨 Animation Patterns

### Stagger Container
```javascript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}
```

### Fade-in Item
```javascript
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}
```

### Pulse (for achievements)
```javascript
animate={{ scale: [1, 1.1, 1] }}
transition={{ duration: 2, repeat: Infinity }}
```

### Shimmer Effect (XP bar)
```javascript
animation: shimmer 3s infinite;
background: linear-gradient(90deg, transparent, white, transparent);
background-size: 1000px 100%;
```

---

## 🔧 Common Tasks

### Add a New Badge
1. Edit `mock/data.ts` → Add to `mockBadges` array
2. Edit `Goals.jsx` → Add check in deposit logic
3. `BadgeGrid.jsx` will auto-render

### Change Deposit Amount Values
1. Edit `DepositModal.jsx` line ~26:
```javascript
const quickAmounts = [1, 5, 10, 50]  // Change values
```

### Modify XP Formula
1. Edit `VaultContext.jsx` `makeDeposit()`:
```javascript
const xpGained = Math.floor(amount * 10)  // Change multiplier
```

### Update Level Thresholds
1. Edit `mock/data.ts`:
```javascript
export const levelThresholds = [0, 500, 1500, ...]  // Change values
```

### Add New Page
1. Create `pages/vault/NewPage.jsx`
2. Import in `App.jsx`
3. Add route: `<Route path="newpage" element={<NewPage />} />`
4. Add nav link in `VaultNavBar.jsx`

---

## 🧪 Testing Checklist

- [ ] Dashboard loads with progress circle animated
- [ ] Clicking "Deposit Now" opens modal
- [ ] Entering amount and clicking confirm increments streak
- [ ] Level updates when XP threshold crossed
- [ ] Badge card appears in Rewards when amount reached
- [ ] Leaderboard shows user rank
- [ ] Goals page shows milestone timeline
- [ ] Profile page shows stats
- [ ] Mobile nav works (bottom tabs)
- [ ] Desktop nav works (sidebar)
- [ ] Dark mode toggles properly

---

## 📊 Mock Data Structure

### User Object
```javascript
{
  address: string,
  level: number (1-10),
  xp: number,
  xpForNextLevel: number,
  streak: number,
  totalSaved: number,
  goal: number,
  dailySavedToday: boolean,
  isInactive: boolean
}
```

### Deposit Entry
```javascript
{
  id: number,
  date: string (YYYY-MM-DD),
  amount: number,
  streakDay: number,
  xpGained: number,
  milestoneUnlocked?: string,
  type: 'deposit'
}
```

### Badge Object
```javascript
{
  id: number,
  name: string,
  requirement: string,
  icon: string (emoji),
  color: string (Tailwind class),
  unlocked: boolean,
  unlockedAt?: string,
  xpReward: number
}
```

---

## 🚀 Deployment Notes

### Pre-deployment Checklist
- [ ] Replace mock data with real API calls
- [ ] Integrate Pera Wallet SDK
- [ ] Connect to Algorand mainnet
- [ ] Add error boundaries
- [ ] Set up analytics
- [ ] Add PWA manifest
- [ ] Build for production: `npm run build`

### Environment Variables to Add
```env
VITE_ALGO_NETWORK=mainnet  # or testnet
VITE_API_URL=https://api.example.com
VITE_CONTRACT_ADDRESS=...
```

---

## 📚 Key Files Reference

```
src/
├── App.jsx                          (Main router)
├── components/
│   ├── VaultLayout.jsx              (Page wrapper)
│   ├── VaultNavBar.jsx              (Navigation)
│   └── vault/
│       ├── CircularProgress.jsx     (Progress circle)
│       ├── StreakCard.jsx           (Flame counter)
│       ├── XPProgressBar.jsx        (Level bar)
│       ├── MilestoneTracker.jsx     (Timeline)
│       ├── FutureSelfCard.jsx       (Messages)
│       ├── DepositModal.jsx         (Deposit UI)
│       ├── LeaderboardCard.jsx      (Rank cards)
│       └── BadgeGrid.jsx            (Badge grid)
├── pages/vault/
│       ├── Dashboard.jsx            (Home)
│       ├── Goals.jsx                (Goal tracking)
│       ├── Social.jsx               (Leaderboard)
│       ├── Rewards.jsx              (Badges/levels)
│       └── Profile.jsx              (Settings)
├── contexts/
│       └── VaultContext.jsx         (State mgmt)
└── mock/
        └── data.ts                  (Mock data)
```

---

## 💡 Pro Tips

1. **Animations**: All use Framer Motion `motion.div` - check `animate={}` props
2. **Responsive**: Use `hidden md:block` patterns for breakpoints
3. **Dark Mode**: Already integrated via CSS variables
4. **Performance**: Use React.memo() if profile list gets large
5. **State**: All state in VaultContext - no prop drilling
6. **Styling**: Tailwind + CSS variables (local theme colors)
7. **Debugging**: Check browser console for React errors
8. **Mobile**: Test bottom nav on phone (5 icons)

---

## 🎯 Next Features (Roadmap)

```
Phase 1: MVP ✅ (Current)
├─ Dashboard
├─ Goals
├─ Leaderboard
├─ Rewards
└─ Profile

Phase 2: Wallet Integration
├─ Pera Wallet SDK
├─ Real deposits
└─ Balance verification

Phase 3: Advanced
├─ Backend API
├─ User persistence
├─ Real leaderboard
└─ WebSocket updates

Phase 4: Social
├─ Sharing features
├─ Comments/reactions
├─ Team vaults
└─ NFT badges
```

---

**Ready to build? Start here: `/vault`** 🚀
