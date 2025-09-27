// E*TRADE Portfolio Helper - Content Script
// Simple symbol highlighting mode

class EtradePortfolioHelper {
  constructor() {
    this.positions = new Map();
    this.growthSymbols = new Set();
    this.incomeSymbols = new Set();
    this.init();
    this.loadConfiguration();
  }

  init() {
    console.log('E*TRADE Portfolio Helper loaded - Growth & Income Groups');
    
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
      
      if (savedGrowth) {
        const growthArray = JSON.parse(savedGrowth);
        this.growthSymbols = new Set(growthArray.map(s => s.toUpperCase()));
      } else {
        // Default growth symbols for demonstration
        this.growthSymbols = new Set(['AAPL', 'TSLA', 'NVDA']);
      }
      
      if (savedIncome) {
        const incomeArray = JSON.parse(savedIncome);
        this.incomeSymbols = new Set(incomeArray.map(s => s.toUpperCase()));
      } else {
        // Default income symbols for demonstration
        this.incomeSymbols = new Set(['T', 'VZ', 'KO']);
      }
      
      console.log('Loaded Growth symbols:', Array.from(this.growthSymbols));
      console.log('Loaded Income symbols:', Array.from(this.incomeSymbols));
      
      // Save defaults if first time
      if (!savedGrowth || !savedIncome) {
        this.saveConfiguration();
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.growthSymbols = new Set(['AAPL', 'TSLA', 'NVDA']);
      this.incomeSymbols = new Set(['T', 'VZ', 'KO']);
    }
  }

  saveConfiguration() {
    try {
      const growthArray = Array.from(this.growthSymbols);
      const incomeArray = Array.from(this.incomeSymbols);
      
      localStorage.setItem('etradeHelper_growthSymbols', JSON.stringify(growthArray));
      localStorage.setItem('etradeHelper_incomeSymbols', JSON.stringify(incomeArray));
      
      console.log('Saved Growth symbols:', growthArray);
      console.log('Saved Income symbols:', incomeArray);
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  }

  observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if portfolio table content has been added/modified
          for (let node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.classList?.contains('RowRenderer---root---C9M4t') || 
                  node.querySelector?.('.RowRenderer---root---C9M4t')) {
                shouldScan = true;
                break;
              }
            }
          }
        }
      });
      
      if (shouldScan) {
        console.log('Portfolio table updated, rescanning...');
        setTimeout(() => this.scanAndHighlight(), 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  scanAndHighlight() {
    console.log('Scanning for positions to highlight...');
    
    // Find all position rows
    const positionRows = document.querySelectorAll('.RowRenderer---root---C9M4t[role="row"]');
    console.log(`Found ${positionRows.length} position rows`);

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
            this.highlightRow(row, symbol, 'growth');
            group = 'growth';
            growthCount++;
          }
          // Check if this symbol is in Income group
          else if (this.incomeSymbols.has(symbol)) {
            this.highlightRow(row, symbol, 'income');
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
    
    console.log(`✨ Highlighted ${growthCount} Growth + ${incomeCount} Income positions out of ${positionRows.length} total`);
    console.log(`� Growth symbols: ${Array.from(this.growthSymbols).join(', ')}`);
    console.log(`💰 Income symbols: ${Array.from(this.incomeSymbols).join(', ')}`);
  }

  highlightRow(row, symbol, group) {
    if (group === 'growth') {
      row.style.backgroundColor = '#e8f2ff'; // Muted blue
      row.setAttribute('data-etrade-helper', 'growth');
      console.log(`📈 Highlighted ${symbol} (Growth)`);
    } else if (group === 'income') {
      row.style.backgroundColor = '#e8f5e8'; // Muted green
      row.setAttribute('data-etrade-helper', 'income');
      console.log(`� Highlighted ${symbol} (Income)`);
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
      width: 300px;
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #007bff;">E*TRADE Helper</h3>
        <button id="etrade-helper-close" style="background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #0066cc;">📈 Growth Symbols (Muted Blue):</label>
        <textarea id="etrade-helper-growth" 
                  style="width: 100%; height: 70px; border: 1px solid #ccc; border-radius: 4px; padding: 8px; resize: vertical;"
                  placeholder="Enter growth symbols separated by commas
Example: AAPL, TSLA, NVDA, GOOGL"></textarea>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #228b22;">💰 Income Symbols (Muted Green):</label>
        <textarea id="etrade-helper-income" 
                  style="width: 100%; height: 70px; border: 1px solid #ccc; border-radius: 4px; padding: 8px; resize: vertical;"
                  placeholder="Enter income symbols separated by commas
Example: T, VZ, KO, JNJ"></textarea>
      </div>
      
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <button id="etrade-helper-save" style="flex: 1; background: #28a745; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Save & Apply</button>
        <button id="etrade-helper-clear" style="flex: 1; background: #dc3545; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Clear All</button>
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
      document.getElementById('etrade-helper-toggle').style.display = 'block';
    };
    
    document.getElementById('etrade-helper-save').onclick = () => {
      this.saveSymbolsFromPanel();
    };
    
    document.getElementById('etrade-helper-clear').onclick = () => {
      this.clearSymbolsFromPanel();
    };
    
    // Create toggle button
    this.createToggleButton();
    
    // Update panel with current symbols
    this.updateConfigPanel();
  }

  createToggleButton() {
    const button = document.createElement('button');
    button.id = 'etrade-helper-toggle';
    button.innerHTML = '⚙️';
    button.title = 'E*TRADE Portfolio Helper Settings';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 18px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    button.onclick = () => {
      const panel = document.getElementById('etrade-helper-panel');
      panel.style.display = 'block';
      button.style.display = 'none';
    };
    
    document.body.appendChild(button);
  }

  updateConfigPanel() {
    const growthTextarea = document.getElementById('etrade-helper-growth');
    const incomeTextarea = document.getElementById('etrade-helper-income');
    const growthCountSpan = document.getElementById('etrade-helper-growth-count');
    const incomeCountSpan = document.getElementById('etrade-helper-income-count');
    
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
  }

  saveSymbolsFromPanel() {
    const growthTextarea = document.getElementById('etrade-helper-growth');
    const incomeTextarea = document.getElementById('etrade-helper-income');
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
    this.saveConfiguration();
    this.clearAllHighlights();
    this.updateConfigPanel();
    
    const statusDiv = document.getElementById('etrade-helper-status');
    statusDiv.textContent = 'All highlights cleared';
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
}

// Initialize the extension
const etradeHelper = new EtradePortfolioHelper();

// Make it available globally for easy control
window.etradeHelper = etradeHelper;

// Display available commands
console.log('✨ E*TRADE Portfolio Helper - Growth & Income Groups');
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
console.log('General commands:');
console.log('  etradeHelper.getAllSymbols() - Get both groups');
console.log('  etradeHelper.scan() - Re-scan and apply highlights');
console.log('  etradeHelper.clearAllHighlights() - Clear all highlights');
console.log('');
console.log('� Muted blue rows = Growth symbols');
console.log('🟢 Muted green rows = Income symbols');
console.log('⚙️ Click the gear icon in top-right to configure via UI');