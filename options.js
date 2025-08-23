// Options page script for Smart Tab Grouper
class OptionsManager {
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

		this.init();
	}

	async init() {
		await this.loadSettings();
		this.setupEventListeners();
		this.renderSettings();
		this.renderRules();
	}

	async loadSettings() {
		const stored = await chrome.storage.sync.get(['tabGroupSettings']);
		if (stored.tabGroupSettings) {
			this.settings = { ...this.settings, ...stored.tabGroupSettings };
		}
	}

	async saveSettings() {
		try {
			await chrome.storage.sync.set({ tabGroupSettings: this.settings });
			this.showStatus('Settings saved successfully!', 'success');
		} catch (error) {
			this.showStatus('Error saving settings', 'error');
		}
	}

	setupEventListeners() {
		document
			.getElementById('autoGroupToggle')
			.addEventListener('change', (e) => {
				this.settings.autoGroup = e.target.checked;
			});

		document
			.getElementById('groupByDomainToggle')
			.addEventListener('change', (e) => {
				this.settings.groupByDomain = e.target.checked;
			});

		document.getElementById('addRuleBtn').addEventListener('click', () => {
			this.addNewRule();
		});

		document.getElementById('saveBtn').addEventListener('click', () => {
			this.saveSettings();
		});

		document.getElementById('resetBtn').addEventListener('click', () => {
			this.resetToDefaults();
		});
	}

	renderSettings() {
		document.getElementById('autoGroupToggle').checked =
			this.settings.autoGroup;
		document.getElementById('groupByDomainToggle').checked =
			this.settings.groupByDomain;
	}

	renderRules() {
		const container = document.getElementById('rulesContainer');
		container.innerHTML = '';

		this.settings.customRules.forEach((rule, index) => {
			const ruleElement = this.createRuleElement(rule, index);
			container.appendChild(ruleElement);
		});
	}

	createRuleElement(rule, index) {
		const ruleDiv = document.createElement('div');
		ruleDiv.className = 'rule-item';

		ruleDiv.innerHTML = `
      <div class="rule-header">
        <div>
          <label>
            <input type="checkbox" ${
							rule.enabled ? 'checked' : ''
						} onchange="optionsManager.toggleRule(${index})">
            Rule ${index + 1}
          </label>
        </div>
        <button class="button danger" onclick="optionsManager.removeRule(${index})">Delete</button>
      </div>
      <div class="rule-inputs">
        <select class="select-field" onchange="optionsManager.updateRule(${index}, 'condition', this.value)">
          <option value="url" ${
						rule.condition === 'url' ? 'selected' : ''
					}>URL contains</option>
          <option value="hostname" ${
						rule.condition === 'hostname' ? 'selected' : ''
					}>Hostname contains</option>
          <option value="title" ${
						rule.condition === 'title' ? 'selected' : ''
					}>Title contains</option>
        </select>
        <input 
          type="text" 
          class="input-field" 
          placeholder="Enter pattern..."
          value="${rule.value || ''}"
          onchange="optionsManager.updateRule(${index}, 'value', this.value)"
        >
        <div style="display: flex; gap: 10px; align-items: center;">
          <select class="select-field" onchange="optionsManager.updateRule(${index}, 'color', this.value)" style="flex: 1;">
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
            style="width: 20px; height: 20px; border-radius: 4px; background: ${
							this.colorOptions[rule.color] || '#9ca3af'
						};"
          ></div>
        </div>
      </div>
      <div style="margin-top: 10px;">
        <input 
          type="text" 
          class="input-field" 
          placeholder="Group name..."
          value="${rule.groupName || ''}"
          onchange="optionsManager.updateRule(${index}, 'groupName', this.value)"
          style="width: 100%;"
        >
      </div>
    `;

		return ruleDiv;
	}

	addNewRule() {
		const newRule = {
			enabled: true,
			condition: 'url',
			value: '',
			groupName: '',
			color: 'blue',
		};

		this.settings.customRules.push(newRule);
		this.renderRules();
	}

	removeRule(index) {
		this.settings.customRules.splice(index, 1);
		this.renderRules();
	}

	toggleRule(index) {
		this.settings.customRules[index].enabled =
			!this.settings.customRules[index].enabled;
	}

	updateRule(index, property, value) {
		this.settings.customRules[index][property] = value;

		// Re-render to update color preview
		if (property === 'color') {
			this.renderRules();
		}
	}

	async resetToDefaults() {
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

			await this.saveSettings();
			this.renderSettings();
			this.renderRules();
		}
	}

	showStatus(message, type) {
		const statusDiv = document.getElementById('saveStatus');
		statusDiv.textContent = message;
		statusDiv.className = `save-status ${type}`;

		setTimeout(() => {
			statusDiv.className = 'save-status';
		}, 3000);
	}
}

// Initialize the options manager when the page loads
let optionsManager;
document.addEventListener('DOMContentLoaded', () => {
	optionsManager = new OptionsManager();
});
