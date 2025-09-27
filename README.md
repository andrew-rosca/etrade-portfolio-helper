# E*TRADE Portfolio Helper Chrome Extension

A Chrome extension that adds visual grouping and highlighting to E*TRADE portfolio position tables.

## 🎯 Purpose

This extension helps organize E*TRADE portfolio positions by:
- **Visual Grouping**: Categorizes positions into Growth and Income groups
- **Color Coding**: Applies muted background colors to highlight different groups
- **Symbol Management**: Provides a configuration panel to manage symbol groups
- **Visual Indicators**: Shows emoji indicators inline with position symbols

## 🔧 Features

### Core Functionality
- **Growth Group**: Blue background (#e8f2ff) + 📈 emoji indicator
- **Income Group**: Green background (#e8f5e8) + 💰 emoji indicator
- **Real-time Highlighting**: Automatically scans and highlights positions
- **SPA Navigation**: Works with E*TRADE's single-page application updates

### Configuration Panel
- **Floating Panel**: Draggable configuration interface
- **Symbol Management**: Add/edit Growth and Income symbols via text inputs
- **Persistent Storage**: Saves configuration to localStorage
- **Real-time Updates**: "Save & Apply" button immediately applies changes

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
3. **Configure**: Use the floating configuration panel to set symbol groups
4. **Enjoy**: Positions will be automatically highlighted and grouped

## 💻 Technical Implementation

### Key Components

#### EtradePortfolioHelper Class
- **Constructor**: Initializes symbol groups and loads configuration
- **scanAndHighlight()**: Main scanning function for position detection
- **highlightRow()**: Applies visual styling and indicators
- **createConfigPanel()**: Creates draggable configuration interface

#### DOM Selectors
- **Position Rows**: `.RowRenderer---root---C9M4t[role="row"]`
- **Symbol Cells**: `.SymbolCellRenderer---symbol---_S70m`

#### Storage
- **Growth Symbols**: `localStorage.getItem('etradeHelper_growthSymbols')`
- **Income Symbols**: `localStorage.getItem('etradeHelper_incomeSymbols')`

### Visual Implementation
- **Background Colors**: Applied directly to row elements via `style.backgroundColor`
- **Emoji Indicators**: Inline `<span>` elements inserted at start of first cell
- **Non-intrusive**: No absolute positioning that breaks table layout

## 🔄 Development History

### Evolution Timeline
1. **Initial**: Complex note extraction via modal interaction (abandoned - too fragile)
2. **Pivot**: Simple symbol highlighting with single color (yellow background)
3. **Enhancement**: Split into Growth/Income groups with muted colors
4. **Grouping**: Added visual indicators for better organization
5. **Polish**: Fixed table layout issues and restored configuration panel

### Key Lessons Learned
- **E*TRADE Fragility**: Modal interactions are unreliable, stick to DOM observation
- **Table Layout**: Avoid absolute positioning on table elements
- **SPA Compatibility**: Use MutationObserver for dynamic content updates
- **User Experience**: Provide configuration UI for symbol management

## 🐛 Common Issues & Solutions

### Extension Not Loading
- **Check Console**: Look for `TypeError: this.createConfigPanel is not a function`
- **Solution**: Ensure all class methods are properly defined

### Table Layout Broken
- **Cause**: Absolute positioning on table rows/cells
- **Solution**: Use inline elements within existing cells

### Highlights Not Appearing
- **Check Selectors**: E*TRADE may update CSS class names
- **Debug**: Use `etradeHelper.scan()` in console to manually trigger
- **Verify Config**: Check if symbols are properly saved in localStorage

### SPA Navigation Issues
- **Problem**: Highlights disappear on page changes
- **Solution**: MutationObserver automatically re-scans on DOM changes

## 🛠️ Console Commands

Available in browser console when extension is loaded:

```javascript
// Manual re-scan
etradeHelper.scan()

// Clear all highlights
etradeHelper.clearAllHighlights()

// Check current configuration
console.log('Growth:', Array.from(etradeHelper.growthSymbols))
console.log('Income:', Array.from(etradeHelper.incomeSymbols))

// Access global instance
window.etradeHelper
```

## 🎨 Customization

### Colors
- **Growth**: Change `#e8f2ff` in `highlightRow()` method
- **Income**: Change `#e8f5e8` in `highlightRow()` method

### Indicators
- **Growth**: Change `📈` in `addGroupIndicator()` method
- **Income**: Change `💰` in `addGroupIndicator()` method

### Default Symbols
Modify in `loadConfiguration()` method:
- **Growth**: `['AAPL', 'TSLA', 'NVDA']`
- **Income**: `['T', 'VZ', 'KO']`

## 🔮 Future Enhancements

### Potential Features
- **Additional Groups**: Beyond just Growth/Income
- **Sorting**: Automatically sort positions by group
- **Export**: Export grouped position data
- **Analytics**: Track group performance
- **Themes**: Multiple color schemes

### Technical Improvements
- **React Integration**: Better SPA compatibility
- **WebComponents**: More robust UI elements
- **Background Script**: Enhanced persistence and sync

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

*Last Updated: September 27, 2025*
*Status: Fully functional with configuration panel and visual grouping*