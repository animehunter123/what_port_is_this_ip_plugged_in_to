connect-VIServer xxx.xx.xx.33


# Get all networks in vCenter
$networks = Get-VirtualNetwork

# Specify VM creation parameters
$vmName = "MultiNICVM"

# Get a random host
# $vmHost = Get-VMHost | Get-Random
$vmHost = "192.168.30.5"

# Get a random datastore with sufficient free space (adjust 10GB as needed)
# $datastore = Get-Datastore | Where-Object {$_.FreeSpaceGB -gt 10} | Get-Random
$datastore = "1_lstore"

# Create the VM
$vm = New-VM -Name $vmName -VMHost $vmHost -Datastore $datastore

# Add a NIC for each network
foreach ($network in $networks) {
    New-NetworkAdapter -VM $vm -NetworkName $network.Name -StartConnected -Type Vmxnet3
}












# # Specify VM creation parameters
# $vmName = "MultiNICVM"
# $vmHost = Get-VMHost -Name your_esxi_host
# $datastore = Get-Datastore -Name your_datastore

# # Create the VM
# $vm = New-VM -Name $vmName -VMHost $vmHost -Datastore $datastore

# # Add a NIC for each network
# foreach ($network in $networks) {
#     New-NetworkAdapter -VM $vm -NetworkName $network.Name -StartConnected -Type Vmxnet3
# }