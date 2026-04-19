const TICKETS = [
  {
    "ticket_id": "TKT-001",
    "category": "vpn",
    "operating_system": "windows",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["vpn", "connect", "failed", "windows", "network", "disconnect", "timeout", "reconnect"],
    "problem_description": "My VPN keeps disconnecting every few minutes and I can't stay connected for more than 5 minutes at a time. I keep getting a message that says 'VPN connection timed out' and it's making it impossible to do any work. This has been happening since this morning and I have no idea what changed.",
    "resolution_steps": [
      "1. Click the Start menu and type 'VPN settings', then press Enter.",
      "2. Find your VPN connection in the list and click 'Disconnect', then wait 30 seconds.",
      "3. Click 'Connect' again to reconnect to the VPN.",
      "4. If it disconnects again, right-click the VPN connection and choose 'Remove', then re-add it using your company VPN address.",
      "5. Restart your computer and try connecting to the VPN once more."
    ],
    "user_utterances": [
      "my vpn keeps disconnecting",
      "vpn won't stay connected on windows",
      "keep getting vpn timeout error",
      "vpn drops every few minutes"
    ],
    "escalate_if_failed": false,
    "related_categories": ["network", "authentication"],
    "resolution_time_minutes": 30
  },
  {
    "ticket_id": "TKT-002",
    "category": "vpn",
    "operating_system": "macOS",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["vpn", "slow", "mac", "speed", "connection", "laggy", "performance", "internet"],
    "problem_description": "Ever since I connected to the VPN my internet is super slow and everything takes forever to load. It was fine before I turned the VPN on but now even simple websites take like 30 seconds. I need the VPN for work but it makes everything unusable.",
    "resolution_steps": [
      "1. Click the Apple menu in the top left and go to 'System Settings', then 'VPN'.",
      "2. Toggle your VPN off and check if your internet speeds back to normal.",
      "3. If it does, toggle VPN back on and try a different VPN server location if your VPN app allows it.",
      "4. Open your VPN app and look for a 'Split Tunneling' option — turn it on so only work traffic uses the VPN.",
      "5. Contact your IT team if speeds remain slow with split tunneling enabled."
    ],
    "user_utterances": [
      "vpn makes my internet slow on mac",
      "everything is laggy when vpn is on",
      "internet speed drops when i connect to vpn",
      "vpn is killing my connection speed"
    ],
    "escalate_if_failed": false,
    "related_categories": ["network", "software"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-003",
    "category": "vpn",
    "operating_system": "linux",
    "difficulty_level": "high",
    "severity": "P1",
    "keywords": ["vpn", "linux", "install", "broken", "certificate", "error", "connect", "fail", "auth"],
    "problem_description": "I can't connect to the VPN at all on my Linux machine and I'm completely locked out of all company resources. It says 'Certificate verification failed' every single time I try to connect and nothing I've tried has worked. I have a deadline today and I can't access anything I need.",
    "resolution_steps": [
      "1. Open a terminal window by pressing Ctrl+Alt+T.",
      "2. Type 'sudo apt update && sudo apt install --reinstall network-manager-openvpn' and press Enter, then enter your password when asked.",
      "3. Download the latest VPN certificate file from the IT portal using a web browser.",
      "4. Open your VPN settings, remove the old connection, and re-import the new certificate file.",
      "5. Try connecting again. If you still see 'Certificate verification failed', call the IT helpdesk immediately as this may require manual certificate renewal.",
      "6. Do not reuse the old certificate file — always use the freshly downloaded one."
    ],
    "user_utterances": [
      "vpn certificate error on linux",
      "can't connect to vpn keeps saying certificate failed",
      "locked out of everything vpn won't work",
      "vpn auth error on linux machine"
    ],
    "escalate_if_failed": true,
    "related_categories": ["authentication", "network"],
    "resolution_time_minutes": 60
  },
  {
    "ticket_id": "TKT-004",
    "category": "vpn",
    "operating_system": "all",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["vpn", "password", "expired", "login", "reset", "account", "access", "credentials"],
    "problem_description": "I'm trying to log into the VPN but it says my password has expired and I need to change it, but when I try to change it nothing happens. I've been sitting here for 20 minutes trying to get in and I have a meeting in 10 minutes. The screen just goes blank after I type in my new password.",
    "resolution_steps": [
      "1. Close the VPN application completely.",
      "2. Open a web browser and go to your company's password reset portal (ask IT for the link if you don't have it).",
      "3. Follow the steps on the portal to reset your VPN password.",
      "4. Wait 2 minutes for the new password to take effect across all systems.",
      "5. Reopen the VPN application and log in with your new password."
    ],
    "user_utterances": [
      "vpn saying my password expired",
      "can't change my vpn password",
      "vpn login not working after password reset",
      "vpn password change screen goes blank"
    ],
    "escalate_if_failed": false,
    "related_categories": ["authentication", "software"],
    "resolution_time_minutes": 20
  },
  {
    "ticket_id": "TKT-005",
    "category": "authentication",
    "operating_system": "windows",
    "difficulty_level": "high",
    "severity": "P1",
    "keywords": ["locked", "account", "login", "windows", "password", "access", "denied", "unlock"],
    "problem_description": "My Windows account is completely locked and I can't log in at all. I don't know what happened — I just came back from lunch and now it says 'Your account has been locked out' no matter what password I try. I can't get into anything and I have urgent work to do.",
    "resolution_steps": [
      "1. Do not keep trying to log in — more failed attempts can extend the lockout period.",
      "2. Call the IT helpdesk directly and provide your employee ID so they can unlock your account.",
      "3. Once IT confirms your account is unlocked, try logging in with your usual password.",
      "4. If your password has expired, IT will guide you through a secure reset process.",
      "5. After logging in, change your password immediately if prompted and store it somewhere safe.",
      "6. If lockouts keep happening, report it to IT as it could be a security issue."
    ],
    "user_utterances": [
      "my windows account is locked out",
      "can't log in says account locked",
      "locked out of my computer after lunch",
      "windows won't let me in account locked"
    ],
    "escalate_if_failed": true,
    "related_categories": ["vpn", "software"],
    "resolution_time_minutes": 45
  },
  {
    "ticket_id": "TKT-006",
    "category": "authentication",
    "operating_system": "macOS",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["mfa", "two-factor", "authenticator", "mac", "code", "phone", "login", "verify"],
    "problem_description": "My two-factor authentication app on my phone isn't giving me the right codes and I can't log into anything. I changed my phone last week and I think the authenticator didn't transfer over properly. The code I enter is always wrong even though it looks right.",
    "resolution_steps": [
      "1. Check the time on your phone is set to 'Automatic' — go to Settings, General, Date and Time, and turn on 'Set Automatically'.",
      "2. Open your authenticator app and look for a 'Sync' or 'Refresh' option and tap it.",
      "3. Try logging in again with the new code — make sure to use the code before it refreshes (they change every 30 seconds).",
      "4. If it still fails, contact IT to temporarily disable MFA on your account so you can log in.",
      "5. Once logged in, IT will help you re-enroll your new phone in the authenticator system."
    ],
    "user_utterances": [
      "my two factor codes aren't working",
      "authenticator app giving wrong codes on mac",
      "can't login mfa code rejected",
      "changed phone now can't get into my account"
    ],
    "escalate_if_failed": false,
    "related_categories": ["vpn", "software"],
    "resolution_time_minutes": 25
  },
  {
    "ticket_id": "TKT-007",
    "category": "authentication",
    "operating_system": "linux",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["password", "forgot", "reset", "linux", "login", "expired", "change", "credentials"],
    "problem_description": "I forgot my Linux login password and now I can't get into my computer. It's not the most urgent thing in the world but I really need to get in to finish some work. I've tried all the passwords I normally use and none of them are working.",
    "resolution_steps": [
      "1. Contact the IT helpdesk and let them know you need a Linux password reset.",
      "2. IT will verify your identity using your employee ID and may ask a security question.",
      "3. IT will remotely reset your password and send you a temporary one via your company mobile or backup email.",
      "4. Log in with the temporary password when prompted.",
      "5. You will be asked to create a new password immediately — choose something you'll remember and that meets the complexity requirements."
    ],
    "user_utterances": [
      "forgot my linux password",
      "can't log into linux",
      "need to reset my password on linux",
      "locked myself out of linux laptop"
    ],
    "escalate_if_failed": false,
    "related_categories": ["software", "vpn"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-008",
    "category": "authentication",
    "operating_system": "all",
    "difficulty_level": "high",
    "severity": "P1",
    "keywords": ["sso", "single-sign-on", "login", "portal", "broken", "error", "access", "saml", "redirect"],
    "problem_description": "The company login portal is broken and nobody on my team can sign in to anything. It keeps redirecting us in circles and showing an error that says 'SAML authentication failed'. We've tried different browsers and computers and it's the same everywhere. This is affecting the whole department.",
    "resolution_steps": [
      "1. Clear your browser's cache and cookies: go to browser settings, find Privacy or History, and clear all browsing data.",
      "2. Try opening the login portal in a different browser (e.g., if you use Chrome, try Edge or Firefox).",
      "3. Try opening the portal in a private or incognito window.",
      "4. If all of these fail, this is likely a server-side issue — escalate to IT immediately with the exact error message.",
      "5. IT will check the authentication server and may need to restart services.",
      "6. Ask your manager to report the outage through the IT major incident channel so all affected users are tracked."
    ],
    "user_utterances": [
      "login portal is broken for everyone",
      "saml error can't sign in",
      "whole team can't log in",
      "getting redirect loop on company login"
    ],
    "escalate_if_failed": true,
    "related_categories": ["network", "software"],
    "resolution_time_minutes": 90
  },
  {
    "ticket_id": "TKT-009",
    "category": "printer",
    "operating_system": "windows",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["printer", "offline", "windows", "print", "stuck", "queue", "document", "job"],
    "problem_description": "My printer is showing as 'Offline' in Windows even though it's turned on and plugged in. I tried to print something an hour ago and it's still just sitting in the queue not doing anything. I've tried turning the printer off and back on and it didn't help.",
    "resolution_steps": [
      "1. Click the Start menu, type 'Printers & scanners', and press Enter.",
      "2. Click on your printer and then click 'Open print queue'.",
      "3. Click 'Printer' in the menu bar and uncheck 'Use Printer Offline' if it is checked.",
      "4. Right-click any stuck documents in the queue and choose 'Cancel', then wait for the queue to clear.",
      "5. Turn the printer completely off, wait 10 seconds, then turn it back on.",
      "6. Try printing a test page from the 'Printers & scanners' menu."
    ],
    "user_utterances": [
      "printer shows offline but it's on",
      "print job stuck in queue",
      "printer not printing on windows",
      "can't print says printer offline"
    ],
    "escalate_if_failed": false,
    "related_categories": ["network", "software"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-010",
    "category": "printer",
    "operating_system": "macOS",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["printer", "driver", "mac", "install", "not found", "add", "print", "setup"],
    "problem_description": "I got a new MacBook and now I can't find the office printer anywhere. On my old laptop it just worked but on this one when I try to print it doesn't show up in the list at all. My colleague's Mac finds it just fine so it's definitely something with mine.",
    "resolution_steps": [
      "1. Click the Apple menu, go to 'System Settings', then scroll down to 'Printers & Scanners'.",
      "2. Click the '+' button at the bottom of the printer list to add a new printer.",
      "3. Wait a moment for printers to appear on the network. If yours shows up, click it and then click 'Add'.",
      "4. If it doesn't appear, ask your IT team for the printer's IP address and click 'IP' tab in the Add Printer window to enter it manually.",
      "5. Make sure you are connected to the office Wi-Fi or network, not a guest network."
    ],
    "user_utterances": [
      "can't find the printer on my new mac",
      "office printer not showing up on macbook",
      "printer missing from list on mac",
      "how do i add the printer on my mac"
    ],
    "escalate_if_failed": false,
    "related_categories": ["network", "software"],
    "resolution_time_minutes": 20
  },
  {
    "ticket_id": "TKT-011",
    "category": "printer",
    "operating_system": "linux",
    "difficulty_level": "high",
    "severity": "P2",
    "keywords": ["printer", "linux", "cups", "driver", "install", "error", "print", "setup", "permission"],
    "problem_description": "I've been trying to get the office printer working on my Linux computer for two days and I can't figure it out. It shows up in the list but when I try to print anything it just says 'Error' and nothing comes out. My boss keeps asking me for printed reports and I'm stuck.",
    "resolution_steps": [
      "1. Open a terminal and type 'sudo systemctl status cups' to check if the printing service is running.",
      "2. If it says 'inactive', type 'sudo systemctl start cups' and press Enter.",
      "3. Open a browser and go to 'http://localhost:631' to open the CUPS printer manager.",
      "4. Click 'Printers', find your printer, and click 'Delete Printer', then re-add it using the 'Add Printer' button.",
      "5. Select the correct driver for your printer model — if unsure, contact IT for the exact driver name.",
      "6. Print a test page from the CUPS interface to confirm it's working."
    ],
    "user_utterances": [
      "printer shows up but won't print on linux",
      "cups error when trying to print",
      "linux printer just says error",
      "been trying to print on linux for days"
    ],
    "escalate_if_failed": true,
    "related_categories": ["software", "network"],
    "resolution_time_minutes": 75
  },
  {
    "ticket_id": "TKT-012",
    "category": "printer",
    "operating_system": "all",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["printer", "paper", "jam", "stuck", "clear", "tray", "feed", "jammed"],
    "problem_description": "The printer in the main office has a paper jam and no one can use it. There's a piece of paper stuck inside and we tried to pull it out but it tore and now part of it is still in there somewhere. Every time anyone tries to print it just beeps and flashes.",
    "resolution_steps": [
      "1. Turn the printer off completely using the power button and unplug it from the wall.",
      "2. Open all the printer doors and trays — check the main tray, rear tray, and any access panels on the back or side.",
      "3. Slowly and gently pull out any visible paper — never yank it as torn pieces can jam sensors.",
      "4. Use a flashlight to check for any torn pieces still inside — remove all of them before closing the covers.",
      "5. Close all doors and trays, plug the printer back in, and turn it on.",
      "6. If the error light still flashes, call IT as a piece may be stuck near the rollers and needs professional removal."
    ],
    "user_utterances": [
      "paper jam in the office printer",
      "printer is jammed and beeping",
      "paper stuck in printer can't clear it",
      "printer keeps beeping won't print"
    ],
    "escalate_if_failed": false,
    "related_categories": ["hardware", "software"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-013",
    "category": "hardware",
    "operating_system": "windows",
    "difficulty_level": "high",
    "severity": "P1",
    "keywords": ["blue", "screen", "crash", "bsod", "windows", "restart", "error", "death", "freeze"],
    "problem_description": "My computer keeps getting a blue screen and restarting itself over and over. It shows a message that says 'CRITICAL_PROCESS_DIED' and then restarts and does it again. I can barely get logged in before it crashes and I've lost all the work I had open. This started happening after IT pushed an update yesterday.",
    "resolution_steps": [
      "1. When the computer starts up, hold the F8 key or Shift key to access the boot menu and choose 'Safe Mode'.",
      "2. Once in Safe Mode, click Start, type 'Device Manager', and look for any devices with a yellow warning triangle.",
      "3. Right-click any flagged device and choose 'Roll Back Driver' if available.",
      "4. If the crash started after a Windows update, go to Settings, Update & Security, View Update History, and click 'Uninstall Updates' to remove the most recent one.",
      "5. Restart your computer normally and see if the blue screen returns.",
      "6. If blue screens continue, contact IT immediately — your hard drive or RAM may be failing and data could be at risk."
    ],
    "user_utterances": [
      "blue screen keeps coming up",
      "computer crashes and restarts itself",
      "getting bsod over and over",
      "windows crashing after update"
    ],
    "escalate_if_failed": true,
    "related_categories": ["software", "storage"],
    "resolution_time_minutes": 90
  },
  {
    "ticket_id": "TKT-014",
    "category": "hardware",
    "operating_system": "macOS",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["screen", "flickering", "mac", "display", "monitor", "flash", "external", "hdmi"],
    "problem_description": "My external monitor keeps flickering and flashing whenever I move windows around or scroll. It started happening randomly this week and it's giving me a headache. The built-in MacBook screen is fine, it's only the external monitor that's doing it.",
    "resolution_steps": [
      "1. Unplug the HDMI or display cable from both your Mac and the monitor, then plug it back in firmly.",
      "2. Try a different cable if you have one available — cables are often the cause of flickering.",
      "3. Click the Apple menu, go to 'System Settings', then 'Displays', and change the refresh rate to a different option (e.g., try 60Hz instead of higher).",
      "4. Move the cable so it doesn't bend sharply near the connectors — a damaged cable can cause flickering.",
      "5. If the issue persists with a new cable, the monitor's port or the Mac's video output may need hardware inspection by IT."
    ],
    "user_utterances": [
      "my monitor keeps flickering on mac",
      "external display flashing on macbook",
      "screen keeps flashing when i scroll",
      "monitor going crazy flickering"
    ],
    "escalate_if_failed": false,
    "related_categories": ["software", "audio"],
    "resolution_time_minutes": 30
  },
  {
    "ticket_id": "TKT-015",
    "category": "hardware",
    "operating_system": "linux",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["keyboard", "linux", "keys", "not working", "stuck", "input", "typing", "broken"],
    "problem_description": "Several keys on my laptop keyboard have stopped working on my Linux machine. The 'E' key, the space bar, and the arrow keys all don't respond when I press them. I've tried cleaning around the keys but it hasn't helped. It makes typing almost impossible.",
    "resolution_steps": [
      "1. Open a terminal and type 'xev' to check if key presses are being detected by the system at all.",
      "2. Press each broken key while xev is running — if no output appears, the issue is hardware; if output appears, it's a software/driver issue.",
      "3. If it's a driver issue, type 'sudo dpkg-reconfigure keyboard-configuration' and follow the prompts to reset the keyboard layout.",
      "4. Restart your computer and test the keys again.",
      "5. If keys are still unresponsive after the driver fix, the keyboard hardware may be physically damaged and will need IT to assess replacement."
    ],
    "user_utterances": [
      "some keys on my keyboard stopped working",
      "spacebar and e key not working on linux",
      "keyboard broken on linux laptop",
      "can't type properly keys not responding"
    ],
    "escalate_if_failed": false,
    "related_categories": ["software", "audio"],
    "resolution_time_minutes": 35
  },
  {
    "ticket_id": "TKT-016",
    "category": "hardware",
    "operating_system": "all",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["mouse", "scroll", "wheel", "not working", "click", "pointer", "cursor", "usb"],
    "problem_description": "The scroll wheel on my mouse stopped working. I can still click and move the cursor around but whenever I try to scroll on a page nothing happens. It's not the end of the world but scrolling through long documents manually is really annoying.",
    "resolution_steps": [
      "1. Unplug the mouse from the USB port and plug it into a different USB port on your computer.",
      "2. Clean the scroll wheel by blowing compressed air around it to remove any dust or debris.",
      "3. Open your system's mouse settings and check if scrolling is enabled and set to a number of lines greater than zero.",
      "4. Try the mouse on a different computer to see if the scroll wheel works there — if it does, the issue is with your computer's settings.",
      "5. If the scroll wheel doesn't work on another computer either, the mouse hardware is likely faulty and needs to be replaced — request a replacement from IT."
    ],
    "user_utterances": [
      "mouse scroll wheel not working",
      "can't scroll with my mouse",
      "scroll wheel broken on my mouse",
      "mouse wheel does nothing"
    ],
    "escalate_if_failed": false,
    "related_categories": ["software", "hardware"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-017",
    "category": "email",
    "operating_system": "windows",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["email", "outlook", "not sending", "stuck", "outbox", "windows", "send", "frozen"],
    "problem_description": "My emails are stuck in the Outbox and won't send. I've sent about 10 emails this morning and none of them have actually gone out. When I look in Outbox they're all just sitting there with a little clock icon next to them. My clients are waiting for replies and I'm really stressed.",
    "resolution_steps": [
      "1. Close Outlook completely — right-click the Outlook icon in the taskbar and choose 'Close window'.",
      "2. Reopen Outlook and check if the emails start sending automatically.",
      "3. If they're still stuck, click 'Send/Receive' in the top menu, then click 'Send All'.",
      "4. If emails remain in Outbox, open each one and check if any has an attachment that is too large (over 25MB is often blocked).",
      "5. Try moving the emails from Outbox to Drafts by dragging them, then send them one at a time.",
      "6. If the problem continues, go to File, Account Settings, and verify your email account is connected correctly."
    ],
    "user_utterances": [
      "emails stuck in outbox won't send",
      "outlook not sending my emails",
      "emails just sitting in outbox",
      "can't send email from outlook on windows"
    ],
    "escalate_if_failed": false,
    "related_categories": ["network", "software"],
    "resolution_time_minutes": 25
  },
  {
    "ticket_id": "TKT-018",
    "category": "email",
    "operating_system": "macOS",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["email", "signature", "mac", "missing", "disappeared", "mail", "setup", "format"],
    "problem_description": "My email signature has completely disappeared from the Mail app on my Mac. I spent a long time setting it up with the company logo and all my contact details and now it's just gone. I didn't change anything and I don't know why it disappeared.",
    "resolution_steps": [
      "1. Open the Mail app, click 'Mail' in the top menu, and choose 'Settings'.",
      "2. Click the 'Signatures' tab at the top.",
      "3. Check if your signature is still listed on the left — if it is, click it and verify the content is still there.",
      "4. If the signature is missing, click the '+' button to create a new one and retype your signature details.",
      "5. Drag the new signature to your email account on the left side so it is assigned to that account.",
      "6. Set it as the default by choosing it from the 'Choose Signature' dropdown."
    ],
    "user_utterances": [
      "my email signature disappeared on mac",
      "signature gone from mail app",
      "email signature missing on macbook",
      "lost my signature in mail app"
    ],
    "escalate_if_failed": false,
    "related_categories": ["software", "authentication"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-019",
    "category": "email",
    "operating_system": "linux",
    "difficulty_level": "high",
    "severity": "P1",
    "keywords": ["email", "linux", "server", "imap", "not loading", "thunderbird", "connect", "error", "fetch"],
    "problem_description": "I can't receive or send any emails on my Linux computer and it's been like this since yesterday. Thunderbird keeps saying 'Could not connect to the server' and all my emails have stopped coming in. I work in customer support and missing emails is a massive problem — some could be from angry customers with urgent issues.",
    "resolution_steps": [
      "1. Check you have an active internet connection by opening a browser and loading any website.",
      "2. Open Thunderbird, click the menu (three lines), go to 'Account Settings', and verify the incoming server address, port, and SSL settings match what IT provided.",
      "3. Common settings: IMAP port 993 with SSL, SMTP port 587 with STARTTLS.",
      "4. Delete and re-enter your email password in Thunderbird — it may have become corrupted.",
      "5. Check if your company's email server is down by asking a colleague on a different machine if they can access email.",
      "6. If server settings are correct and the server is up, escalate to IT immediately — your account may have been locked or the certificate may have expired."
    ],
    "user_utterances": [
      "thunderbird can't connect to email server",
      "not receiving any emails on linux",
      "email completely stopped working on linux",
      "thunderbird says server error"
    ],
    "escalate_if_failed": true,
    "related_categories": ["network", "authentication"],
    "resolution_time_minutes": 60
  },
  {
    "ticket_id": "TKT-020",
    "category": "email",
    "operating_system": "all",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["spam", "phishing", "email", "filter", "junk", "suspicious", "block", "report"],
    "problem_description": "I've been getting flooded with spam emails and phishing attempts all week and it's out of control. Some of them look really convincing and I'm worried my colleagues might click on bad links. My inbox is buried and I'm spending an hour a day just deleting junk.",
    "resolution_steps": [
      "1. Do not click any links or open any attachments in suspicious emails.",
      "2. Select all spam emails by checking the first one, then Shift-clicking the last — then right-click and choose 'Mark as Junk' or 'Move to Spam'.",
      "3. Report the phishing emails to IT by forwarding them to the IT security email address (ask IT for this address if you don't have it).",
      "4. Ask IT to enable stronger spam filtering on your account.",
      "5. Unsubscribe from any legitimate mailing lists you no longer want using the unsubscribe link at the bottom of those emails."
    ],
    "user_utterances": [
      "getting tons of spam emails",
      "inbox full of phishing emails",
      "too much junk mail can't find real emails",
      "spam flooding my inbox every day"
    ],
    "escalate_if_failed": false,
    "related_categories": ["authentication", "network"],
    "resolution_time_minutes": 30
  },
  {
    "ticket_id": "TKT-021",
    "category": "software",
    "operating_system": "windows",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["software", "crash", "windows", "application", "freeze", "not responding", "restart", "update"],
    "problem_description": "The main application I use for my job keeps crashing every time I try to open a specific file. As soon as I double-click the file it loads for a second, shows a spinning wheel, and then just closes with no error message. I need this file for a presentation tomorrow morning.",
    "resolution_steps": [
      "1. Right-click the application icon, choose 'Run as administrator', and then try opening the file again.",
      "2. Check if the file is located on a network drive — if so, copy it to your Desktop first and try opening it from there.",
      "3. Open the application first, then use File > Open to navigate to the file instead of double-clicking it.",
      "4. Check if there are pending updates for the application — open it without the file, go to Help > Check for Updates.",
      "5. If it still crashes, right-click the application in the Start menu, choose 'Uninstall', then reinstall it from the company software portal.",
      "6. Contact IT if reinstalling does not resolve the crash."
    ],
    "user_utterances": [
      "app keeps crashing when i open a file",
      "software crashes every time i use it",
      "program freezes then closes on windows",
      "app not responding when opening files"
    ],
    "escalate_if_failed": false,
    "related_categories": ["storage", "hardware"],
    "resolution_time_minutes": 35
  },
  {
    "ticket_id": "TKT-022",
    "category": "software",
    "operating_system": "macOS",
    "difficulty_level": "high",
    "severity": "P1",
    "keywords": ["software", "mac", "install", "blocked", "gatekeeper", "cannot", "open", "security", "unverified"],
    "problem_description": "I downloaded a critical work application from our company portal but my Mac won't let me open it at all. It says 'This app cannot be opened because the developer cannot be verified' and there's no option to override it. I need this software to do my job and IT said it's safe to install.",
    "resolution_steps": [
      "1. Click the Apple menu and go to 'System Settings', then 'Privacy & Security'.",
      "2. Scroll down to the Security section — you should see a message about the blocked app with an 'Open Anyway' button.",
      "3. Click 'Open Anyway' and enter your Mac password when prompted.",
      "4. The app should now open — if it asks for confirmation one more time, click 'Open'.",
      "5. If 'Open Anyway' is not visible, right-click (or Control-click) the app icon in Finder and choose 'Open' from the menu, then click 'Open' in the dialog that appears.",
      "6. If neither method works, contact IT — your Mac may have a stricter enterprise security policy that only IT can adjust."
    ],
    "user_utterances": [
      "mac won't let me open the app",
      "says developer cannot be verified",
      "can't install work software on mac blocked",
      "app blocked by mac security"
    ],
    "escalate_if_failed": true,
    "related_categories": ["authentication", "hardware"],
    "resolution_time_minutes": 50
  },
  {
    "ticket_id": "TKT-023",
    "category": "software",
    "operating_system": "linux",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["software", "linux", "update", "apt", "install", "package", "upgrade", "terminal"],
    "problem_description": "I'm trying to install an application on Linux and it keeps giving me an error that says 'Unable to locate package'. My colleague did the exact same steps on their machine and it worked fine but mine just refuses to install the package. I'm new to Linux so I'm not sure what's wrong.",
    "resolution_steps": [
      "1. Open a terminal window by pressing Ctrl+Alt+T.",
      "2. Type 'sudo apt update' and press Enter — this updates the list of available packages.",
      "3. Enter your password when prompted and wait for the update to complete.",
      "4. Try installing the package again by typing 'sudo apt install [package-name]' with the exact package name.",
      "5. If it still says 'Unable to locate package', ask IT for the exact package name or whether a different repository needs to be added."
    ],
    "user_utterances": [
      "can't install package on linux",
      "apt saying unable to locate package",
      "linux won't install the software",
      "package not found error on linux"
    ],
    "escalate_if_failed": false,
    "related_categories": ["network", "storage"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-024",
    "category": "software",
    "operating_system": "all",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["license", "software", "expired", "activation", "key", "trial", "purchase", "unlock"],
    "problem_description": "My software license has expired and now the program is running in a limited mode where I can't save anything. It's showing a popup every few minutes saying 'Your license has expired, please renew to continue'. I don't know who to contact to get the license renewed.",
    "resolution_steps": [
      "1. Note down the software name and version number (usually found under Help > About).",
      "2. Contact your IT helpdesk or IT purchasing team with the software name and your employee ID.",
      "3. IT will either provide a new license key or renew your subscription through the company's licensing portal.",
      "4. Once IT provides a new key, open the software, go to Help > Enter License Key (or Activation), and enter the new key exactly as given.",
      "5. Restart the software to confirm it is now fully activated and the popup is gone."
    ],
    "user_utterances": [
      "software license expired can't save",
      "getting license expired popup all the time",
      "program running in trial mode license gone",
      "need to renew my software license"
    ],
    "escalate_if_failed": false,
    "related_categories": ["authentication", "software"],
    "resolution_time_minutes": 25
  },
  {
    "ticket_id": "TKT-025",
    "category": "network",
    "operating_system": "windows",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["wifi", "internet", "windows", "dropping", "slow", "disconnect", "network", "reconnect"],
    "problem_description": "My Wi-Fi keeps dropping on my Windows laptop and reconnecting every couple of minutes. The little Wi-Fi icon in the taskbar keeps going grey and coming back. Other people in the office don't seem to have this problem — it's just my laptop. It's really disrupting video calls.",
    "resolution_steps": [
      "1. Right-click the Wi-Fi icon in the bottom-right taskbar and choose 'Open Network & Internet Settings'.",
      "2. Click 'Change adapter options', right-click your Wi-Fi adapter, and choose 'Properties'.",
      "3. Click 'Configure', go to the 'Power Management' tab, and uncheck 'Allow the computer to turn off this device to save power'.",
      "4. Click OK, then restart your computer.",
      "5. If Wi-Fi still drops, right-click the Start menu, choose 'Windows PowerShell (Admin)', type 'netsh winsock reset' and press Enter, then restart again.",
      "6. If the issue continues, IT may need to update your Wi-Fi adapter driver."
    ],
    "user_utterances": [
      "wifi keeps dropping on my windows laptop",
      "internet disconnects every few minutes",
      "wifi going in and out on my laptop",
      "losing wifi connection randomly"
    ],
    "escalate_if_failed": false,
    "related_categories": ["vpn", "hardware"],
    "resolution_time_minutes": 30
  },
  {
    "ticket_id": "TKT-026",
    "category": "network",
    "operating_system": "macOS",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["dns", "mac", "website", "loading", "slow", "network", "resolve", "internet", "browser"],
    "problem_description": "Certain websites won't load on my Mac even though my internet seems fine. I can load Google and YouTube no problem but specific work websites just show 'This site can't be reached' or take forever to load. My colleague on the same Wi-Fi has no issues at all.",
    "resolution_steps": [
      "1. Click the Apple menu, go to 'System Settings', then 'Wi-Fi', and click 'Details' next to your connected network.",
      "2. Click 'DNS' and look at the DNS server list.",
      "3. Click '+' and add '8.8.8.8' and '8.8.4.4' as DNS servers, then click OK.",
      "4. Open a terminal (search for 'Terminal' in Spotlight) and type 'sudo dscacheutil -flushcache' then press Enter.",
      "5. Try loading the problem websites again in a fresh browser window."
    ],
    "user_utterances": [
      "some websites won't load on my mac",
      "certain sites can't be reached",
      "work website not loading on mac",
      "internet works but specific sites won't open"
    ],
    "escalate_if_failed": false,
    "related_categories": ["vpn", "software"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-027",
    "category": "network",
    "operating_system": "linux",
    "difficulty_level": "high",
    "severity": "P1",
    "keywords": ["network", "linux", "ethernet", "interface", "down", "no connection", "cable", "ip", "address"],
    "problem_description": "My Linux workstation has completely lost its network connection and shows no network interfaces at all. I can't access any company resources, the internet, or even the internal file server. I've checked the cable and it's plugged in properly — the light on the port is on but nothing works. This machine runs critical batch jobs that have now stopped.",
    "resolution_steps": [
      "1. Open a terminal and type 'ip a' to list all network interfaces and check their status.",
      "2. If the ethernet interface (usually 'eth0' or 'ens33') shows 'DOWN', type 'sudo ip link set eth0 up' (replace eth0 with your interface name).",
      "3. Type 'sudo dhclient eth0' to request a new IP address.",
      "4. Type 'ping 8.8.8.8' to test if connectivity is restored.",
      "5. If the interface is not listed at all, type 'sudo lshw -class network' to check if the hardware is detected.",
      "6. If hardware is not detected, escalate to IT immediately — the network card may have failed and the critical batch jobs need to be redirected to another server."
    ],
    "user_utterances": [
      "linux has no network connection at all",
      "ethernet not working on linux workstation",
      "linux machine completely offline",
      "no network interface showing on linux"
    ],
    "escalate_if_failed": true,
    "related_categories": ["hardware", "vpn"],
    "resolution_time_minutes": 90
  },
  {
    "ticket_id": "TKT-028",
    "category": "network",
    "operating_system": "all",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["network", "shared", "drive", "mapped", "missing", "access", "server", "files", "connect"],
    "problem_description": "The shared network drive I use every day has disappeared and I can't find any of the team files. I've restarted my computer twice and it's still not there. My colleagues can all access it fine but on my machine it's just gone. I need those files to do my work.",
    "resolution_steps": [
      "1. Check if you are connected to the office network or VPN (if working remotely) — shared drives require network access.",
      "2. Open File Explorer (Windows), Finder (Mac), or the Files app (Linux) and try typing the server path directly, e.g. '\\\\servername\\share' on Windows.",
      "3. If you can access it by typing the path, right-click the drive and choose 'Map Network Drive' (Windows) or 'Connect to Server' (Mac) to permanently add it.",
      "4. On Windows, go to This PC and check if the drive is listed under Network Locations but just not showing in the sidebar.",
      "5. Contact IT if the drive is completely inaccessible — your network permissions may have been accidentally changed."
    ],
    "user_utterances": [
      "shared drive disappeared",
      "network drive missing from my computer",
      "can't find the team shared folder",
      "shared files gone from my machine"
    ],
    "escalate_if_failed": false,
    "related_categories": ["storage", "authentication"],
    "resolution_time_minutes": 20
  },
  {
    "ticket_id": "TKT-029",
    "category": "audio",
    "operating_system": "windows",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["audio", "sound", "windows", "no sound", "muted", "output", "speaker", "headset", "volume"],
    "problem_description": "I have no sound at all coming from my computer. I need to listen to a training video and nothing is coming out of the speakers or my headset. I've checked the volume and it's not muted but there's still nothing. This was working fine yesterday morning.",
    "resolution_steps": [
      "1. Right-click the speaker icon in the bottom-right taskbar and choose 'Open Sound settings'.",
      "2. Under 'Output', make sure the correct device is selected (e.g., 'Speakers' or 'Headset') — Windows sometimes switches to a wrong device automatically.",
      "3. Click on the selected output device and make sure the volume slider is not at zero.",
      "4. Right-click the speaker icon again and choose 'Troubleshoot sound problems' and follow the automated steps.",
      "5. Unplug and re-plug your headset if you're using one — try a different USB port.",
      "6. Restart your computer and check if sound is restored."
    ],
    "user_utterances": [
      "no sound coming from my computer",
      "audio stopped working on windows",
      "speakers not working volume is up",
      "headset has no sound on windows"
    ],
    "escalate_if_failed": false,
    "related_categories": ["hardware", "software"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-030",
    "category": "audio",
    "operating_system": "macOS",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["microphone", "mac", "teams", "zoom", "not working", "audio", "call", "muted", "input"],
    "problem_description": "My microphone isn't working on video calls on my Mac. I can hear everyone fine but they can't hear me at all. I've unmuted myself in the call and it still doesn't pick up my voice. I've tried Microsoft Teams and Zoom and neither of them can hear me. I have important calls all day.",
    "resolution_steps": [
      "1. Click the Apple menu, go to 'System Settings', then 'Privacy & Security', then 'Microphone'.",
      "2. Make sure Teams and Zoom both have the toggle switched ON — if not, turn them on.",
      "3. Go back to 'System Settings', then 'Sound', click the 'Input' tab, and make sure your microphone is selected and the input volume is not at zero.",
      "4. Speak into the microphone and check that the input level meter moves.",
      "5. In your video call app, go to the audio settings within the app and confirm the correct microphone is selected.",
      "6. Restart the video call app and try again."
    ],
    "user_utterances": [
      "microphone not working on mac",
      "people can't hear me on zoom",
      "mic not picking up voice on teams mac",
      "no microphone on video calls macbook"
    ],
    "escalate_if_failed": false,
    "related_categories": ["hardware", "software"],
    "resolution_time_minutes": 20
  },
  {
    "ticket_id": "TKT-031",
    "category": "audio",
    "operating_system": "linux",
    "difficulty_level": "high",
    "severity": "P2",
    "keywords": ["audio", "linux", "pulseaudio", "pipewire", "no sound", "driver", "broken", "crackling", "distorted"],
    "problem_description": "Audio on my Linux machine is completely broken. I either get no sound at all or it comes out as a horrible crackling distorted noise. I've tried restarting the computer several times and it sometimes works for a few minutes then breaks again. I use this machine for screen recording tutorials and this is making my work impossible.",
    "resolution_steps": [
      "1. Open a terminal and type 'pulseaudio --kill' then 'pulseaudio --start' to restart the audio service.",
      "2. If that doesn't work, type 'systemctl --user restart pipewire' to restart PipeWire if your system uses it.",
      "3. Type 'aplay -l' to list audio devices and verify your sound card is detected.",
      "4. Type 'alsamixer' in the terminal, use arrow keys to check that 'Master' and 'PCM' levels are not muted or at zero (press M to unmute).",
      "5. If crackling persists, type 'sudo nano /etc/pulse/daemon.conf' and find 'default-sample-rate' — change it to '44100', save, and restart PulseAudio.",
      "6. If none of these work, escalate to IT — your audio driver may need to be reinstalled."
    ],
    "user_utterances": [
      "audio broken on linux crackling noise",
      "no sound on linux machine",
      "pulseaudio not working",
      "sound crackles and distorts on linux"
    ],
    "escalate_if_failed": true,
    "related_categories": ["hardware", "software"],
    "resolution_time_minutes": 75
  },
  {
    "ticket_id": "TKT-032",
    "category": "audio",
    "operating_system": "all",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["headset", "echo", "audio", "feedback", "call", "hear", "myself", "loop", "mic"],
    "problem_description": "I can hear myself talking in my headset during calls which is really distracting. There's about a half-second delay and I can hear everything I say echoed back to me. My colleagues are complaining that they can also hear an echo on their end. It started happening when I switched to this new headset.",
    "resolution_steps": [
      "1. Check that 'Listen to this device' or 'Microphone monitoring' is turned off in your audio settings — this is a common cause of hearing yourself.",
      "2. Lower the microphone input volume in your system audio settings — a volume that is too high causes echo feedback.",
      "3. In your video call app settings (Teams, Zoom, etc.), turn on 'Echo Cancellation' or 'Noise Suppression' if available.",
      "4. Move your microphone further from your speakers, or use the headset mic closer to your mouth rather than relying on a desk microphone.",
      "5. If on a call, ask everyone else to mute when not speaking — if the echo disappears, it may be coming from someone else's setup."
    ],
    "user_utterances": [
      "i can hear myself talking on calls",
      "there's an echo in my headset",
      "my voice echoes back to me",
      "colleagues hearing echo on calls"
    ],
    "escalate_if_failed": false,
    "related_categories": ["hardware", "network"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-033",
    "category": "storage",
    "operating_system": "windows",
    "difficulty_level": "high",
    "severity": "P1",
    "keywords": ["storage", "disk", "full", "windows", "space", "out of", "drive", "save", "files"],
    "problem_description": "My computer is completely out of storage space and I can't save anything anymore. I'm getting a warning that says 'Your disk is almost full' and now files I'm working on won't save. My hard drive is showing only 200MB free. I have project files I absolutely cannot lose.",
    "resolution_steps": [
      "1. Do not restart your computer until you have freed up space — unsaved files may be in temporary locations.",
      "2. Click the Start menu, type 'Disk Cleanup', right-click and 'Run as administrator'.",
      "3. Select drive C: and let it scan, then check all the boxes (Temporary files, Recycle Bin, etc.) and click OK.",
      "4. Open File Explorer, navigate to your Downloads folder, and delete any large files you no longer need.",
      "5. Check the Recycle Bin on your Desktop — right-click and choose 'Empty Recycle Bin' to permanently free that space.",
      "6. Contact IT immediately to request additional storage or a drive upgrade — continuing to work with under 1GB free risks data corruption."
    ],
    "user_utterances": [
      "disk is full can't save files",
      "out of storage space on windows",
      "hard drive almost full warning",
      "can't save anything no space left"
    ],
    "escalate_if_failed": true,
    "related_categories": ["software", "hardware"],
    "resolution_time_minutes": 60
  },
  {
    "ticket_id": "TKT-034",
    "category": "storage",
    "operating_system": "macOS",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["icloud", "mac", "sync", "storage", "files", "not syncing", "desktop", "documents", "cloud"],
    "problem_description": "My files aren't syncing to iCloud properly on my Mac. I saved a document to my Desktop yesterday and when I checked on my other Mac it wasn't there. The iCloud icon in the menu bar has a spinning wheel that never goes away and some files have a cloud icon with a line through it.",
    "resolution_steps": [
      "1. Click the Apple menu and go to 'System Settings', then click your name at the top, then 'iCloud'.",
      "2. Make sure 'iCloud Drive' is turned on and that 'Desktop & Documents Folders' is enabled.",
      "3. Click the iCloud icon in the menu bar — if it shows an error, click 'Fix Issue' and follow the steps.",
      "4. Sign out of iCloud completely (System Settings > Your Name > Sign Out) and sign back in.",
      "5. Ensure your Mac has enough free storage — iCloud cannot sync if the local drive is nearly full.",
      "6. Wait 15 minutes after signing back in for sync to complete before checking on the other device."
    ],
    "user_utterances": [
      "icloud not syncing files on mac",
      "files not showing up on other mac",
      "icloud spinning forever not syncing",
      "documents not syncing to icloud"
    ],
    "escalate_if_failed": false,
    "related_categories": ["network", "software"],
    "resolution_time_minutes": 30
  },
  {
    "ticket_id": "TKT-035",
    "category": "storage",
    "operating_system": "linux",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["storage", "linux", "permissions", "read-only", "cannot write", "mount", "disk", "save", "error"],
    "problem_description": "I can't write or save any files to my work USB drive on my Linux machine. It lets me read the files that are already on it but when I try to copy something to it or save a new file I get an error that says 'Read-only file system'. I need to transfer some large files using this drive today.",
    "resolution_steps": [
      "1. Open a terminal and type 'lsblk' to identify your USB drive (it will likely be listed as 'sdb' or 'sdc').",
      "2. Type 'dmesg | tail -20' and look for any errors about the drive — a 'write-protect' message means the drive is physically locked.",
      "3. Check the USB drive itself — many USB drives have a small physical write-protect switch on the side. Slide it to the unlocked position.",
      "4. Unmount and remount the drive: type 'sudo umount /dev/sdb1' then 'sudo mount /dev/sdb1 /mnt/usb'.",
      "5. Try copying a small test file to the drive to confirm it is now writable.",
      "6. If still read-only, the drive filesystem may be corrupted — type 'sudo fsck /dev/sdb1' to check and repair it."
    ],
    "user_utterances": [
      "can't save files to usb on linux",
      "usb drive is read only on linux",
      "getting read only filesystem error",
      "linux won't let me write to usb"
    ],
    "escalate_if_failed": false,
    "related_categories": ["hardware", "software"],
    "resolution_time_minutes": 25
  },
  {
    "ticket_id": "TKT-036",
    "category": "storage",
    "operating_system": "all",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["recycle", "bin", "deleted", "restore", "file", "missing", "recover", "trash", "accidentally"],
    "problem_description": "I accidentally deleted an important file and I'm hoping I can get it back. I didn't realize it was the only copy until after I emptied the Recycle Bin. It was a spreadsheet with a month's worth of data and I'm panicking a bit. Is there any way to recover it?",
    "resolution_steps": [
      "1. Stop using the computer as much as possible — continuing to use it can overwrite the deleted file.",
      "2. Check the Recycle Bin or Trash first — if it's there, right-click and choose 'Restore'.",
      "3. If the Recycle Bin was emptied, check if the file was saved on a shared or cloud drive — it may still be in a version history.",
      "4. On Windows, right-click the folder where the file was and choose 'Restore previous versions' to see if Windows has a backup.",
      "5. On Mac, open Time Machine if it is configured and browse to the folder before the deletion.",
      "6. Contact IT immediately — they may be able to restore the file from a recent backup if you act quickly."
    ],
    "user_utterances": [
      "i deleted an important file by accident",
      "accidentally emptied recycle bin need file back",
      "deleted file can i recover it",
      "important file gone from trash"
    ],
    "escalate_if_failed": false,
    "related_categories": ["software", "hardware"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-037",
    "category": "battery",
    "operating_system": "windows",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["battery", "draining", "windows", "laptop", "fast", "life", "charge", "power", "dying"],
    "problem_description": "My Windows laptop battery is draining incredibly fast. It used to last all day but now it's dead within 2 hours even when I'm not doing anything intensive. I'm constantly having to sit near a power outlet which is really limiting where I can work. The battery health app says it's fine.",
    "resolution_steps": [
      "1. Click the Start menu, go to 'Settings', then 'System', then 'Power & Battery'.",
      "2. Click 'Battery usage' to see which apps are consuming the most power and close any you don't need.",
      "3. Under 'Power mode', change to 'Battery saver' or 'Balanced' instead of 'Best performance'.",
      "4. Reduce your screen brightness using the slider in the Power settings — the screen is often the biggest power drain.",
      "5. Turn off Bluetooth and Wi-Fi when not in use by clicking the quick settings panel in the bottom-right corner.",
      "6. If battery life is still under 3 hours after all these steps, contact IT to assess battery replacement."
    ],
    "user_utterances": [
      "laptop battery dying really fast",
      "battery drains too quickly on windows",
      "only getting 2 hours on a charge",
      "laptop runs out of battery too fast"
    ],
    "escalate_if_failed": false,
    "related_categories": ["hardware", "software"],
    "resolution_time_minutes": 25
  },
  {
    "ticket_id": "TKT-038",
    "category": "battery",
    "operating_system": "macOS",
    "difficulty_level": "high",
    "severity": "P1",
    "keywords": ["battery", "mac", "not charging", "charger", "plugged in", "swollen", "replace", "dead", "overheating"],
    "problem_description": "My MacBook won't charge at all even though it's plugged in. The charging light on the cable isn't coming on and my battery is now at 2% and about to die completely. I've tried two different chargers and neither works. My laptop also feels very warm near the battery area which is worrying me.",
    "resolution_steps": [
      "1. Unplug the charger immediately and do not continue using the laptop if it feels unusually hot near the battery — this could indicate a swollen battery.",
      "2. Let the laptop cool down for 15 minutes in a well-ventilated area.",
      "3. Try a different power outlet and a different USB-C cable if available.",
      "4. On newer Macs, try plugging the charger into a different USB-C port on the other side of the laptop.",
      "5. If the laptop is completely dead, do not attempt to force-charge it — bring it to IT immediately.",
      "6. A hot, non-charging battery is a potential safety hazard — IT must inspect this device before further use. Do not leave it unattended."
    ],
    "user_utterances": [
      "macbook won't charge at all",
      "charger not working on mac",
      "battery at 2 percent and not charging",
      "laptop hot and won't charge"
    ],
    "escalate_if_failed": true,
    "related_categories": ["hardware", "software"],
    "resolution_time_minutes": 90
  },
  {
    "ticket_id": "TKT-039",
    "category": "battery",
    "operating_system": "linux",
    "difficulty_level": "low",
    "severity": "P3",
    "keywords": ["battery", "linux", "percentage", "wrong", "calibrate", "indicator", "inaccurate", "showing"],
    "problem_description": "The battery percentage on my Linux laptop is showing completely wrong numbers. It says 80% and then dies 20 minutes later, or it jumps around between different percentages randomly. The battery seems okay but the indicator is all over the place and I can't trust it.",
    "resolution_steps": [
      "1. Open a terminal and type 'upower -i /org/freedesktop/UPower/devices/battery_BAT0' to see detailed battery info.",
      "2. Calibrate the battery: charge it to 100%, then let it drain completely to 0% until the laptop shuts off on its own.",
      "3. Leave it off for 2 hours, then charge it fully to 100% again without using it.",
      "4. Restart the laptop and check if the percentage is now more accurate.",
      "5. If the problem persists, type 'sudo apt install tlp tlp-rdw' to install TLP, a power management tool that can improve battery reporting accuracy."
    ],
    "user_utterances": [
      "battery percentage is wrong on linux",
      "battery jumps around shows wrong number",
      "laptop says 80 percent then dies",
      "battery indicator inaccurate on linux"
    ],
    "escalate_if_failed": false,
    "related_categories": ["hardware", "software"],
    "resolution_time_minutes": 10
  },
  {
    "ticket_id": "TKT-040",
    "category": "battery",
    "operating_system": "all",
    "difficulty_level": "medium",
    "severity": "P2",
    "keywords": ["battery", "health", "degraded", "capacity", "replace", "low", "cycle", "worn", "check"],
    "problem_description": "I got a warning saying my battery health is critically low and it needs to be serviced. The message says my battery only has 30% of its original capacity left. I'm not sure what this means exactly or what I need to do — do I need a new laptop or just a new battery? It's getting in the way of my work.",
    "resolution_steps": [
      "1. Take note of the exact warning message and which application or system showed it.",
      "2. Check your battery health report: on Windows, open Command Prompt and type 'powercfg /batteryreport'; on Mac, hold Option and click the battery menu icon.",
      "3. Email or call IT with the battery health percentage and your laptop model and serial number.",
      "4. IT will assess whether the battery can be replaced in your current laptop or if a new device is needed.",
      "5. In the meantime, keep your laptop plugged in as much as possible to avoid disruptions."
    ],
    "user_utterances": [
      "got a warning my battery health is low",
      "battery says needs to be serviced",
      "battery health critically low message",
      "battery only 30 percent capacity left"
    ],
    "escalate_if_failed": false,
    "related_categories": ["hardware", "software"],
    "resolution_time_minutes": 30
  }
];
module.exports = { TICKETS };
