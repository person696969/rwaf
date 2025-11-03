# Discord Anti-Toxicity Moderation Bot

## Overview
This is an advanced Discord moderation bot designed to detect and prevent toxic behavior, spam, threats, and inappropriate content in Discord servers. The bot uses multiple detection methods including:
- Perspective API for toxicity analysis (optional)
- Pattern-based profanity and threat detection
- Image analysis (OCR) for text in images
- Link checking and anti-phishing
- Spam detection and rate limiting
- Multi-line message pattern detection
- Context-aware analysis (gaming/entertainment context)

## Current State
- **Status**: ✅ Running successfully on Replit
- **Bot**: Connected and online
- **Port**: 5000 (Health dashboard accessible via webview)
- **Database**: SQLite databases in `/databases` directory
- **Dependencies**: All npm packages installed (Node.js 20, Python 3.11)
- **Commands Loaded**: 83 commands across all categories
- **Workflow**: Configured and running

## Recent Changes (November 3, 2025)
### Replit Environment Setup
1. Upgraded to Node.js 20 (required for better-sqlite3)
2. Installed Python 3.11 (required for building native dependencies)
3. Installed all npm dependencies successfully
4. Fixed command loading issue (moved constants.js out of commands folder)
5. Created comprehensive .gitignore file
6. Configured workflow with webview output on port 5000
7. Bot successfully connected to Discord and running

## Recent Major Enhancements (October 28, 2025)
### Core System
1. Created environment configuration file (`src/config/environment.js`)
2. Fixed corrupted files (textNormalizer.js, constants.js)
3. Corrected import paths (event handlers)
4. Made Perspective API optional (bot works without it)
5. Configured Express server to bind to 0.0.0.0:5000
6. Set up workflow for bot execution
7. Filled all empty handler files with complete implementations

### New Commands Implemented
#### System Controls (Admin)
- `n!enable` - Enable protection system
- `n!disable` - Disable protection system  
- `n!config` - View configuration (enhanced)
- `n!reset` - Reset server data (enhanced with confirmation)

#### Configuration Commands (Admin)
- `n!setthreshold <0-10>` - Set toxicity sensitivity
- `n!setstrikes <1-10>` - Set maximum strikes
- `n!setpunishment <strike#> <type>` - Configure punishment ladder
- `n!settimeout <strike#> <duration>` - Set timeout durations
- `n!setlogchannel [#channel]` - Set moderation log channel

#### User Management (Admin)
- `n!whitelist add/remove/list @user` - Manage whitelisted users
- `n!strikes @user` - View user strike history
- `n!clearstrikes @user` - Clear user strikes

#### Word Lists (Admin)
- `n!blacklist add/remove/list <word>` - Manage blacklisted words
- `n!whitelistwords add/remove/list <word>` - Manage word exceptions

#### Moderation Commands
- `n!kick @user [reason]` - Kick user from server
- `n!timeout @user <10m/1h/1d> [reason]` - Timeout user
- `n!ban @user [reason]` - Ban user (existing, enhanced)
- `n!mute @user <duration> [reason]` - Mute user (existing)
- `n!unmute @user` - Unmute user (existing)
- `n!purge <amount>` - Purge messages (existing)

#### Information Commands
- `n!help [command]` - Comprehensive command help
- `n!verify <message>` - Advanced toxicity verification with detailed scores
- `n!stats` - Bot statistics (existing)
- `n!ping` - Check bot latency (existing)
- `n!serverinfo` - Server information (existing)
- `n!userinfo` - User information (existing)

#### Feature Toggles
- `n!toggle image` - Image OCR detection
- `n!toggle context` - Historical context analysis
- `n!toggle antibypass` - Multi-line detection
- `n!toggle deepcontext` - Smart reply scanning
- `n!toggle spam` - Spam protection
- `n!toggle links` - Link protection
- `n!toggle mentions` - Mention spam protection
- `n!toggle automod` - Auto-moderation

## Project Architecture
```
src/
├── commands/        # Bot commands (admin, moderation, info, owner)
│   ├── admin/       # 15+ admin commands
│   ├── moderation/  # Moderation tools
│   ├── info/        # Information & verification
│   └── owner/       # Owner-only commands
├── config/          # Configuration and constants
├── database/        # SQLite database management
├── detectors/       # Content detection modules
├── event/           # Event handlers for Discord events
├── handlers/        # Handler implementations (copied from event/)
├── services/        # External API services
├── server/          # Express health check server
└── utils/           # Utility functions
```

## Required Environment Variables
The bot requires the following secrets to be configured:

### Essential
- **DISCORD_TOKEN**: Your Discord bot token (required)
  - Get from: https://discord.com/developers/applications
  - Bot needs MESSAGE CONTENT intent enabled

### Optional (Enhances functionality)
- **PERSPECTIVE_API_KEY**: Google Perspective API key for advanced toxicity detection
  - Get from: https://developers.perspectiveapi.com/
  - Bot works without this but toxicity detection is limited to pattern matching
- **BOT_OWNER_ID**: Your Discord user ID (for owner-only commands)
  - Right-click your username in Discord (Developer Mode enabled) → Copy ID

### Configuration (with defaults)
- **PORT**: 5000 (web server port)
- **MAX_ERRORS**: 100
- **GLOBAL_RATE_LIMIT**: 50
- **PER_GUILD_RATE_LIMIT**: 10
- **PER_USER_RATE_LIMIT**: 3
- **DB_DIRECTORY**: ./databases
- **MAX_ENTRIES_PER_DB**: 1000

## How to Run
1. Add your Discord bot token as a secret (DISCORD_TOKEN)
2. (Optional) Add Perspective API key for enhanced toxicity detection
3. The bot will start automatically via the workflow
4. Visit the webview to see the health dashboard at port 5000

## Health Dashboard
The bot runs a web server on port 5000 that provides:
- `/` - Bot status, server count, uptime
- `/health` - Health check endpoint

## Features
- **Auto-moderation**: Configurable punishment system (warn/kick/ban/timeout)
- **Context-aware detection**: Smart analysis of gaming/entertainment context
- **Anti-bypass**: Detects leetspeak and character substitution
- **Spam protection**: Rate limiting and duplicate message detection
- **Image scanning**: OCR-based text detection in images
- **Link protection**: Anti-phishing and suspicious link detection
- **Strike system**: Tracks user violations across servers
- **Punishment ladder**: Escalating punishments based on strike count
- **Customizable thresholds**: Adjust sensitivity from 0-10
- **Word lists**: Custom blacklist and whitelist support
- **Command prefix**: `n!` (configurable in constants.js)

## Advanced Features
- **Verification Command**: Test messages for toxicity before sending
- **Detailed Scoring**: View exact toxicity percentages across 7 categories
- **Pattern Detection**: Multiple detection engines for threats, profanity, explicit content
- **Smart Context Analysis**: Reduces false positives in gaming/entertainment discussions
- **Multi-line Detection**: Catches toxic content split across messages
- **Comprehensive Logging**: Track all moderation actions in designated channel
- **User Whitelist**: Exempt trusted users from detection
- **Strike Tracking**: Full history of user violations with timestamps

## Configuration Examples

### Basic Setup
```
n!enable                    # Enable the system
n!setthreshold 7            # Set to strict mode
n!setstrikes 3              # Allow 3 strikes
n!setlogchannel #mod-logs   # Set log channel
```

### Punishment Ladder
```
n!setpunishment 1 warn      # 1st strike: warning
n!setpunishment 2 timeout   # 2nd strike: timeout
n!setpunishment 3 ban       # 3rd strike: ban
n!settimeout 2 1h           # 2nd strike timeout: 1 hour
```

### Feature Configuration
```
n!toggle image      # Enable image scanning
n!toggle context    # Enable context analysis
n!toggle spam       # Enable spam protection
```

### Word List Management
```
n!blacklist add badword     # Add to blacklist
n!whitelistwords add game   # Add exception
```

## Command Categories

### 🎛️ System Controls (Admin Only)
Essential commands for enabling/disabling and configuring the system.

### ⚙️ Configuration (Admin Only)
Fine-tune detection sensitivity, punishment rules, and logging.

### 👥 User Management (Admin Only)
Manage user whitelists and view/clear strike records.

### 📝 Word Lists (Admin Only)
Custom blacklist and whitelist for context-specific moderation.

### 🔧 Feature Toggles (Admin Only)
Enable/disable specific detection features.

### 🔨 Moderation (Moderator+)
Direct moderation actions (ban, kick, timeout, mute, purge).

### 📊 Information (Everyone)
View stats, verify messages, get help, and check info.

## Troubleshooting

### Bot Not Starting
- Ensure DISCORD_TOKEN is set in secrets
- Check that MESSAGE CONTENT intent is enabled in Discord Developer Portal
- View logs for specific errors

### Commands Not Working
- Verify bot has appropriate permissions in server
- Check that command prefix is `n!`
- Ensure user has required permissions for admin commands

### Toxicity Detection Issues
- Add PERSPECTIVE_API_KEY for enhanced detection
- Adjust threshold with `n!setthreshold`
- Check if user is whitelisted with `n!whitelist list`
- Toggle features with `n!toggle <feature>`

## Development Notes
- All commands use BaseCommand class for consistency
- Event handlers copied to both `event/` and `handlers/` directories
- Database uses SQLite with quick.db wrapper
- Express server binds to 0.0.0.0:5000 for Replit compatibility
- Comprehensive error handling and logging throughout
