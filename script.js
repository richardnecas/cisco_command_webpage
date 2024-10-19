document.addEventListener('DOMContentLoaded', () => {
    loadCommands();
    loadSubnets();
    setupRightMenu();
});

function loadCommands() {
    fetch('commands.json')
        .then(response => response.json())
        .then(data => {
            const commandMenu = document.getElementById('commandMenu');
            const commandsContent = document.getElementById('commandsContent');
            data.groups.forEach(group => {
                // Create menu group link
                const groupItem = document.createElement('li');
                const groupLink = document.createElement('a');
                groupLink.href = `#${group.name}`;
                groupLink.innerText = group.name;
                groupItem.appendChild(groupLink);

                // Create a sublist for commands within the group
                const sublist = document.createElement('ul');
                sublist.classList.add('submenu');

                // Add a header for the command group in the main content area
                const groupHeader = document.createElement('h2');
                groupHeader.id = group.name;
                groupHeader.innerText = group.name;
                commandsContent.appendChild(groupHeader);

                // Create command cards and menu links for each command
                group.commands.forEach(command => {
                    // Create a menu item for the command
                    const commandItem = document.createElement('li');
                    const commandLink = document.createElement('a');
                    commandLink.href = `#${command.name}`;
                    commandLink.innerText = command.name;
                    commandItem.appendChild(commandLink);
                    sublist.appendChild(commandItem);

                    // Create the command card in the main content area
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.id = command.name;
                    const commandTitle = document.createElement('h3');
                    commandTitle.innerText = command.name;
                    const commandDescription = document.createElement('p');
                    commandDescription.innerText = command.description;
                    const codeBlock = document.createElement('pre');
                    codeBlock.className = 'code';
                    codeBlock.innerText = command.example;
                    card.appendChild(commandTitle);
                    card.appendChild(commandDescription);
                    card.appendChild(codeBlock);
                    commandsContent.appendChild(card);
                });

                // Append the sublist to the group item
                groupItem.appendChild(sublist);
                commandMenu.appendChild(groupItem);
            });
        });
}

function loadSubnets() {
    fetch('subnets.json')
        .then(response => response.json())
        .then(data => {
            const subnetTable = document.getElementById('subnetTable');

            // Clear existing rows, except for the header
            subnetTable.innerHTML = '<tr><th>Prefix</th><th>Subnet Mask</th><th>Wildcard Mask</th><th>Addresses</th></tr>';

            // Populate the table rows with subnet data
            data.subnets.forEach(subnet => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>/${subnet.prefix}</td>
                                 <td>${subnet.subnetMask}</td>
                                 <td>${subnet.wildcardMask}</td>
                                 <td>${subnet.availableAddresses}</td>`;
                subnetTable.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading subnets:', error);
        });
}

function setupRightMenu() {
    const icons = document.querySelectorAll('.icon');
    icons.forEach(icon => {
        icon.addEventListener('click', () => {
            const contentId = icon.getAttribute('data-content');
            document.querySelectorAll('.content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(contentId).classList.add('active');
        });
    });
}

function calculateSubnet() {
    const ipAddress = document.getElementById('ipAddress').value;
    const oldPrefix = parseInt(document.getElementById('oldPrefix').value);
    const newPrefix = parseInt(document.getElementById('newPrefix').value);

    if (!ipAddress || isNaN(oldPrefix) || isNaN(newPrefix) || oldPrefix < 0 || newPrefix < 0 || oldPrefix > 32 || newPrefix > 32 || newPrefix < oldPrefix) {
        alert('Please enter valid IP address and prefix values.');
        return;
    }

    const binaryIp = ipToBinary(ipAddress);
    const newSubnetMask = prefixToSubnetMask(newPrefix);
    const numberOfNewSubnets = Math.pow(2, newPrefix - oldPrefix);
    const numberOfHosts = Math.pow(2, 32 - newPrefix) - 2;
    const subnetIncrement = Math.pow(2, 32 - newPrefix);

    let subnetResultsHtml = `
        <p><strong>New Subnet Mask:</strong> ${newSubnetMask}</p>
        <p><strong>Number of New Subnets:</strong> ${numberOfNewSubnets}</p>
        <h3>Subnets:</h3>
    `;

    for (let i = 0; i < numberOfNewSubnets; i++) {
        const startIp = addToBinaryIp(binaryIp, i * subnetIncrement);
        const networkIp = getNetworkAddress(startIp, newPrefix);
        const broadcastIp = getBroadcastAddress(startIp, newPrefix);
        const totalAddresses = subnetIncrement;

        subnetResultsHtml += `
            <div>
                <p><strong>Subnet ${i + 1}:</strong></p>
                <div class="subnet-details">
                    <p>Network Address: ${networkIp}</p>
                    <p>Hosts Range: ${getRangeOfHosts(networkIp, broadcastIp)}</p>
                    <p>Number of Hosts: ${numberOfHosts}</p>
                    <p>Broadcast Address: ${broadcastIp}</p>
                    <p>Total Addresses: ${totalAddresses}</p>
                </div>
            </div>
        `;
    }

    document.getElementById('subnetResults').innerHTML = subnetResultsHtml;
}

function ipToBinary(ip) {
    return ip.split('.').map(num => parseInt(num).toString(2).padStart(8, '0')).join('');
}

function binaryToIp(binary) {
    return binary.match(/.{1,8}/g).map(bin => parseInt(bin, 2)).join('.');
}

function prefixToSubnetMask(prefix) {
    return Array(32).fill(0)
        .map((_, i) => i < prefix ? '1' : '0')
        .join('')
        .match(/.{1,8}/g)
        .map(bin => parseInt(bin, 2))
        .join('.');
}

function addToBinaryIp(binaryIp, increment) {
    const ipInt = parseInt(binaryIp, 2);
    const newIpInt = ipInt + increment;
    return newIpInt.toString(2).padStart(32, '0');
}

function getNetworkAddress(binaryIp, prefix) {
    const maskedBinaryIp = binaryIp.slice(0, prefix).padEnd(32, '0');
    return binaryToIp(maskedBinaryIp);
}

function getBroadcastAddress(binaryIp, prefix) {
    const broadcastBinaryIp = binaryIp.slice(0, prefix).padEnd(32, '1');
    return binaryToIp(broadcastBinaryIp);
}

function getRangeOfHosts(networkIp, broadcastIp) {
    const networkIpParts = networkIp.split('.').map(part => parseInt(part));
    const broadcastIpParts = broadcastIp.split('.').map(part => parseInt(part));

    networkIpParts[3] += 1; // First valid host
    broadcastIpParts[3] -= 1; // Last valid host

    return `${networkIpParts.join('.')} - ${broadcastIpParts.join('.')}`;
}