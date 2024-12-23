# Description

Proof of concept webapp with fronend/backend (and using external dependency: remoteshellapi) to:

* ensure remoteshell api is still up before doing anything? (not a show-stopper for webapp startup)
* ssh into every switch and save the "show mac-a" or "show mac add"
* ssh into every switch and save the "show arp"
* If a IP address is directly attached to the switch add it to the latest list
* dig/dns get the hostname for IP in the latest list
* Show a table which shows which "IP" "Hostname" is mapped to "Switch" "Port"; that is sortable.

# Final Pseudo-code Idea

# PHASE 1: SSH into each AGG Switch, and save "show mac-a" or "show mac a" to a table. Filter out to only lines which contain a '/', such as: "d08a.abcd.d419 1/1/9 Dynamic 180"
# PHASE 2: SSH into the CORE Switch, and save "show arp" to a table
# For each line in the filtered list, grep for that mac address in the CORE ARP list to get the live IP Address, and add it to the line.
# PHASE 3: Now NSLookup or DNSCMD parse the DNS to get the hostname, and add it to the line
# Now you have a table ready, and serve this to the front end (switch/devmac,switchport,devip,devhostname)

# TODO

* remove the hardcoded lm-sw01 from the spacebar checker

* make finder/main.js do everything to get the fields

* dockerize it before final release