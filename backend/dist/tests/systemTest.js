"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BASE_URL = 'http://localhost:5000/api';
async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${data.error || JSON.stringify(data)}`);
    }
    return data;
}
async function runSystemVerification() {
    console.log('🧪 Starting Cookscape System End-to-End Verification...\n');
    try {
        // 1. Authenticate as Admin
        console.log('1️⃣ Testing Admin Authentication...');
        const adminLogin = await request('/auth/login', {
            method: 'POST',
            body: {
                email: 'admin@cookscape.com',
                password: 'Cookscape@123',
            },
        });
        const adminToken = adminLogin.token;
        console.log(`✅ Admin logged in successfully. User: ${adminLogin.user.name}`);
        const adminHeaders = { Authorization: `Bearer ${adminToken}` };
        // 2. Admin: Create New Employee
        console.log('\n2️⃣ Testing Admin: Employee Provisioning...');
        const createEmp = await request('/admin/employees', {
            method: 'POST',
            headers: adminHeaders,
            body: {
                username: `suresh.kitchen.${Date.now().toString().slice(-4)}`,
                name: 'Suresh Kumar',
                department: 'Modular Kitchen',
                designation: 'Senior Kitchen Designer',
                phone: '+91 98400 99999',
                quotaGb: 10,
            },
        });
        const newEmployee = createEmp.employee;
        console.log(`✅ Created Employee: ${newEmployee.email} with temp pass: ${newEmployee.temporaryPassword}`);
        // 3. Admin: Fetch Dashboard & Audit Logs
        console.log('\n3️⃣ Testing Admin: Dashboard Stats & Audit Trail...');
        const stats = await request('/admin/dashboard-stats', { headers: adminHeaders });
        console.log(`✅ Stats: ${stats.totalUsers} users, ${stats.totalEmails} emails, ${stats.totalChannels} channels.`);
        const audit = await request('/admin/audit-logs', { headers: adminHeaders });
        console.log(`✅ Audit Logs: ${audit.total} recorded events.`);
        // 4. Employee Journey: Priya Designer
        console.log('\n4️⃣ Testing Employee Journey: Priya Sundaram...');
        const priyaLogin = await request('/auth/login', {
            method: 'POST',
            body: {
                email: 'priya.designer@cookscape.com',
                password: 'Cookscape@123',
            },
        });
        const priyaToken = priyaLogin.token;
        const priyaHeaders = { Authorization: `Bearer ${priyaToken}` };
        // Send Email from Priya to Rajesh
        console.log('📧 Sending Interior Design Proposal Email from Priya to Rajesh...');
        const sendMail = await request('/mail/send', {
            method: 'POST',
            headers: priyaHeaders,
            body: {
                to: ['rajesh.ops@cookscape.com'],
                subject: 'Living Room 3D Walkthrough & False Ceiling Drawings - Villa 402',
                bodyHtml: '<p>Hi Rajesh,<br/>Attached are the gypsum false ceiling drop details for the master bedroom and living foyer. Please verify site levels.</p>',
                category: 'PROPOSAL',
                importance: 'HIGH',
            },
        });
        console.log(`✅ Email sent successfully. ID: ${sendMail.email.id}`);
        // 5. Recipient Journey: Rajesh Sharma
        console.log('\n5️⃣ Testing Recipient Journey: Rajesh Sharma...');
        const rajeshLogin = await request('/auth/login', {
            method: 'POST',
            body: {
                email: 'rajesh.ops@cookscape.com',
                password: 'Cookscape@123',
            },
        });
        const rajeshToken = rajeshLogin.token;
        const rajeshHeaders = { Authorization: `Bearer ${rajeshToken}` };
        const inbox = await request('/mail?folder=INBOX', { headers: rajeshHeaders });
        const received = inbox.emails.find((e) => e.subject.includes('Villa 402'));
        if (!received) {
            throw new Error('Sent email not found in Rajesh Inbox!');
        }
        console.log(`✅ Rajesh received email: "${received.subject}" from ${received.senderName} (isRead: ${received.isRead})`);
        // Reply to email
        console.log('↩️ Replying to Priya...');
        await request('/mail/send', {
            method: 'POST',
            headers: rajeshHeaders,
            body: {
                to: ['priya.designer@cookscape.com'],
                subject: `Re: ${received.subject}`,
                bodyHtml: '<p>Got it Priya! Site measurements match the ceiling framing plan.</p>',
                threadId: received.threadId,
                category: 'SITE_UPDATE',
            },
        });
        console.log('✅ Reply sent within same thread.');
        // 6. Real-Time Chat & Client Project Rooms
        console.log('\n6️⃣ Testing Real-Time Chat & Project Rooms...');
        const chatRooms = await request('/chat/rooms', { headers: priyaHeaders });
        const clientRoom = chatRooms.rooms.find((r) => r.type === 'CLIENT_PROJECT');
        if (!clientRoom) {
            throw new Error('Client project room not found!');
        }
        console.log(`✅ Found Client Project Room: "${clientRoom.name}" (${clientRoom.projectCode})`);
        // Post message to client project room
        const chatMsg = await request(`/chat/rooms/${clientRoom.id}/messages`, {
            method: 'POST',
            headers: priyaHeaders,
            body: {
                content: 'Site team has finished ceiling gypsum framing. Acrylic samples will arrive at site tomorrow.',
            },
        });
        console.log(`✅ Posted message to Project Room. Sender: ${chatMsg.message.sender.name}`);
        console.log('\n======================================================');
        console.log('🎉 ALL SYSTEM TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL');
        console.log('======================================================\n');
    }
    catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    }
}
runSystemVerification();
