#API
##version 1.0.0

###  API
    /api/requesttype/requeststring               --> returns a string
    (Not yet implemented) /api/requesttype/requeststring?return=json   --> returns json (optional)
  
###  Device commands and status requests
    /api/command/turn_power_on
    /api/command/get_volume_level
  
###  Macros
    /api/macro/watch_tv_with_surround_sound
    /api/macro/run/commands   (Not yet implemented)- commands is a list of commands
    
###  Config
    /api/config/settings
    /api/config/macros
    /api/config/protocol
    /api/config/mappings
    /api/config/help

###  Logs (all commands return the log) - Not yet implemented
    /api/logs/get
    /api/log/get
    /api/history/get

