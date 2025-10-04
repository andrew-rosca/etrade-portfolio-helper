# E*TRADE Portfolio Helper

A Chrome browser extension that organizes your E*TRADE portfolio by grouping stocks into categories with automatic sorting and color-coded highlighting.

<img width="1252" height="1524" alt="image" src="https://github.com/user-attachments/assets/0044872e-0a2e-4d3e-922a-a22e7ac277a2" />

## Features

- **Group Stocks**: Categorize positions into "Growth" and "Income" groups
- **Visual Sorting**: Reorder portfolio so Growth positions appear first, then Income, then others
- **Color Coding**: Optional blue/green backgrounds for different groups
- **Auto-Save**: Changes save automatically as you type
- **Persistent Settings**: Configuration remembered between sessions

## Installation

### Download and Install

1. Download the latest release ZIP from [Releases](https://github.com/andrew-rosca/etrade-portfolio-helper/releases)
2. Extract the ZIP file to a folder
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top-right)
5. Click "Load unpacked" and select the extracted folder
6. Navigate to your E*TRADE portfolio page

### First-Time Setup

1. Look for "Position Grouping" button below "Customize" on your portfolio page
2. Click it to open configuration
3. Enter stock symbols separated by commas:
   - **Growth Symbols**: e.g., `AAPL, GOOGL, MSFT, NVDA`
   - **Income Symbols**: e.g., `T, VZ, KO, JNJ, PFE`
4. Enable features:
   - **Color Coding**: Adds colored backgrounds
   - **Visual Sorting**: Groups positions together
5. Close dialog - settings save automatically

## Usage

Once configured, the extension works automatically. Click "Position Grouping" anytime to adjust settings or toggle features on/off.

## Troubleshooting

**Button not visible**: Refresh page, check extension is enabled in `chrome://extensions/`

**Stocks not grouping**: Verify symbols are entered correctly with commas, check "Visual Sorting" is enabled

**Colors not showing**: Check "Color Coding" is enabled, refresh page

**Settings not saving**: Wait 1 second after typing for auto-save, check browser console for errors

## Privacy & Security

- Only accesses E*TRADE websites (us.etrade.com)
- Read-only access to portfolio page
- All data stored locally in browser
- No external servers or network requests
- Open source - inspect the code

## For Developers

### Development Setup

```bash
git clone https://github.com/andrew-rosca/etrade-portfolio-helper.git
cd etrade-portfolio-helper
```

Load extension in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the project folder

### Creating a Release

Update version in `version.txt`, then:

```bash
chmod +x create-distribution.sh
./create-distribution.sh
```

Creates `dist/etrade-portfolio-helper-vX.Y.Z.zip` ready for distribution.

### Technical Details

- Vanilla JavaScript (no dependencies)
- Chrome Manifest V3
- MutationObserver for SPA compatibility
- localStorage for persistence
- Dual CSS positioning (top + transform) for E*TRADE's virtual table

### Console Commands

```javascript
// Access extension instance
window.etradeHelper

// Trigger manual scan
window.etradeHelper.scanAndHighlight()

// Check configuration
console.log('Growth:', Array.from(window.etradeHelper.growthSymbols))
console.log('Sorting:', window.etradeHelper.sortingEnabled)
```

## Contributing

Issues and pull requests welcome. Please test thoroughly on E*TRADE portfolio page before submitting.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Version

Current version: 1.0.0  
Last updated: October 4, 2025  
Compatible with: Chrome browsers, E*TRADE web interface
