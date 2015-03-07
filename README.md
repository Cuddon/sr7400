# SR7400
## Marantz SR7400 Web Service
Marantz SR7400 surround sound amplifier web service using a Global Cache GC-100 to connect to the SR7400 serial port via TCP.

[Website](www.cuddon.net)

### Starting the server

1. Start the server
  ```
  node server
  ```

2. Use HTTP client to access the API

### API
```
    /api/requesttpe/requeststring               --> returns a string
    (Not yet implemented) /api/requesttpe/requeststring?return=json   --> returns json (optional)
  
  Device commands and status requests
    /api/command/turn_power_on
    /api/command/get_volume_level
  
  Macros
    /api/macro/watch_tv_with_surround_sound
    /api/macro/run/commands   (Not yet implemented)- commands is a list of commands
    
  Config
    /api/config/settings
    /api/config/macros
    /api/config/protocol
    /api/config/mappings
    /api/config/help

  Logs (all commands return the log) - not yet implemented
    /api/logs/get
    /api/log/get
    /api/history/get
```
###License
The MIT License (MIT)

Copyright (c) 2015 Andrew Cuddon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

