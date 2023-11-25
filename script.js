document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    const messages = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const joinChatButton = document.getElementById('joinChat');
    const leaveChatButton = document.getElementById('leaveChat');
    const userList = document.getElementById('userList');
    const clearChatButton = document.getElementById('clearChat');
    let userName = null;

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const joinChat = () => {
        userName = null;
        userName = prompt('Please enter your name:');
        if (userName) {
            socket.emit('user connected', userName);
            messageInput.disabled = false;
            sendButton.disabled = false;
            joinChatButton.disabled = true;
            leaveChatButton.disabled = false;
        }
    };

    const leaveChat = () => {
        if (userName) {
            socket.emit('user disconnected', userName);
            userName = null;
            messageInput.disabled = true;
            sendButton.disabled = true;
            joinChatButton.disabled = false;
            leaveChatButton.disabled = true;
        }
    };

    const clearChat = () => {
        messages.innerHTML = '';
    };

    const sendMessage = () => {
        const selectedUser = userList.value;
        const message = messageInput.value;

        if (selectedUser === 'ALL') {
            if (message) {
                const timestamp = new Date().getTime();
                socket.emit('chat message', { message, sender: userName, timestamp, status: 'sent' });
                messageInput.value = '';
            }
        } else {
            if (selectedUser && selectedUser !== userName && message) {
                const timestamp = new Date().getTime();
                socket.emit('private message', { to: selectedUser, message, sender: userName, timestamp, status: 'sent' });
                const listItem = document.createElement('li');
                listItem.textContent = `[Private to ${selectedUser}] ${message}`;
                listItem.classList.add('private');
                messages.appendChild(listItem);
                messageInput.value = '';
            }
        }
    };

    const markMessageAsRead = (sender, timestamp) => {
        const messagesList = document.getElementById('messages');
        const items = messagesList.getElementsByTagName('li');

        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            const itemText = item.textContent;

            if (itemText.includes(sender) && itemText.includes(timestamp)) {
                item.textContent = itemText.replace('sent', 'read');
                item.style.color = 'green';
            }
        }
    };

    sendButton.addEventListener('click', sendMessage);
    clearChatButton.addEventListener('click', clearChat);
    messages.addEventListener('click', (event) => {
        const target = event.target;
        if (target && target.tagName === 'LI' && target.textContent.includes('sent')) {
            const timestamp = target.textContent.match(/\(([^)]+)\)/)[1];
            markMessageAsRead(userName, timestamp);
        }
    });

    joinChatButton.addEventListener('click', joinChat);
    leaveChatButton.addEventListener('click', leaveChat);

    socket.on('userList', (users) => {
        userList.innerHTML = '';
        const allOption = document.createElement('option');
        allOption.value = 'ALL';
        allOption.textContent = 'ALL';
        userList.appendChild(allOption);
        users.forEach((user) => {
            if (user !== userName) {
                const option = document.createElement('option');
                option.value = user;
                option.textContent = user;
                userList.appendChild(option);
            }
        });
    });

    socket.on('chat message', function(data) {
        const listItem = document.createElement('li');
        const timestamp = formatTimestamp(data.timestamp);
        listItem.textContent = `${data.sender} (${timestamp}): ${data.message} [${data.status}]`;
        if (data.status === 'read') {
            listItem.style.color = 'green';
        } else {
            listItem.style.color = 'red';
        }
        messages.appendChild(listItem);
    });
});
