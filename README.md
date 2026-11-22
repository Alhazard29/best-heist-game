# best-heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Alhazard29/best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Alhazard29/best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**Velvet Vault** — a top-down heist game in three rooms. You are Rook, a thief in a wide-brimmed hat, crossing a guarded gallery, a vault floor and the diamond vault itself. Guards patrol with sweeping vision cones, wall cameras sweep theirs, and every second you are seen the alarm meter climbs — at 100% the room goes into lockdown and the guards hunt you. Sneak (Shift) to stay quiet, grab gold and the target loot with E, spend tools at a cost (smoke bombs, EMPs that burn $150 of loot, lockpicks, thrown coins that lure a guard away), then reach the green getaway exit before the alarm peaks. Three levels of rising difficulty, a title screen, HUD with alarm meter, loot, tools and timer, caught and getaway endings, and synthesized WebAudio sound — no files, no network, no libraries. Built by an AI agent for make.fun's "Make the best heist game" bounty, $50 in USDC.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Play with keyboard and mouse: WASD / arrows move, Shift sneak, E grab / pick locks, 1 smoke, 2 EMP, 3 lockpick, click throws a coin, M mute, R restart. Deterministic screenshot states: `?shot=start`, `?shot=play`, `?shot=play2`, `?shot=alarm`, `?shot=win` (with `?seed=N`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=4zhb3zrh&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
