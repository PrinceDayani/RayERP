const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testChatMarkAsRead() {
  try {
    console.log('🧪 Testing Chat markAsRead functionality...\n');

    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@rayerp.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Set up headers with token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Get all chats
    console.log('\n2. Getting all chats...');
    const chatsResponse = await axios.get(`${BASE_URL}/chat/chats`, { headers });
    
    if (!chatsResponse.data.success) {
      throw new Error('Failed to get chats');
    }

    const chats = chatsResponse.data.data;
    console.log(`✅ Found ${chats.length} chats`);

    if (chats.length === 0) {
      console.log('⚠️  No chats found. Creating a test chat...');
      
      // Get users to create a chat with
      const usersResponse = await axios.get(`${BASE_URL}/chat/users`, { headers });
      const users = usersResponse.data.data;
      
      if (users.length > 0) {
        // Create a chat with the first user
        const createChatResponse = await axios.post(`${BASE_URL}/chat/chats`, {
          participantId: users[0]._id
        }, { headers });
        
        if (createChatResponse.data.success) {
          chats.push(createChatResponse.data.data);
          console.log('✅ Test chat created');
        }
      }
    }

    if (chats.length > 0) {
      const testChat = chats[0];
      console.log(`\n3. Testing markAsRead for chat: ${testChat._id}`);

      // Test markAsRead
      const markAsReadResponse = await axios.put(
        `${BASE_URL}/chat/chats/${testChat._id}/read`,
        {},
        { headers }
      );

      if (markAsReadResponse.data.success) {
        console.log('✅ markAsRead successful');
        console.log(`📊 Result: ${markAsReadResponse.data.message}`);
        if (markAsReadResponse.data.updatedCount !== undefined) {
          console.log(`📈 Updated ${markAsReadResponse.data.updatedCount} messages`);
        }
      } else {
        console.log('❌ markAsRead failed:', markAsReadResponse.data.message);
      }
    }

    console.log('\n🎉 Chat test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.error('🔍 Server Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
  }
}

// Run the test
testChatMarkAsRead();