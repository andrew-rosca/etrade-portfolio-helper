# E*TRADE Portfolio Helper Chrome Extension

A Chrome extension that adds visual grouping, highlighting, and sorting to E*TRADE portfolio position tables.

## 🎯 Purpose

This extension helps organize E*TRADE portfolio positions by:
- **Visual Sorting**: Groups Growth and Income positions together at the top
- **Color Coding**: Applies muted background colors to highlight different groups (optional)
- **Symbol Management**: Easy-to-use configuration interface integrated into E*TRADE's UI
- **White Background**: Ungrouped positions get clean white backgrounds when sorted

## 🔧 Features

### Visual Sorting
- **Position Grouping**: Growth positions appear first, then Income, then ungrouped
- **Row Repositioning**: Uses E*TRADE's dual positioning system (CSS top + transform)
- **Toggle Control**: Enable/disable visual sorting via configuration panel
- **Maintains Layout**: Works seamlessly with E*TRADE's virtual table system

### Color Coding (Optional)
- **Growth Group**: Muted blue background (rgba(0, 123, 255, 0.1))
- **Income Group**: Muted green background (rgba(40, 167, 69, 0.1))
- **Independent Toggle**: Color coding can be enabled/disabled separately from sorting
- **Clean Ungrouped**: White background for ungrouped positions when sorted

### Configuration Interface
- **Integrated Button**: "Position Grouping" button below E*TRADE's "Customize" button
- **Clean Dialog**: Streamlined configuration panel with no unnecessary elements
- **Auto-Save**: Changes save automatically as you type (with debounce)
- **Persistent Storage**: All settings saved to localStorage

## 📁 File Structure

```
etrade-portfolio-helper/
├── manifest.json          # Chrome extension manifest (Manifest V3)
├── content.js            # Main extension logic
├── styles.css           # Optional CSS enhancements
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## 🚀 Installation

1. **Load Extension**: Load as unpacked extension in Chrome Developer Mode
2. **Navigate**: Go to E*TRADE portfolio page
3. **Configure**: Click "Position Grouping" button below "Customize" to set symbol groups
4. **Enable Features**: Toggle visual sorting and/or color coding as desired
5. **Enjoy**: Positions will be automatically grouped and highlighted

## 💻 Technical Implementation

### Key Components

#### EtradePortfolioHelper Class
- **Constructor**: Initializes symbol groups, loads configuration, creates UI
- **scanAndHighlight()**: Main scanning function for position detection and highlighting
- **sortRowsByGroup()**: Visual sorting using dual positioning (top + transform)
- **revertSorting()**: Restores original row positions and colors
- **createToggleButton()**: Creates integrated "Position Grouping" button

#### DOM Selectors
- **Position Rows**: `.RowRenderer---root---C9M4t[role="row"]`
- **Symbol Cells**: `.SymbolCellRenderer---symbol---_S70m`

#### Storage
- **Growth Symbols**: `localStorage.getItem('etradeHelper_growthSymbols')`
- **Income Symbols**: `localStorage.getItem('etradeHelper_incomeSymbols')`
- **Sorting Enabled**: `localStorage.getItem('etradeHelper_sortingEnabled')`
- **Coloring Enabled**: `localStorage.getItem('etradeHelper_coloringEnabled')`

### Visual Implementation
- **Row Positioning**: Uses both `style.top` and `style.transform` for E*TRADE compatibility
- **Background Colors**: Applied conditionally based on color coding setting
- **Button Integration**: Positioned using `.PortfoliosFilters---customize---Tdpzj` container
- **37px Row Height**: Fixed height determined from E*TRADE's virtual table system

## 🔄 Development History

### Evolution Timeline
1. **Initial**: Simple highlighting with basic colors
2. **Visual Sorting**: Added row repositioning to group positions together
3. **Dual Positioning**: Solved E*TRADE's complex virtual table system
4. **UI Integration**: Moved from floating panel to integrated button design
5. **Feature Separation**: Split color coding and sorting into independent toggles
6. **Polish**: Clean dialog, auto-save, proper centering, and white ungrouped rows

### Key Technical Breakthroughs
- **Dual Positioning Fix**: E*TRADE uses both CSS `top` and `transform: translateY()`
- **37px Row Height**: Discovered fixed row height for accurate positioning
- **Button Placement**: Successfully integrated into E*TRADE's existing UI
- **Auto-Save UX**: Debounced input handling prevents typing interference

## 🐛 Common Issues & Solutions

### Button Not Appearing
- **Check Element**: Look for `.PortfoliosFilters---customize---Tdpzj` in DOM
- **Solution**: Extension retries button creation up to 10 times with delays
- **Fallback**: Creates floating button if customize section not found

### Sorting Not Working
- **Dual Properties**: Ensure both `style.top` and `style.transform` are set
- **Row Height**: Verify 37px spacing between rows
- **Check Console**: Look for "Visual sort complete" message

### Colors Not Applying
- **Toggle Setting**: Verify "Color Coding" is enabled in configuration
- **Re-scan Trigger**: Colors update when setting is toggled
- **Check Storage**: Verify `etradeHelper_coloringEnabled` in localStorage

### Configuration Not Saving
- **Debounce Delay**: Auto-save waits 500ms after typing stops
- **Storage Access**: Check browser's localStorage permissions
- **Console Errors**: Look for localStorage-related error messages

## 🛠️ Console Commands

Available in browser console when extension is loaded:

```javascript
// Manual re-scan and highlight
window.etradeHelper.scanAndHighlight()

// Trigger visual sorting
window.etradeHelper.sortRowsByGroup()

// Revert to original order
window.etradeHelper.revertSorting()

// Check current configuration
console.log('Growth:', Array.from(window.etradeHelper.growthSymbols))
console.log('Income:', Array.from(window.etradeHelper.incomeSymbols))
console.log('Sorting:', window.etradeHelper.sortingEnabled)
console.log('Coloring:', window.etradeHelper.coloringEnabled)
```

## 🎨 Customization

### Colors
- **Growth**: `rgba(0, 123, 255, 0.1)` in `scanAndHighlight()` method
- **Income**: `rgba(40, 167, 69, 0.1)` in `scanAndHighlight()` method
- **Button**: `rgba(0, 123, 255, 0.1)` in `createToggleButton()` method

### Button Styling
- **Size**: Adjust `width: 110px` and `font-size: 10px`
- **Position**: Modify `margin-left: -25px` for alignment
- **Text**: Change `'Position Grouping'` to custom label

### Default Symbols
Modify in `loadConfiguration()` method:
- **Growth**: `['SPYG', 'AMZN', 'BRKW']`
- **Income**: `['SPYI', 'MCD', 'CBF']`

## 🔮 Future Enhancements

### Potential Features
- **Additional Groups**: Value, Dividend, Sector-based grouping
- **Custom Colors**: User-selectable color themes
- **Export**: Export grouped position data to CSV
- **Analytics**: Performance tracking by group
- **Keyboard Shortcuts**: Quick toggle for sorting/coloring

### Technical Improvements
- **Performance**: Optimize for large portfolios (100+ positions)
- **Accessibility**: ARIA labels and keyboard navigation
- **Themes**: Multiple color schemes and dark mode
- **Sync**: Cloud storage for cross-device configuration

## 📝 Notes for Future Development

### Critical Dependencies
- **E*TRADE DOM Structure**: Extension relies on specific CSS classes
- **Chrome Extension API**: Uses Manifest V3 format
- **localStorage**: All configuration is client-side only

### Testing Approach
1. **Load Extension**: Test in fresh Chrome profile
2. **Navigate E*TRADE**: Verify positions are detected
3. **Configure Groups**: Test symbol addition/removal
4. **SPA Navigation**: Test page transitions within E*TRADE
5. **Edge Cases**: Test with no positions, empty groups, invalid symbols

### Deployment Considerations
- **Privacy**: Extension only accesses E*TRADE domains
- **Performance**: Minimal impact with efficient DOM observation
- **Compatibility**: Works with E*TRADE's current UI (as of Sept 2025)

---

*Last Updated: September 28, 2025*
*Status: Fully functional with visual sorting, color coding toggles, and integrated UI*