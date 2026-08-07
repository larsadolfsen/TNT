# Task 4 — Q14 locale key pruning — Report

## Verification Summary

Re-verified all 6 keys as unreferenced (excluding locales/). All grep searches were run excluding both `locales/` and `docs/` directories to avoid false positives from the brief itself.

### Key: customers.login.email

**Grep 1: Dotted key path**
```bash
grep -r "customers\.login\.email" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

**Grep 2: Liquid filter patterns**
```bash
grep -rE "(t:customers\.login\.email|'customers\.login\.email'\s*\|\s*t)" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

### Key: customers.login.password

**Grep 1: Dotted key path**
```bash
grep -r "customers\.login\.password" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

**Grep 2: Liquid filter patterns**
```bash
grep -rE "(t:customers\.login\.password|'customers\.login\.password'\s*\|\s*t)" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

### Key: customers.login.submit

**Grep 1: Dotted key path**
```bash
grep -r "customers\.login\.submit" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

**Grep 2: Liquid filter patterns**
```bash
grep -rE "(t:customers\.login\.submit|'customers\.login\.submit'\s*\|\s*t)" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

### Key: customers.login.title

**Grep 1: Dotted key path**
```bash
grep -r "customers\.login\.title" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

**Grep 2: Liquid filter patterns**
```bash
grep -rE "(t:customers\.login\.title|'customers\.login\.title'\s*\|\s*t)" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

### Key: collections.title

**Grep 1: Dotted key path**
```bash
grep -r "collections\.title" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

**Grep 2: Liquid filter patterns**
```bash
grep -rE "(t:collections\.title|'collections\.title'\s*\|\s*t)" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

### Key: contact.heading

**Grep 1: Dotted key path**
```bash
grep -r "contact\.heading" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

**Grep 2: Liquid filter patterns**
```bash
grep -rE "(t:contact\.heading|'contact\.heading'\s*\|\s*t)" --exclude-dir=locales --exclude-dir=docs .
```
Result: (no matches)

## Deletions Performed

### en.default.json
- **Deleted object:** `customers.login` (4 keys: email, password, submit, title)
- **Deleted object:** `customers` (parent became empty after login removal)
- **Deleted object:** `collections` (only contained title which is dead)
- **Deleted key:** `contact.heading` (contact object retained with other keys)

### da.json
- **Deleted object:** `customers.login` (4 keys: email, password, submit, title)
- **Deleted object:** `customers` (parent became empty after login removal)
- **Deleted object:** `collections` (only contained title which is dead)
- **Deleted key:** `contact.heading` (contact object retained with other keys)

## JSON Validation

### en.default.json
```
Validation: Valid JSON ✓
```

### da.json
```
Validation: Valid JSON ✓
```

Both files validated successfully after editing using Python JSON parser.

## Templates/Customers Fact-Check

**Status:** `templates/customers/` does NOT exist in this theme.

```bash
cd "C:\Users\adolf\Documents\GitHub\TNT\.claude\worktrees\wave35-batch1"
if [ -d templates/customers ]; then echo "EXISTS"; else echo "DOES_NOT_EXIST"; fi
```

Result: `DOES_NOT_EXIST`

This confirms the `customers.login.*` cluster of keys were purely orphaned translations with no corresponding theme templates. Theme Store requirement for customer templates (if applicable) is tracked separately.

## Version Bump

- **Before:** `package.json` version `1.0.116`
- **After:** `package.json` version `1.0.117`

## Commit

- **Hash:** b081da9
- **Message:** Q14: Remove unreferenced locale keys (Wave 3.5 task 4)
- **Files changed:** 3 (locales/da.json, locales/en.default.json, package.json)
- **Lines added/removed:** +1/-25

## Completion Status

All deletions complete. All files valid. No commits pushed (as instructed).
