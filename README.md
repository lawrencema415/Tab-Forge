# Tab Forge

A Chrome extension for automatically grouping tabs by domain or custom rules with configurable colors.

## Features

- **Auto Grouping**: Automatically groups new tabs by domain
- **Custom Rules**: Create custom grouping rules based on URL, hostname, or title
- **Color Coding**: Assign custom colors to different domains or groups
- **Bulk Actions**: Group, ungroup, expand, or collapse all tab groups with one click
- **Duplicate Removal**: Automatically identify and remove duplicate tabs
- **Side Panel Interface**: Modern, easy-to-use side panel interface

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

After installation, the Tab Forge side panel can be accessed through the Chrome side panel or by clicking the extension icon.

### Main Features

- **Group All Tabs by Domain**: Organizes all open tabs into groups based on their domain
- **Ungroup All Tabs**: Removes all tabs from their groups
- **Expand All Groups**: Expands all collapsed tab groups
- **Collapse All Groups**: Collapses all expanded tab groups
- **Remove Duplicate Tabs**: Finds and removes duplicate tabs
- **Close All Tabs**: Closes all tabs in the current window (with confirmation)

### Settings

Click the gear icon to access the settings page where you can:
- Enable/disable auto-grouping
- Configure grouping by domain
- Create custom grouping rules
- Set custom colors for domains

## Development

To build the extension:

```bash
npm run build
```

To watch for changes during development:

```bash
npm run watch
```

## Permissions

This extension requires the following permissions:
- `tabs`: To access and manipulate browser tabs
- `tabGroups`: To create and manage tab groups
- `storage`: To save settings and preferences
- `activeTab`: To access the currently active tab

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT