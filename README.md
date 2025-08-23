# Tab Forge - Chrome Extension

A powerful Chrome extension that automatically organizes your tabs by grouping them based on domain names or custom rules. Keep your browsing organized and boost your productivity!

## 🚀 Features

### Core Features

- **Auto-Group by Domain**: Automatically group tabs from the same website domain
- **Custom Rules**: Create powerful rules based on URL patterns, hostnames, or page titles
- **Configurable Colors**: Assign custom colors to different tab groups
- **Real-time Grouping**: Automatically group new tabs as they're created
- **Manual Controls**: Group all tabs with one click or manage groups individually

### Tab Management

- **Remove Duplicates**: Find and close duplicate tabs across all groups
- **Expand/Collapse All**: Quickly expand or collapse all tab groups
- **Ungroup All**: Remove all tab grouping in one click

### Advanced Rules Engine

- **URL Matching**: Group tabs based on URL patterns
- **Hostname Matching**: Group tabs by specific hostnames or subdomains
- **Title Matching**: Group tabs based on page title keywords
- **Custom Colors**: Assign specific colors to each rule
- **Enable/Disable Rules**: Toggle rules on and off without deleting them

## 📦 Installation

### Install from Files (Developer Mode)

1. **Download the Extension Files**

   - Download all the files from this repository
   - Create a folder named `smart-tab-grouper` and place all files inside

2. **Enable Developer Mode**

   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top-right corner

3. **Load the Extension**

   - Click "Load unpacked"
   - Select the `smart-tab-grouper` folder
   - The extension should now appear in your extensions list

4. **Pin the Extension** (Optional)
   - Click the extension puzzle piece icon in Chrome's toolbar
   - Find "Smart Tab Grouper" and click the pin icon

## 🎯 Usage

### Basic Usage

1. **Open the Popup**

   - Click the Smart Tab Grouper icon in your toolbar
   - Use the popup to perform quick actions

2. **Group Tabs by Domain**

   - Click "Group Tabs by Domain" to automatically group all open tabs
   - Tabs from the same website will be grouped together

3. **Manage Tab Groups**
   - Use "Expand All Groups" or "Collapse All Groups" for quick navigation
   - "Remove Duplicates" will close tabs with identical URLs
   - "Ungroup All Tabs" removes all grouping

### Advanced Configuration

1. **Access Settings**

   - Click "⚙️ Settings & Rules" in the popup
   - Or right-click the extension icon and select "Options"

2. **General Settings**

   - **Auto Group New Tabs**: Automatically group tabs as they're created
   - **Group by Domain**: Enable domain-based grouping

3. **Create Custom Rules**
   - Click "Add New Rule" to create a new grouping rule
   - Choose the condition type:
     - **URL contains**: Matches URLs containing specific text
     - **Hostname contains**: Matches hostnames containing specific text
     - **Title contains**: Matches page titles containing specific text
   - Enter the pattern to match
   - Choose a color for the group
   - Enter a custom group name

### Example Custom Rules

Here are some example rules you can create:

| Condition         | Pattern             | Group Name    | Color  | Description                    |
| ----------------- | ------------------- | ------------- | ------ | ------------------------------ |
| URL contains      | `/docs/`            | Documentation | Blue   | Groups all documentation pages |
| Hostname contains | `github`            | Development   | Purple | Groups all GitHub-related tabs |
| Title contains    | `Gmail`             | Email         | Red    | Groups Gmail tabs              |
| URL contains      | `youtube.com/watch` | Videos        | Pink   | Groups YouTube videos          |
| Hostname contains | `stackoverflow`     | Q&A           | Orange | Groups Stack Overflow pages    |

## 🎨 Default Domain Colors

The extension comes with predefined colors for popular websites:

- **GitHub**: Purple
- **Google**: Blue
- **Notion**: Red
- **Stack Overflow**: Orange
- **YouTube**: Pink
- **Twitter**: Cyan
- **Facebook**: Blue
- **LinkedIn**: Blue
- **Reddit**: Orange

## 🛠️ File Structure

```
smart-tab-grouper/
├── manifest.json          # Extension manifest
├── background.js          # Service worker script
├── popup.html            # Popup interface
├── popup.js              # Popup functionality
├── options.html          # Settings page
├── options.js            # Settings functionality
└── README.md            # This file
```

## 🔧 Technical Details

### Permissions

- `tabs`: Required to access and modify browser tabs
- `tabGroups`: Required to create and manage tab groups
- `storage`: Required to save user settings and rules
- `activeTab`: Required to interact with the current tab

### Chrome APIs Used

- Chrome Tabs API
- Chrome Tab Groups API
- Chrome Storage API
- Chrome Runtime API

## 🚀 Development

### Making Changes

1. **Edit the Files**

   - Modify any of the HTML, CSS, or JavaScript files
   - Save your changes

2. **Reload the Extension**

   - Go to `chrome://extensions/`
   - Find "Smart Tab Grouper"
   - Click the refresh icon

3. **Test Your Changes**
   - Open some tabs and test the functionality
   - Check the browser console for any errors

### Adding New Features

The extension is modular and easy to extend:

- **Add new conditions**: Modify the `findMatchingRule()` method in `background.js`
- **Add new colors**: Update the `colorOptions` object in `options.js`
- **Add new actions**: Add new message handlers in `background.js`

## 🐛 Troubleshooting

### Common Issues

1. **Extension Not Working**

   - Make sure all files are in the correct folder structure
   - Check `chrome://extensions/` for any error messages
   - Try reloading the extension

2. **Tabs Not Grouping**

   - Check if auto-grouping is enabled in settings
   - Verify your custom rules are enabled and correctly configured
   - Some special Chrome pages (chrome://) cannot be grouped

3. **Settings Not Saving**
   - Make sure the extension has storage permissions
   - Try refreshing the options page

### Debug Mode

- Open Chrome DevTools on the extension popup or options page
- Check the console for error messages
- Use `chrome://extensions/` to view service worker logs

## 📝 Version History

### v1.0.0 (Initial Release)

- Domain-based tab grouping
- Custom rule engine
- Configurable colors
- Auto-grouping functionality
- Tab management tools

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve this extension!

## 📄 License

This project is open source and available under the MIT License.
