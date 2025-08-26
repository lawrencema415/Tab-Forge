// Options page script for Tab Forge

// Define types for our settings
interface CustomRule {
  enabled: boolean;
  condition: 'url' | 'hostname' | 'title';
  value: string;
  groupName: string;
  color: string;
}

interface TabGroupSettings {
  autoGroup: boolean;
  groupByDomain: boolean;
  customRules: CustomRule[];
  colors: { [key: string]: string };
}

interface ColorOptions {
  [key: string]: string;
}

class OptionsManager {
  private settings: TabGroupSettings;
  private colorOptions: ColorOptions;
  private regroupDebounceTimer: number | null;

  constructor() {
    this.settings = {
      autoGroup: true,
      groupByDomain: true,
      customRules: [],
      colors: {
        'github.com': 'purple',
        'google.com': 'blue',
        'notion.so': 'red',
        'stackoverflow.com': 'orange',
        'youtube.com': 'pink',
        'twitter.com': 'cyan',
        'facebook.com': 'blue',
        'linkedin.com': 'blue',
        'reddit.com': 'orange',
      },
    };

    this.colorOptions = {
      grey: '#9ca3af',
      blue: '#3b82f6',
      red: '#ef4444',
      yellow: '#f59e0b',
      green: '#10b981',
      pink: '#ec4899',
      purple: '#8b5cf6',
      cyan: '#06b6d4',
      orange: '#f97316',
    };

    // Debounce timer for regrouping
    this.regroupDebounceTimer = null;
    
    this.init();
  }

  async init(): Promise<void> {
    await this.loadSettings();
    this.setupEventListeners();
    this.renderSettings();
    this.renderRules();
  }

  async loadSettings(): Promise<void> {
    const stored = await chrome.storage.sync.get(['tabGroupSettings']);
    if (stored.tabGroupSettings) {
      this.settings = { ...this.settings, ...stored.tabGroupSettings };
    }
  }

  async saveSettings(triggerRegroup: boolean = true): Promise<void> {
    try {
      await chrome.storage.sync.set({ tabGroupSettings: this.settings });
      this.showStatus('Settings saved successfully!', 'success');
      
      // Trigger regrouping when settings are saved (unless explicitly disabled)
      if (triggerRegroup) {
        this.debounceRegroupTabs();
      }
    } catch (error) {
      this.showStatus('Error saving settings', 'error');
    }
  }

  // Debounced regrouping to prevent too many operations
  debounceRegroupTabs(): void {
    // Clear existing timer
    if (this.regroupDebounceTimer) {
      clearTimeout(this.regroupDebounceTimer);
    }
    
    // Set new timer
    this.regroupDebounceTimer = window.setTimeout(() => {
      this.regroupTabs();
      this.regroupDebounceTimer = null;
    }, 1000); // Wait 1 second after the last change
  }

  async regroupTabs(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      if (tabs.length < 2) {
        this.showStatus('Not enough tabs to regroup (need at least 2).', 'info');
        return;
      }

      this.showStatus('Regrouping tabs...', 'info');
      
      // First ungroup all tabs
      await chrome.runtime.sendMessage({ action: 'ungroupAll' });
      
      // Small delay to ensure ungrouping is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then regroup all tabs
      await chrome.runtime.sendMessage({ action: 'groupByDomain' });
      
      this.showStatus('Tabs regrouped successfully!', 'success');
    } catch (error: any) {
      console.error('Error regrouping tabs:', error);
      this.showStatus('Error regrouping tabs: ' + (error.message || 'Unknown error'), 'error');
    }
  }

  setupEventListeners(): void {
    // General settings
    const autoGroupToggle = document.getElementById('autoGroupToggle') as HTMLInputElement;
    if (autoGroupToggle) {
      autoGroupToggle.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.settings.autoGroup = target.checked;
        // Don't save settings automatically - let user save when ready
      });
    }

    const groupByDomainToggle = document.getElementById('groupByDomainToggle') as HTMLInputElement;
    if (groupByDomainToggle) {
      groupByDomainToggle.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.settings.groupByDomain = target.checked;
        // Don't save settings automatically - let user save when ready
      });
    }
    
    const saveGeneralBtn = document.getElementById('saveGeneralBtn');
    if (saveGeneralBtn) {
      saveGeneralBtn.addEventListener('click', () => {
        this.saveSettings(); // This will trigger regrouping
      });
    }

    // Rules
    const addRuleBtn = document.getElementById('addRuleBtn');
    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', () => {
        this.addNewRule();
      });
    }

    const saveRulesBtn = document.getElementById('saveRulesBtn');
    if (saveRulesBtn) {
      saveRulesBtn.addEventListener('click', () => {
        this.saveSettings(); // This will trigger regrouping
      });
    }

    // Actions
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetToDefaults();
      });
    }

    // Action buttons
    const groupTabsBtn = document.getElementById('groupTabsBtn');
    if (groupTabsBtn) {
      groupTabsBtn.addEventListener('click', () => {
        this.executeAction('groupByDomain', 'Tabs grouped by domain!');
      });
    }

    const regroupTabsBtn = document.getElementById('regroupTabsBtn');
    if (regroupTabsBtn) {
      regroupTabsBtn.addEventListener('click', () => {
        this.regroupTabs();
      });
    }

    const removeDuplicatesBtn = document.getElementById('removeDuplicatesBtn');
    if (removeDuplicatesBtn) {
      removeDuplicatesBtn.addEventListener('click', () => {
        this.executeAction('removeDuplicates', 'Duplicate tabs removed!');
      });
    }

    const expandAllBtn = document.getElementById('expandAllBtn');
    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        this.executeAction('expandAll', 'All groups expanded!');
      });
    }

    const collapseAllBtn = document.getElementById('collapseAllBtn');
    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        this.executeAction('collapseAll', 'All groups collapsed!');
      });
    }

    const ungroupAllBtn = document.getElementById('ungroupAllBtn');
    if (ungroupAllBtn) {
      ungroupAllBtn.addEventListener('click', () => {
        this.executeAction('ungroupAll', 'All tabs ungrouped!');
      });
    }
  }

  async executeAction(action: string, successMessage: string): Promise<void> {
    try {
      this.showStatus('Processing...', 'info');
      const response: any = await chrome.runtime.sendMessage({ action });

      if (response && response.success) {
        this.showStatus(successMessage, 'success');
      } else if (response) {
        this.showStatus(response.error || 'Action failed', 'error');
      } else {
        // Handle undefined response
        this.showStatus('No response from background service', 'error');
      }
    } catch (error: any) {
      console.error('Error executing action:', error);
      if (error.message && error.message.includes('Timeout')) {
        this.showStatus('Timeout: Background service not responding', 'error');
      } else {
        this.showStatus('Error: ' + (error.message || 'Could not connect to background service'), 'error');
      }
    }
  }

  renderSettings(): void {
    const autoGroupToggle = document.getElementById('autoGroupToggle') as HTMLInputElement;
    if (autoGroupToggle) {
      autoGroupToggle.checked = this.settings.autoGroup;
    }
    
    const groupByDomainToggle = document.getElementById('groupByDomainToggle') as HTMLInputElement;
    if (groupByDomainToggle) {
      groupByDomainToggle.checked = this.settings.groupByDomain;
    }
  }

  renderRules(): void {
    const container = document.getElementById('rulesContainer');
    if (container) {
      container.innerHTML = '';

      this.settings.customRules.forEach((rule, index) => {
        const ruleElement = this.createRuleElement(rule, index);
        container.appendChild(ruleElement);
      });
    }
  }

  createRuleElement(rule: CustomRule, index: number): HTMLElement {
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'rule-item';
    ruleDiv.setAttribute('data-rule-index', index.toString());

    ruleDiv.innerHTML = `
      <div class="rule-header">
        <div>
          <label>
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} class="rule-enabled-checkbox">
            Rule ${index + 1}
          </label>
        </div>
        <button class="button danger rule-delete-btn">Delete</button>
      </div>
      <div class="rule-inputs">
        <select class="select-field rule-condition-select">
          <option value="url" ${rule.condition === 'url' ? 'selected' : ''}>URL contains</option>
          <option value="hostname" ${rule.condition === 'hostname' ? 'selected' : ''}>Hostname contains</option>
          <option value="title" ${rule.condition === 'title' ? 'selected' : ''}>Title contains</option>
        </select>
        <input 
          type="text" 
          class="input-field rule-value-input" 
          placeholder="Enter pattern..."
          value="${rule.value || ''}"
        >
        <div style="display: flex; gap: 10px; align-items: center;">
          <select class="select-field rule-color-select" style="flex: 1;">
            ${Object.keys(this.colorOptions)
              .map(
                (color) =>
                  `<option value="${color}" ${
                    rule.color === color ? 'selected' : ''
                  }>${color}</option>`
              )
              .join('')}
          </select>
          <div 
            class="rule-color-preview"
            style="width: 20px; height: 20px; border-radius: 4px; background: ${
              this.colorOptions[rule.color] || '#9ca3af'
            };"
          ></div>
        </div>
      </div>
      <div style="margin-top: 10px;">
        <input 
          type="text" 
          class="input-field rule-groupname-input" 
          placeholder="Group name..."
          value="${rule.groupName || ''}"
          style="width: 100%;"
        >
      </div>
    `;

    // Add event listeners to the created elements
    this.attachRuleEventListeners(ruleDiv, index);

    return ruleDiv;
  }

  attachRuleEventListeners(ruleElement: HTMLElement, index: number): void {
    // Enable/disable checkbox
    const enabledCheckbox = ruleElement.querySelector('.rule-enabled-checkbox') as HTMLInputElement;
    if (enabledCheckbox) {
      enabledCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.toggleRule(index, target.checked);
      });
    }

    // Delete button
    const deleteBtn = ruleElement.querySelector('.rule-delete-btn') as HTMLButtonElement;
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.removeRule(index);
      });
    }

    // Condition select
    const conditionSelect = ruleElement.querySelector('.rule-condition-select') as HTMLSelectElement;
    if (conditionSelect) {
      conditionSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.updateRule(index, 'condition', target.value as 'url' | 'hostname' | 'title');
      });
    }

    // Value input
    const valueInput = ruleElement.querySelector('.rule-value-input') as HTMLInputElement;
    if (valueInput) {
      valueInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.updateRule(index, 'value', target.value);
      });
    }

    // Color select
    const colorSelect = ruleElement.querySelector('.rule-color-select') as HTMLSelectElement;
    if (colorSelect) {
      colorSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.updateRule(index, 'color', target.value);
      });
    }

    // Group name input
    const groupNameInput = ruleElement.querySelector('.rule-groupname-input') as HTMLInputElement;
    if (groupNameInput) {
      groupNameInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.updateRule(index, 'groupName', target.value);
      });
    }
  }

  addNewRule(): void {
    const newRule: CustomRule = {
      enabled: true,
      condition: 'url',
      value: '',
      groupName: '',
      color: 'blue',
    };

    this.settings.customRules.push(newRule);
    this.renderRules();
    // Don't save settings automatically - let user save when ready
  }

  removeRule(index: number): void {
    if (confirm(`Are you sure you want to delete Rule ${index + 1}?`)) {
      this.settings.customRules.splice(index, 1);
      this.renderRules();
      // Don't save settings automatically - let user save when ready
      this.showStatus('Rule deleted successfully!', 'success');
    }
  }

  toggleRule(index: number, checked: boolean): void {
    if (this.settings.customRules[index]) {
      this.settings.customRules[index].enabled = checked;
      const status = checked ? 'enabled' : 'disabled';
      this.showStatus(`Rule ${index + 1} ${status}!`, 'success');
      // Don't save settings automatically - let user save when ready
    }
  }

  updateRule(index: number, property: string, value: any): void {
    if (this.settings.customRules[index]) {
      (this.settings.customRules[index] as any)[property] = value;

      // Update color preview if color changed
      if (property === 'color') {
        const ruleElement = document.querySelector(
          `[data-rule-index="${index}"]`
        );
        if (ruleElement) {
          const colorPreview = ruleElement.querySelector('.rule-color-preview') as HTMLElement;
          if (colorPreview) {
            colorPreview.style.background =
              this.colorOptions[value] || '#9ca3af';
          }
        }
      }
      
      // Don't save settings automatically - let user save when ready
    }
  }

  async resetToDefaults(): Promise<void> {
    if (
      confirm(
        'Are you sure you want to reset all settings to defaults? This will remove all custom rules.'
      )
    ) {
      this.settings = {
        autoGroup: true,
        groupByDomain: true,
        customRules: [],
        colors: {
          'github.com': 'purple',
          'google.com': 'blue',
          'notion.so': 'red',
          'stackoverflow.com': 'orange',
          'youtube.com': 'pink',
          'twitter.com': 'cyan',
          'facebook.com': 'blue',
          'linkedin.com': 'blue',
          'reddit.com': 'orange',
        },
      };

      this.renderSettings();
      this.renderRules();
      this.showStatus('Settings reset to defaults!', 'success');
    }
  }

  showStatus(message: string, type: string): void {
    const statusDiv = document.getElementById('saveStatus');
    if (statusDiv) {
      statusDiv.textContent = message;
      statusDiv.className = `save-status ${type}`;

      setTimeout(() => {
        statusDiv.className = 'save-status';
      }, 3000);
    }
  }
}

// Initialize the options manager when the page loads
let optionsManager: OptionsManager | null = null;
document.addEventListener('DOMContentLoaded', () => {
  optionsManager = new OptionsManager();
});