# Description

Proof of concept webapp with fronend/backend (and using external dependency: remoteshellapi) to:

* ensure remoteshell api is still up before doing anything? (not a show-stopper for webapp startup)
* ssh into every switch and save the "show mac-a" or "show mac add"
* ssh into every switch and save the "show arp"
* If a IP address is directly attached to the switch add it to the latest list
* dig/dns get the hostname for IP in the latest list
* Show a table which shows which "IP" "Hostname" is mapped to "Switch" "Port"; that is sortable.


# TODO

* Still need to fix: 
```bash
> curl -X POST http://localhost:5000/ssh \
                     -H "Content-Type: application/json" \
                     -d '{ "hostname": "ubuntu01.m.local" ,
                     "username": "mydeuduser",
                     "password": "mydude",
                     "command": "hostname;uptime"
                 }'

                 and i got...

                 
{"stdout":"","stderr":"All configured authentication methods failed","rc":1,"error_msg":"SSH connection error","details":null}
```

* the nodejs backend shutsdown if the ssh fails, with ENOTFOUND

* dockerize it before final release