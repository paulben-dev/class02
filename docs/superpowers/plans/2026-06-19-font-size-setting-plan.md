# Font Size Setting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-tier font size setting (小/标准/大) to the Profile page, persisting via localStorage and applying globally via CSS custom properties.

**Architecture:** Single-file change to `index.html` — CSS variable overrides via `data-font-size` on `<html>`, menu item in existing `.menu-list`, picker modal following the existing `_popupEdit` dynamic-content pattern, state persisted through existing `saveState()`/`loadState()`.

**Tech Stack:** HTML5 + CSS3 + vanilla JS (ES6+), localStorage

## Global Constraints

- Font sizes: small (13/12/10), medium (16/14/12), large (19/16/14) for `--font-lg/md/sm`
- Default: `medium`
- Store field name: `fontSize` with values `'small' | 'medium' | 'large'`
- Does NOT affect `@media print` output
- Does NOT affect phone-shell chrome

---

### Task 1: Add CSS rules for three font-size tiers

**Files:**
- Modify: `index.html` — insert after the `:root` block (after line 28)

**Interfaces:**
- Produces: CSS attribute selectors `html[data-font-size="small|medium|large"]` that override `--font-lg`, `--font-md`, `--font-sm`

- [ ] **Step 1: Insert CSS rules after `:root` block**

Insert after line 28 (`}` closing `:root`):

```css

    /* Font size tiers */
    html[data-font-size="small"]  { --font-lg: 13px; --font-md: 12px; --font-sm: 10px; }
    html[data-font-size="large"]  { --font-lg: 19px; --font-md: 16px; --font-sm: 14px; }
    /* medium = default (16/14/12), no override needed */
```

NOTE: `medium` uses the default `:root` values, so no override needed — saves 1 rule.

- [ ] **Step 2: Verify CSS in browser DevTools**

Open `index.html`, run `document.documentElement.setAttribute('data-font-size', 'large')` in console. Confirm `--font-lg` resolves to `19px` via `getComputedStyle(document.documentElement).getPropertyValue('--font-lg')`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "style: add font-size tier CSS rules (small/large overrides)"
```

---

### Task 2: Add font-size menu item in Profile page

**Files:**
- Modify: `index.html` — insert in `.menu-list` inside `#page-profile` (after line 1761, the "批改记录" item)

**Interfaces:**
- Produces: A `.menu-item` in the DOM with `onclick="showFontSizePicker()"` and an `<span id="font-size-label">` for displaying current value

- [ ] **Step 1: Insert menu item HTML**

Insert after line 1761 (`</div>` closing "批改记录" menu item):

```html
          <div class="menu-item" onclick="showFontSizePicker()">
            <span><svg class="icon"><use href="#icon-settings"/></svg> 字体大小</span>
            <span class="menu-arrow"><span id="font-size-label" style="color:var(--text-hint);font-size:13px;margin-right:4px;">标准</span><svg class="icon"><use href="#icon-chevron-right"/></svg></span>
          </div>
```

- [ ] **Step 2: Verify menu item appears**

Open `index.html`, navigate to "我的" tab. Confirm "字体大小" menu item is visible between "批改记录" and "恢复出厂设置".

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add font-size menu item to profile page"
```

---

### Task 3: Add fontSize to state persistence

**Files:**
- Modify: `index.html` — `loadState()` function (line 2627) and `saveState()` function (line 2647)

**Interfaces:**
- Consumes: `state.fontSize` from localStorage JSON
- Produces: `fontSize` field read on load, written on save

- [ ] **Step 1: Add read in `loadState()`**

Insert after line 2642 (`if (state.childClass)`):

```javascript
          if (state.fontSize) mockData.fontSize = state.fontSize;
```

- [ ] **Step 2: Add write in `saveState()`**

Insert after line 2659 (`childClass: mockData.user.child.className,`):

```javascript
        fontSize: mockData.fontSize || 'medium',
```

- [ ] **Step 3: Verify persistence**

In browser console:
```javascript
mockData.fontSize = 'large';
saveState();
// Reload page
loadState();
console.log(mockData.fontSize); // Expected: 'large'
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: persist fontSize to localStorage"
```

---

### Task 4: Add applyFontSize function and init integration

**Files:**
- Modify: `index.html` — add function before `initProfile()` (around line 4729), call from `init()` (line 5099)

**Interfaces:**
- Produces: `applyFontSize()` — reads `mockData.fontSize`, sets `data-font-size` attribute on `<html>`, updates `#font-size-label` text
- Consumes: Called by `init()`, `showFontSizePicker()`

- [ ] **Step 1: Add `applyFontSize()` function**

Insert before `initProfile()` (before line 4730):

```javascript
    function applyFontSize() {
      var size = mockData.fontSize || 'medium';
      document.documentElement.setAttribute('data-font-size', size);
      var label = document.getElementById('font-size-label');
      if (label) {
        label.textContent = { small: '小', medium: '标准', large: '大' }[size] || '标准';
      }
    }
```

- [ ] **Step 2: Call `applyFontSize()` from `init()`**

In `init()` (line 5099), add before the existing calls:

```javascript
      applyFontSize();
```

So `init()` becomes:
```javascript
    function init() {
      applyFontSize();
      renderPhotoGrid();
      refreshHomeworkSelector();
      renderHomeworkList();
      populateReportSelector();
      initErrorBook();
      initProfile();
    }
```

- [ ] **Step 3: Verify init order**

Open app fresh. Check: `document.documentElement.getAttribute('data-font-size')` is `'medium'`. The font-size label should show "标准".

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add applyFontSize function and integrate with init"
```

---

### Task 5: Add font-size picker modal with showFontSizePicker function

**Files:**
- Modify: `index.html` — add `showFontSizePicker()` function near other modal functions (after line 4775, end of `_popupEdit`)

**Interfaces:**
- Consumes: `mockData.fontSize`, `applyFontSize()`, `saveState()`, `#modal-overlay`
- Produces: `showFontSizePicker()` — builds picker HTML into overlay, handles selection

- [ ] **Step 1: Add `showFontSizePicker()` function**

Insert after line 4775 (closing `}` of `_popupEdit`):

```javascript
    function showFontSizePicker() {
      var current = mockData.fontSize || 'medium';
      var options = [
        { value: 'small',  label: '小',  desc: '13px / 12px / 10px' },
        { value: 'medium', label: '标准', desc: '16px / 14px / 12px' },
        { value: 'large',  label: '大',  desc: '19px / 16px / 14px' },
      ];

      var cardsHtml = options.map(function(o) {
        var isActive = o.value === current;
        return '<div class="font-size-option' + (isActive ? ' active' : '') + '"'
          + ' onclick="selectFontSize(\'' + o.value + '\')"'
          + ' style="'
          + 'flex:1;text-align:center;padding:16px 8px;border-radius:12px;'
          + 'border:2px solid ' + (isActive ? 'var(--primary)' : 'var(--border)') + ';'
          + 'cursor:pointer;transition:all 0.2s;'
          + '">'
          + '<div style="font-size:22px;font-weight:700;margin-bottom:6px;">' + o.label + '</div>'
          + '<div style="font-size:11px;color:var(--text-hint);">' + o.desc + '</div>'
          + (isActive ? '<div style="color:var(--primary);margin-top:6px;font-size:12px;">✓ 当前</div>' : '')
          + '</div>';
      }).join('');

      var overlay = document.getElementById('modal-overlay');
      var html = '<div class="modal-content" onclick="event.stopPropagation()" style="max-width:370px;">'
        + '<span class="modal-close" onclick="closeSubscribeModal()"><svg class="icon"><use href="#icon-x"/></svg></span>'
        + '<h3 style="margin-bottom:16px;text-align:center;">字体大小</h3>'
        + '<div style="display:flex;gap:10px;">' + cardsHtml + '</div>'
        + '</div>';
      overlay.innerHTML = html;
      overlay.style.display = 'flex';
    }

    function selectFontSize(size) {
      mockData.fontSize = size;
      saveState();
      applyFontSize();
      closeSubscribeModal();
    }
```

- [ ] **Step 2: Verify picker interaction**

Open app → "我的" tab → click "字体大小" → modal opens with 3 options, current one highlighted with green border and ✓. Click a different size → modal closes, text in menu updates, all page fonts change.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add font-size picker modal with three-tier selection"
```

---

### Task 6: Final integration test and verification

**Files:**
- No changes — verification only

- [ ] **Step 1: Full flow test**

Manual test sequence:
1. Open `index.html` in browser
2. Navigate to "我的" tab
3. Click "字体大小" → picker opens, "标准" highlighted
4. Select "大" → fonts enlarge, label shows "大"
5. Navigate through all 5 tabs → all pages use large fonts
6. Reload page → "大" persists
7. Open picker → "大" still highlighted with ✓
8. Select "小" → fonts shrink
9. Reload → "小" persists
10. Select "标准" → back to default

- [ ] **Step 2: Verify print output unaffected**

Open `@media print` preview (Ctrl+P). Confirm font sizes are unchanged (print uses its own `font-size` overrides that don't reference `--font-lg/md/sm`).

- [ ] **Step 3: Run Playwright test to confirm**

```bash
node test_homepage.mjs 2>&1
```

Expected: All 20 tests pass, with font-size picker working as an additional interaction.

- [ ] **Step 4: Commit any fixes, tag final**

```bash
git add index.html
git commit -m "test: verify font-size feature — all tests pass"
```
