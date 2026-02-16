# Problems & Solutions Log

## Overview
This document tracks any issues encountered during development of the Smart Bookmark App and how they were resolved.

---

## Issues Encountered

### Issue #1: PowerShell Execution Policy Blocking npx Commands
**Date:** February 16, 2026  
**Phase:** Phase 1 (Project Setup)  
**Severity:** Medium

**Problem:**
When attempting to run `npx create-next-app@latest`, PowerShell threw an error:
```
npx : File F:\Node Js\npx.ps1 cannot be loaded. 
The file is not digitally signed. You cannot run this script on the current system.
```

**Root Cause:**
Windows PowerShell execution policy was set to a restrictive level (likely `RemoteSigned` or `Restricted`), preventing unsigned scripts from running.

**Solution:**
Set execution policy to bypass for the current process before running the command:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
```

**Outcome:** ✅ Command executed successfully  
**Resolution Time:** ~2 minutes

---

### Issue #2: File Conflicts During Next.js Initialization
**Date:** February 16, 2026  
**Phase:** Phase 1 (Project Setup)  
**Severity:** Medium

**Problem:**
Initial attempt to create Next.js project in `f:\Upskill\simple-bookmark-app` conflicted with existing markdown files (`DEVELOPMENT_PLAN.md`, `SYSTEM_DESIGN.md`), causing dependency installation issues.

**Root Cause:**
Running `create-next-app` in a directory with existing files can cause conflicts and installation problems.

**Solution:**
- Created a new dedicated folder `f:\Upskill\bookmark-manager` for the project
- Initialized Next.js in the clean directory
- Moved documentation files to the new folder after successful initialization

**Outcome:** ✅ Clean project setup  
**Resolution Time:** ~5 minutes

---

## Lessons Learned

1. **Always use clean directories for modern framework initialization** - Avoids conflicts and simplifies dependency management
2. **PowerShell execution policies can silently block npm/npx commands** - Use scope-limited bypass to resolve without affecting system security
3. **Organize documentation at the project root** - Keeps planning documents centralized and easily accessible

---

## Next Steps & Prevention

- [ ] Document PowerShell execution policy requirement in README
- [ ] Create setup script for future developers to avoid these issues
- [ ] Add issue troubleshooting section to README

---

**Last Updated:** February 16, 2026  
**Total Issues Tracked:** 2  
**Open Issues:** 0  
**Resolved Issues:** 2
