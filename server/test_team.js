import dotenv from 'dotenv';
import prisma from './src/db/prisma.js';
import teamController from './src/controllers/team.controller.js';

dotenv.config();

// Helper to create a mock response object
const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

async function testTeamWorkflow() {
  try {
    // 1. Fetch two mock users from the DB
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length < 2) {
      console.error('Please make sure you have at least 2 users in the database to run this test.');
      return;
    }
    const userA = users[0];
    const userB = users[1];

    console.log(`User A (Owner): ${userA.email}`);
    console.log(`User B (Member): ${userB.email}`);

    // 2. Mock Create Team request for User A
    const createReq = {
      user: userA,
      body: {
        name: `Team Alpha ${Date.now()}`,
        description: 'Testing team functionality'
      }
    };
    const createRes = mockResponse();

    await teamController.createTeam(createReq, createRes);
    console.log('--- Create Team Response ---');
    console.log(createRes.jsonData);

    if (!createRes.jsonData || !createRes.jsonData.success) {
      throw new Error(`Failed to create team: ${JSON.stringify(createRes.jsonData)}`);
    }

    const createdTeam = createRes.jsonData.data;
    const inviteCode = createdTeam.inviteCode;
    console.log(`Invite Code generated: ${inviteCode}`);

    // 3. Mock Join Team request for User B using inviteCode
    const joinReq = {
      user: userB,
      body: {
        inviteCode: inviteCode
      }
    };
    const joinRes = mockResponse();

    await teamController.joinTeam(joinReq, joinRes);
    console.log('--- Join Team Response ---');
    console.log(joinRes.jsonData);

    if (!joinRes.jsonData || !joinRes.jsonData.success) {
      throw new Error(`Failed to join team: ${JSON.stringify(joinRes.jsonData)}`);
    }

    console.log('✅ Team creation and join flows successfully tested!');

    // 4. Verify notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: userA.id },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    console.log('--- Latest Notification for Owner ---');
    console.log(notifications[0]);

  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testTeamWorkflow();
