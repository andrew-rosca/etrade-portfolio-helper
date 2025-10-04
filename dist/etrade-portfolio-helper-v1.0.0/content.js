// E*TRADE Portfolio Helper - Content Script
// Growth & Income Groups with Visual Sorting

class EtradePortfolioHelper {
  constructor() {
    this.positions = new Map();
    this.growthSymbols = new Set();
    this.incomeSymbols = new Set();
    this.sortingEnabled = false; // Track if visual sorting is enabled
    this.coloringEnabled = true; // Track if color coding is enabled (default on)
    this.originalRowPositions = new Map(); // Store original positions for reverting
    this.loadConfiguration();
    this.init();
  }

  init() {
    console.log('E*TRADE Portfolio Helper loaded - Growth & Income Groups with Visual Sorting');
    
    // Wait for the page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.scanAndHighlight());
    } else {
      this.scanAndHighlight();
    }

    // Also scan when the page changes (SPA navigation)
    this.observePageChanges();
    
    // Create configuration panel
    this.createConfigPanel();
  }

  loadConfiguration() {
    // Load symbol groups from localStorage
    try {
      const savedGrowth = localStorage.getItem('etradeHelper_growthSymbols');
      const savedIncome = localStorage.getItem('etradeHelper_incomeSymbols');
      const savedSorting = localStorage.getItem('etradeHelper_sortingEnabled');
      const savedColoring = localStorage.getItem('etradeHelper_coloringEnabled');
      
      if (savedGrowth) {
        const growthArray = JSON.parse(savedGrowth);
        this.growthSymbols = new Set(growthArray.map(s => s.toUpperCase()));
      } else {
        // Default growth symbols for demonstration - using symbols from your portfolio
        this.growthSymbols = new Set(['SPYG', 'AMZN', 'BRKW']);
      }
      
      if (savedIncome) {
        const incomeArray = JSON.parse(savedIncome);
        this.incomeSymbols = new Set(incomeArray.map(s => s.toUpperCase()));
      } else {
        // Default income symbols for demonstration - using symbols from your portfolio
        this.incomeSymbols = new Set(['SPYI', 'MCD', 'CBF']);
      }
      
      // Load sorting preference
      if (savedSorting !== null) {
        this.sortingEnabled = JSON.parse(savedSorting);
      }
      
      // Load coloring preference
      if (savedColoring !== null) {
        this.coloringEnabled = JSON.parse(savedColoring);
      }
      
      console.log('Configuration loaded');
      
      // Save defaults if first time
      if (!savedGrowth || !savedIncome) {
        this.saveConfiguration();
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.growthSymbols = new Set(['AAPL', 'TSLA', 'NVDA']);
      this.incomeSymbols = new Set(['T', 'VZ', 'KO']);
    }
    
    // Update config panel if it exists (in case it was created before loading)
    this.updateConfigPanelIfExists();
  }

  saveConfiguration() {
    try {
      const growthArray = Array.from(this.growthSymbols);
      const incomeArray = Array.from(this.incomeSymbols);
      
      localStorage.setItem('etradeHelper_growthSymbols', JSON.stringify(growthArray));
      localStorage.setItem('etradeHelper_incomeSymbols', JSON.stringify(incomeArray));
      localStorage.setItem('etradeHelper_sortingEnabled', JSON.stringify(this.sortingEnabled));
      localStorage.setItem('etradeHelper_coloringEnabled', JSON.stringify(this.coloringEnabled));
      
      console.log('Configuration saved');
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  }

  observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      let shouldCreateButton = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if portfolio table content has been added/modified
          for (let node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.classList?.contains('RowRenderer---root---C9M4t') || 
                  node.querySelector?.('.RowRenderer---root---C9M4t')) {
                shouldScan = true;
              }
              
              // Check if customize section was added (page navigation)
              if (node.classList?.contains('PortfoliosFilters---customize---Tdpzj') || 
                  node.querySelector?.('.PortfoliosFilters---customize---Tdpzj')) {
                shouldCreateButton = true;
              }
            }
          }
        }
      });
      
      if (shouldScan) {
        setTimeout(() => this.scanAndHighlight(), 1000);
      }
      
      if (shouldCreateButton) {
        // Double-check no button exists before creating
        setTimeout(() => {
          if (!document.getElementById('etrade-helper-toggle')) {
            this.createToggleButtonWithRetry();
          }
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  scanAndHighlight() {
    // Find all position rows
    const positionRows = document.querySelectorAll('.RowRenderer---root---C9M4t[role="row"]');

    let growthCount = 0;
    let incomeCount = 0;
    
    positionRows.forEach((row, index) => {
      try {
        // Extract symbol from the first column
        const symbolCell = row.querySelector('.SymbolCellRenderer---symbol---_S70m');
        const symbol = symbolCell ? symbolCell.textContent.trim().toUpperCase() : null;
        
        if (symbol) {
          // Clear any existing highlighting
          this.clearRowHighlight(row);
          
          let group = null;
          
          // Check if this symbol is in Growth group
          if (this.growthSymbols.has(symbol)) {
            if (this.coloringEnabled) {
              this.highlightRow(row, symbol, 'growth');
            }
            group = 'growth';
            growthCount++;
          }
          // Check if this symbol is in Income group
          else if (this.incomeSymbols.has(symbol)) {
            if (this.coloringEnabled) {
              this.highlightRow(row, symbol, 'income');
            }
            group = 'income';
            incomeCount++;
          }
          
          // Store position info
          this.positions.set(symbol, {
            symbol: symbol,
            row: row,
            group: group
          });
        }
      } catch (error) {
        console.error(`Error processing row ${index}:`, error);
      }
    });
    
    console.log(`Highlighted ${growthCount} Growth + ${incomeCount} Income positions`);
    
    // Apply visual sorting if enabled
    if (this.sortingEnabled) {
      this.sortRowsByGroup();
    }
  }

  sortRowsByGroup() {
    // Find all position rows
    const positionRows = document.querySelectorAll('.RowRenderer---root---C9M4t[role="row"]');
    
    if (positionRows.length === 0) {
      return;
    }
    
    // Store original positions if not already stored
    if (this.originalRowPositions.size === 0) {
      positionRows.forEach((row, index) => {
        const currentTop = row.style.top || '0px';
        const currentTransform = row.style.transform || 'translateY(0px)';
        const symbolCell = row.querySelector('.SymbolCellRenderer---symbol---_S70m');
        const symbol = symbolCell ? symbolCell.textContent.trim().toUpperCase() : null;
        
        if (symbol) {
          this.originalRowPositions.set(symbol, { top: currentTop, transform: currentTransform });
        }
      });
    }
    
    // Group rows by category
    const growthRows = [];
    const incomeRows = [];
    const ungroupedRows = [];
    
    positionRows.forEach(row => {
      const symbolCell = row.querySelector('.SymbolCellRenderer---symbol---_S70m');
      const symbol = symbolCell ? symbolCell.textContent.trim().toUpperCase() : null;
      
      if (symbol) {
        const originalData = this.originalRowPositions.get(symbol) || { top: '0px', transform: 'translateY(0px)' };
        
        if (this.growthSymbols.has(symbol)) {
          growthRows.push({ row, symbol, originalData });
        } else if (this.incomeSymbols.has(symbol)) {
          incomeRows.push({ row, symbol, originalData });
        } else {
          ungroupedRows.push({ row, symbol, originalData });
        }
      }
    });
    
    // Use fixed row height from E*TRADE (37px)
    const ROW_HEIGHT = 37;
    let currentPosition = 0;
    
    // Position Growth rows first
    growthRows.forEach(({ row, symbol }, index) => {
      const newTop = currentPosition * ROW_HEIGHT;
      row.style.top = `${newTop}px`;
      row.style.transform = 'translateY(0px)';
      currentPosition++;
    });
    
    // Position Income rows second
    incomeRows.forEach(({ row, symbol }, index) => {
      const newTop = currentPosition * ROW_HEIGHT;
      row.style.top = `${newTop}px`;
      row.style.transform = 'translateY(0px)';
      currentPosition++;
    });
    
    // Position ungrouped rows last with white background
    ungroupedRows.forEach(({ row, symbol }, index) => {
      const newTop = currentPosition * ROW_HEIGHT;
      row.style.top = `${newTop}px`;
      row.style.transform = 'translateY(0px)';
      row.style.backgroundColor = 'white';
      currentPosition++;
    });
    
    console.log(`Sorted ${growthRows.length} Growth, ${incomeRows.length} Income, ${ungroupedRows.length} ungrouped rows`);
  }

  revertSorting() {
    const positionRows = document.querySelectorAll('.RowRenderer---root---C9M4t[role="row"]');
    
    positionRows.forEach(row => {
      const symbolCell = row.querySelector('.SymbolCellRenderer---symbol---_S70m');
      const symbol = symbolCell ? symbolCell.textContent.trim().toUpperCase() : null;
      
      if (symbol && this.originalRowPositions.has(symbol)) {
        const originalData = this.originalRowPositions.get(symbol);
        row.style.top = originalData.top;
        row.style.transform = originalData.transform;
      }
      
      // Reset background color to default (remove override)
      row.style.backgroundColor = '';
    });
  }

  calculateRowHeight(rows) {
    if (rows.length < 2) {

      return 40; // Default fallback
    }
    
    // Get all top positions and sort them to find consistent spacing
    const tops = [];
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const top = parseInt(rows[i].style.top) || 0;
      if (top > 0) tops.push(top);
    }
    
    if (tops.length < 2) {

      return 40;
    }
    
    tops.sort((a, b) => a - b);
    const height = tops[1] - tops[0];

    
    return height > 0 ? height : 40;
  }

  getStartingPosition(rows) {
    if (rows.length === 0) {

      return 0;
    }
    
    // Find the minimum top position to start from
    let minTop = Infinity;
    for (let i = 0; i < rows.length; i++) {
      const top = parseInt(rows[i].style.top) || 0;
      if (top < minTop) {
        minTop = top;
      }
    }
    
    if (minTop === Infinity) minTop = 0;

    return minTop;
  }

  toggleSorting() {
    this.sortingEnabled = !this.sortingEnabled;
    this.saveConfiguration();
    
    if (this.sortingEnabled) {
      this.sortRowsByGroup();
      console.log('Visual sorting enabled');
    } else {
      this.revertSorting();
      console.log('Visual sorting disabled');
    }
    
    // Update UI if config panel is open
    this.updateConfigPanelIfExists();
  }

  highlightRow(row, symbol, group) {
    if (group === 'growth') {
      row.style.backgroundColor = '#e8f2ff'; // Muted blue
      row.setAttribute('data-etrade-helper', 'growth');

    } else if (group === 'income') {
      row.style.backgroundColor = '#e8f5e8'; // Muted green
      row.setAttribute('data-etrade-helper', 'income');

    }
  }

  clearRowHighlight(row) {
    row.style.backgroundColor = '';
    row.removeAttribute('data-etrade-helper');
  }

  clearAllHighlights() {
    const highlightedRows = document.querySelectorAll('[data-etrade-helper]');
    highlightedRows.forEach(row => this.clearRowHighlight(row));
    console.log(`Cleared ${highlightedRows.length} highlighted rows`);
  }

  createConfigPanel() {
    // Create floating configuration panel
    const panel = document.createElement('div');
    panel.id = 'etrade-helper-panel';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      background: white;
      border: 2px solid #007bff;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      display: none;
    `;
    
    panel.innerHTML = `
      <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 15px;">
        <button id="etrade-helper-close" style="background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #0066cc;">Growth Symbols (Muted Blue):</label>
        <textarea id="etrade-helper-growth" 
                  style="width: 100%; height: 70px; border: 1px solid #ccc; border-radius: 4px; padding: 8px; resize: vertical;"
                  placeholder="Enter growth symbols separated by commas
Example: AAPL, TSLA, NVDA, GOOGL"></textarea>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #228b22;">Income Symbols (Muted Green):</label>
        <textarea id="etrade-helper-income" 
                  style="width: 100%; height: 70px; border: 1px solid #ccc; border-radius: 4px; padding: 8px; resize: vertical;"
                  placeholder="Enter income symbols separated by commas
Example: T, VZ, KO, JNJ"></textarea>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: flex; align-items: center; font-weight: bold; color: #333; cursor: pointer;">
          <input type="checkbox" id="etrade-helper-coloring" style="margin-right: 8px;">
          Color Coding (Highlight Growth/Income rows)
        </label>
        <small style="color: #666; margin-left: 20px;">Apply blue/green background colors to grouped rows</small>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: flex; align-items: center; font-weight: bold; color: #333; cursor: pointer;">
          <input type="checkbox" id="etrade-helper-sorting" style="margin-right: 8px;">
          Visual Sorting (Group rows together)
        </label>
        <small style="color: #666; margin-left: 20px;">Group Growth and Income rows visually together</small>
      </div>
      
      <div style="font-size: 12px; color: #666;">
        <div id="etrade-helper-status">Ready</div>
        <div>Growth: <span id="etrade-helper-growth-count">0</span> | Income: <span id="etrade-helper-income-count">0</span> symbols</div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add event listeners
    document.getElementById('etrade-helper-close').onclick = () => {
      panel.style.display = 'none';
    };
    
    // Auto-save on textarea changes (with debounce to prevent typing interference)
    let saveTimeout;
    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        this.saveSymbolsFromPanel();
      }, 500); // Wait 500ms after user stops typing
    };
    
    document.getElementById('etrade-helper-growth').addEventListener('input', debouncedSave);
    document.getElementById('etrade-helper-income').addEventListener('input', debouncedSave);
    
    // Add color coding toggle event listener
    document.getElementById('etrade-helper-coloring').onchange = (e) => {
      this.coloringEnabled = e.target.checked;
      this.saveConfiguration();
      
      // Re-scan and highlight to apply/remove colors
      this.scanAndHighlight();
    };
    
    // Add sorting toggle event listener
    document.getElementById('etrade-helper-sorting').onchange = (e) => {
      this.sortingEnabled = e.target.checked;
      this.saveConfiguration();
      
      if (this.sortingEnabled) {
        this.sortRowsByGroup();
      } else {
        this.revertSorting();
      }
    };
    
    // Create toggle button (with retry for dynamic content)
    this.createToggleButtonWithRetry();
    
    // Update panel with current symbols
    this.updateConfigPanel();
  }

  createToggleButtonWithRetry(retries = 0) {
    if (retries > 10) {
      console.log('Could not find customize section, using fallback button');
      this.createFallbackButton();
      return;
    }
    
    // Always check if button already exists to prevent duplicates
    if (document.getElementById('etrade-helper-toggle')) {
      return;
    }
    
    const customizeContainer = document.querySelector('.PortfoliosFilters---customize---Tdpzj');
    
    if (customizeContainer) {
      this.createToggleButton(customizeContainer);
    } else {
      // Retry after 500ms
      setTimeout(() => this.createToggleButtonWithRetry(retries + 1), 500);
    }
  }
  
  createToggleButton(customizeContainer) {
    // Create a container for our button
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      margin-top: 5px;
      padding-top: 2px;
    `;
    
    // Create the button with muted blue background and text
    const button = document.createElement('button');
    button.id = 'etrade-helper-toggle';
    button.innerHTML = 'Position Grouping';
    button.title = 'Portfolio Grouping Settings';
    button.style.cssText = `
      width: 110px;
      background: rgba(0, 123, 255, 0.1);
      color: #007bff;
      border: 1px solid rgba(0, 123, 255, 0.2);
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      line-height: 1.2;
      transition: background-color 0.2s;
      margin-left: -25px;
    `;
    
    // Add hover effect
    button.onmouseover = () => {
      button.style.backgroundColor = 'rgba(0, 123, 255, 0.15)';
    };
    button.onmouseout = () => {
      button.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
    };
    
    button.onclick = () => {
      const panel = document.getElementById('etrade-helper-panel');
      if (panel.style.display === 'block') {
        panel.style.display = 'none';
      } else {
        panel.style.display = 'block';
        // Update panel with current symbols when shown
        this.updateConfigPanel();
      }
    };
    
    buttonContainer.appendChild(button);
    customizeContainer.appendChild(buttonContainer);
  }
  
  createFallbackButton() {
    const button = document.createElement('button');
    button.id = 'etrade-helper-toggle';
    button.innerHTML = 'Position Grouping';
    button.title = 'Portfolio Grouping Settings';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 123, 255, 0.1);
      color: #007bff;
      border: 1px solid rgba(0, 123, 255, 0.2);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      white-space: nowrap;
      line-height: 1.2;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    button.onclick = () => {
      const panel = document.getElementById('etrade-helper-panel');
      if (panel.style.display === 'block') {
        panel.style.display = 'none';
      } else {
        panel.style.display = 'block';
        this.updateConfigPanel();
      }
    };
    
    document.body.appendChild(button);
  }

  updateConfigPanel() {
    const growthTextarea = document.getElementById('etrade-helper-growth');
    const incomeTextarea = document.getElementById('etrade-helper-income');
    const growthCountSpan = document.getElementById('etrade-helper-growth-count');
    const incomeCountSpan = document.getElementById('etrade-helper-income-count');
    const coloringCheckbox = document.getElementById('etrade-helper-coloring');
    const sortingCheckbox = document.getElementById('etrade-helper-sorting');
    
    if (growthTextarea) {
      growthTextarea.value = Array.from(this.growthSymbols).join(', ');
    }
    
    if (incomeTextarea) {
      incomeTextarea.value = Array.from(this.incomeSymbols).join(', ');
    }
    
    if (growthCountSpan) {
      growthCountSpan.textContent = this.growthSymbols.size;
    }
    
    if (incomeCountSpan) {
      incomeCountSpan.textContent = this.incomeSymbols.size;
    }
    
    if (coloringCheckbox) {
      coloringCheckbox.checked = this.coloringEnabled;
    }
    
    if (sortingCheckbox) {
      sortingCheckbox.checked = this.sortingEnabled;
    }
  }

  updateConfigPanelIfExists() {
    // Only update if the panel elements exist in the DOM
    if (document.getElementById('etrade-helper-growth')) {
      this.updateConfigPanel();
    }
  }

  saveSymbolsFromPanel() {
    const growthTextarea = document.getElementById('etrade-helper-growth');
    const incomeTextarea = document.getElementById('etrade-helper-income');
    const sortingCheckbox = document.getElementById('etrade-helper-sorting');
    const statusDiv = document.getElementById('etrade-helper-status');
    
    try {
      const growthText = growthTextarea.value.trim();
      const incomeText = incomeTextarea.value.trim();
      
      const growthSymbols = growthText
        .split(/[,\s]+/)
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);
        
      const incomeSymbols = incomeText
        .split(/[,\s]+/)
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);
      
      this.growthSymbols = new Set(growthSymbols);
      this.incomeSymbols = new Set(incomeSymbols);
      this.sortingEnabled = sortingCheckbox.checked;
      this.saveConfiguration();
      
      // Re-scan and highlight
      this.scanAndHighlight();
      
      // Update panel
      this.updateConfigPanel();
      
      statusDiv.textContent = `Saved ${growthSymbols.length} Growth + ${incomeSymbols.length} Income symbols`;
      statusDiv.style.color = '#28a745';
      
      setTimeout(() => {
        statusDiv.textContent = 'Ready';
        statusDiv.style.color = '#666';
      }, 2000);
      
    } catch (error) {
      statusDiv.textContent = 'Error saving symbols';
      statusDiv.style.color = '#dc3545';
      console.error('Error saving symbols:', error);
    }
  }

  clearSymbolsFromPanel() {
    this.growthSymbols.clear();
    this.incomeSymbols.clear();
    this.sortingEnabled = false;
    this.originalRowPositions.clear(); // Reset position tracking
    this.saveConfiguration();
    this.clearAllHighlights();
    this.updateConfigPanel();
    
    const statusDiv = document.getElementById('etrade-helper-status');
    statusDiv.textContent = 'All highlights and sorting cleared';
    statusDiv.style.color = '#dc3545';
    
    setTimeout(() => {
      statusDiv.textContent = 'Ready';
      statusDiv.style.color = '#666';
    }, 2000);
  }

  // Public API methods
  addGrowthSymbol(symbol) {
    this.growthSymbols.add(symbol.toUpperCase());
    this.saveConfiguration();
    this.scanAndHighlight();
    console.log(`Added ${symbol} to Growth list`);
  }

  addIncomeSymbol(symbol) {
    this.incomeSymbols.add(symbol.toUpperCase());
    this.saveConfiguration();
    this.scanAndHighlight();
    console.log(`Added ${symbol} to Income list`);
  }

  removeGrowthSymbol(symbol) {
    this.growthSymbols.delete(symbol.toUpperCase());
    this.saveConfiguration();
    this.scanAndHighlight();
    console.log(`Removed ${symbol} from Growth list`);
  }

  removeIncomeSymbol(symbol) {
    this.incomeSymbols.delete(symbol.toUpperCase());
    this.saveConfiguration();
    this.scanAndHighlight();
    console.log(`Removed ${symbol} from Income list`);
  }

  setGrowthSymbols(symbolArray) {
    this.growthSymbols = new Set(symbolArray.map(s => s.toUpperCase()));
    this.saveConfiguration();
    this.scanAndHighlight();
    console.log(`Set Growth symbols to: ${Array.from(this.growthSymbols).join(', ')}`);
  }

  setIncomeSymbols(symbolArray) {
    this.incomeSymbols = new Set(symbolArray.map(s => s.toUpperCase()));
    this.saveConfiguration();
    this.scanAndHighlight();
    console.log(`Set Income symbols to: ${Array.from(this.incomeSymbols).join(', ')}`);
  }

  getGrowthSymbols() {
    return Array.from(this.growthSymbols);
  }

  getIncomeSymbols() {
    return Array.from(this.incomeSymbols);
  }

  getAllSymbols() {
    return {
      growth: Array.from(this.growthSymbols),
      income: Array.from(this.incomeSymbols)
    };
  }

  // Alias for backward compatibility
  scan() {
    this.scanAndHighlight();
  }

  // Debug function to inspect DOM structure
  debugRows() {

    const rows = document.querySelectorAll('.RowRenderer---root---C9M4t[role="row"]');
    // Found ${rows.length} portfolio rows
    
    rows.forEach((row, index) => {
      const symbolCell = row.querySelector('.SymbolCellRenderer---symbol---_S70m');
      const symbol = symbolCell ? symbolCell.textContent.trim().toUpperCase() : null;
      const top = row.style.top;
      const position = row.style.position;
      
      console.log(`Row ${index}: symbol=${symbol}, top=${top}, position=${position}`);
      
      if (index < 3) { // Show detailed info for first 3 rows
        console.log('  Classes:', row.className);
        console.log('  All styles:', row.style.cssText);
        console.log('  Symbol cell:', symbolCell);
      }
    });
    
    // Check if rows are absolutely positioned
    const firstRow = rows[0];
    if (firstRow) {
      const computedStyle = window.getComputedStyle(firstRow);
      console.log('First row computed position:', computedStyle.position);
      console.log('First row computed top:', computedStyle.top);
    }
    
    return rows;
  }
}

// Initialize the extension
const etradeHelper = new EtradePortfolioHelper();

// Make it available globally for easy control
window.etradeHelper = etradeHelper;

// Display available commands
console.log('✨ E*TRADE Portfolio Helper - Growth & Income Groups with Visual Sorting');
console.log('Available commands:');
console.log('Growth symbols (muted blue):');
console.log('  etradeHelper.addGrowthSymbol("AAPL") - Add to Growth group');
console.log('  etradeHelper.removeGrowthSymbol("AAPL") - Remove from Growth');
console.log('  etradeHelper.setGrowthSymbols(["AAPL", "TSLA"]) - Set all Growth symbols');
console.log('  etradeHelper.getGrowthSymbols() - Get Growth symbol list');
console.log('');
console.log('Income symbols (muted green):');
console.log('  etradeHelper.addIncomeSymbol("T") - Add to Income group');
console.log('  etradeHelper.removeIncomeSymbol("T") - Remove from Income');
console.log('  etradeHelper.setIncomeSymbols(["T", "VZ"]) - Set all Income symbols');
console.log('  etradeHelper.getIncomeSymbols() - Get Income symbol list');
console.log('');
console.log('Visual Sorting:');
console.log('  etradeHelper.toggleSorting() - Toggle visual sorting on/off');
console.log('  etradeHelper.sortRowsByGroup() - Apply sorting now');
console.log('  etradeHelper.revertSorting() - Revert to original positions');
console.log('');
console.log('General commands:');
console.log('  etradeHelper.getAllSymbols() - Get both groups');
console.log('  etradeHelper.scan() - Re-scan and apply highlights');
console.log('  etradeHelper.clearAllHighlights() - Clear all highlights');
console.log('  etradeHelper.debugRows() - Debug DOM structure (troubleshooting)');
console.log('');
console.log('📈 Muted blue rows = Growth symbols');
console.log('🟢 Muted green rows = Income symbols');
console.log('Visual sorting groups rows together');
console.log('⚙️ Click the gear icon in top-right to configure via UI');