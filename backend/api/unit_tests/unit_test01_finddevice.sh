#!/bin/bash

# Function to perform a POST request and validate the response
test_endpoint() {
    local target=$1
    local expected_response=$2

    # Perform the POST request
    response=$(curl -s -X POST http://localhost:5000/find-device \
        -H "Content-Type: application/json" \
        -d "{ \"final_target\": \"$target\" }")

    # Compare the actual response with the expected response
    if [[ "$response" == "$expected_response" ]]; then
        echo "Test passed for target: $target"
    else
        echo "Test failed for target: $target"
        echo "Expected: $expected_response"
        echo "Got:      $response"
        exit 1
    fi
}

# Test cases
test_endpoint "192.168.0.105" '{"switch":"lm-sw01.lm.local","dev_mac":"0062.0b0a.d9a8","port":"1/1/7","dev_ip":"192.168.0.105","dev_hostname":"lm-esx02"}'
test_endpoint "lm-esx02.lm.local" '{"switch":"lm-sw01.lm.local","dev_mac":"0062.0b0a.d9a8","port":"1/1/7","dev_ip":"192.168.0.105","dev_hostname":"lm-esx02"}'
test_endpoint "lm-esx02" '{"error":"lm-esx02 is not reachable"}'
test_endpoint "FAKESERVERRRR.lm.local" '{"error":"FAKESERVERRRR.lm.local is not reachable"}'

echo "All tests passed successfully!"










# $curl -X POST http://localhost:5000/find-device \
#                                     -H "Content-Type: application/json" \
#                                     -d '{ "final_target": "192.168.0.105" }'
# {"switch":"lm-sw01.lm.local","dev_mac":"0062.0b0a.d9a8","port":"1/1/7","dev_ip":"192.168.0.105","dev_hostname":"lm-esx02"}⏎    

# $curl -X POST http://localhost:5000/find-device \
#                                     -H "Content-Type: application/json" \
#                                     -d '{ "final_target": "lm-esx02.lm.local" }'
# {"switch":"lm-sw01.lm.local","dev_mac":"0062.0b0a.d9a8","port":"1/1/7","dev_ip":"192.168.0.105","dev_hostname":"lm-esx02"}⏎    

# $curl -X POST http://localhost:5000/find-device \
#                                     -H "Content-Type: application/json" \
#                                     -d '{ "final_target": "lm-esx02" }'
# {"error":"lm-esx02 is not reachable"}⏎
# $curl -X POST http://localhost:5000/find-device \
#                                     -H "Content-Type: application/json" \
#                                     -d '{ "final_target": "FAKESERVERRRR.lm.local" }'
# {"error":"FAKESERVERRRR.lm.local is not reachable"}⏎

