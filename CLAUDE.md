# Claude Code Configuration

## Project: nostimos

## Cold Start (every session)

1. README.md — project overview
2. QUICKCONTEXT.md — current state
3. **VERIFY:** `git log --since='7 days' --oneline | head -20`
4. TODO.md — active work
5. AGENTS.md — coordination guidelines

## Session End

1. Update QUICKCONTEXT.md with current state
2. Update TODO.md (mark completed, add discovered)
3. Clean up: `git worktree prune`
