"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_js_1 = require("../config/index.js");
const mailEngine_js_1 = require("./mailEngine.js");
async function seedDatabase() {
    console.log('🌱 Starting Cookscape database seeding...');
    const defaultPassword = await bcryptjs_1.default.hash('Cookscape@123', 10);
    // 1. Create Users
    const admin = await index_js_1.prisma.user.upsert({
        where: { email: 'admin@cookscape.com' },
        update: {},
        create: {
            email: 'admin@cookscape.com',
            name: 'Karthik Raja (Admin)',
            passwordHash: defaultPassword,
            role: 'SUPER_ADMIN',
            department: 'Management',
            designation: 'Managing Director & Principal Architect',
            phone: '+91 98400 12345',
            signatureHtml: '<div style="font-family: Arial, sans-serif;"><p><strong>Karthik Raja</strong><br/>Managing Director | Cookscape Interior Designs<br/><a href="https://cookscape.com" style="color: #c59b27;">www.cookscape.com</a> | +91 98400 12345</p></div>',
        },
    });
    const priya = await index_js_1.prisma.user.upsert({
        where: { email: 'priya.designer@cookscape.com' },
        update: {},
        create: {
            email: 'priya.designer@cookscape.com',
            name: 'Priya Sundaram',
            passwordHash: defaultPassword,
            role: 'DESIGNER',
            department: 'Design',
            designation: 'Senior Interior Designer',
            phone: '+91 98400 23456',
            signatureHtml: '<div style="font-family: Arial, sans-serif;"><p><strong>Priya Sundaram</strong><br/>Senior Interior Designer | Cookscape Studios<br/>Mobile: +91 98400 23456</p></div>',
        },
    });
    const rajesh = await index_js_1.prisma.user.upsert({
        where: { email: 'rajesh.ops@cookscape.com' },
        update: {},
        create: {
            email: 'rajesh.ops@cookscape.com',
            name: 'Rajesh Sharma',
            passwordHash: defaultPassword,
            role: 'EMPLOYEE',
            department: 'Site Ops',
            designation: 'Lead Site Supervisor',
            phone: '+91 98400 34567',
            signatureHtml: '<div style="font-family: Arial, sans-serif;"><p><strong>Rajesh Sharma</strong><br/>Lead Site Supervisor | Cookscape Operations<br/>Mobile: +91 98400 34567</p></div>',
        },
    });
    const vikram = await index_js_1.prisma.user.upsert({
        where: { email: 'vikram.kitchens@cookscape.com' },
        update: {},
        create: {
            email: 'vikram.kitchens@cookscape.com',
            name: 'Vikram Mehta',
            passwordHash: defaultPassword,
            role: 'DESIGNER',
            department: 'Modular Kitchen',
            designation: 'Modular Kitchen & Hardware Specialist',
            phone: '+91 98400 45678',
            signatureHtml: '<div style="font-family: Arial, sans-serif;"><p><strong>Vikram Mehta</strong><br/>Modular Kitchen Specialist | Cookscape</p></div>',
        },
    });
    const client = await index_js_1.prisma.user.upsert({
        where: { email: 'ananya.client@gmail.com' },
        update: {},
        create: {
            email: 'ananya.client@gmail.com',
            name: 'Ananya Verma (Client)',
            passwordHash: defaultPassword,
            role: 'CLIENT',
            department: 'Client',
            designation: 'Homeowner (Villa 402)',
            phone: '+91 98400 56789',
        },
    });
    console.log('✅ Users seeded: admin@cookscape.com, priya.designer@cookscape.com, rajesh.ops@cookscape.com, vikram.kitchens@cookscape.com, ananya.client@gmail.com');
    // 2. Create Chat Channels & Client Project Rooms
    const channels = [
        { name: 'general', description: 'Company-wide notices, awards, and major Cookscape announcements', type: 'CHANNEL' },
        { name: 'design-studio', description: '3D Renders, Material Moodboards, and Architectural Concepts', type: 'CHANNEL' },
        { name: 'modular-kitchens', description: 'Carcass materials, Blum/Hettich hardware, Quartz countertops', type: 'CHANNEL' },
        { name: 'site-supervisors', description: 'Site progress photos, civil work, false ceiling, and electrical check-ins', type: 'CHANNEL' },
    ];
    for (const ch of channels) {
        const existing = await index_js_1.prisma.chatRoom.findFirst({ where: { name: ch.name, type: 'CHANNEL' } });
        if (!existing) {
            const room = await index_js_1.prisma.chatRoom.create({
                data: {
                    name: ch.name,
                    description: ch.description,
                    type: 'CHANNEL',
                    createdById: admin.id,
                    members: {
                        create: [
                            { userId: admin.id, role: 'ADMIN' },
                            { userId: priya.id, role: 'MEMBER' },
                            { userId: rajesh.id, role: 'MEMBER' },
                            { userId: vikram.id, role: 'MEMBER' },
                        ],
                    },
                },
            });
            // Sample channel message
            await index_js_1.prisma.chatMessage.create({
                data: {
                    roomId: room.id,
                    senderId: admin.id,
                    content: `Welcome to #${ch.name}! Keep all communication professional, crisp, and safe inside Cookscape.`,
                },
            });
        }
    }
    // Client Project Room (Villa 402)
    const existingProjectRoom = await index_js_1.prisma.chatRoom.findFirst({
        where: { projectCode: 'CK-2026-VILLA402' },
    });
    if (!existingProjectRoom) {
        const projectRoom = await index_js_1.prisma.chatRoom.create({
            data: {
                name: 'Villa 402 - Living Room & Modular Kitchen',
                description: 'Safe client communication portal for Ms. Ananya Verma project',
                type: 'CLIENT_PROJECT',
                projectCode: 'CK-2026-VILLA402',
                clientName: 'Ananya Verma',
                createdById: admin.id,
                members: {
                    create: [
                        { userId: admin.id, role: 'ADMIN' },
                        { userId: priya.id, role: 'MEMBER' },
                        { userId: rajesh.id, role: 'MEMBER' },
                        { userId: client.id, role: 'GUEST_CLIENT' },
                    ],
                },
            },
        });
        await index_js_1.prisma.chatMessage.createMany({
            data: [
                {
                    roomId: projectRoom.id,
                    senderId: priya.id,
                    content: 'Hello Ms. Ananya! Welcome to your official Cookscape project room. We will share all 3D renders, material specs, and site photos here.',
                },
                {
                    roomId: projectRoom.id,
                    senderId: client.id,
                    content: 'Thank you Priya! Looking forward to seeing the open kitchen layouts and the fluted paneling designs for the TV console.',
                },
                {
                    roomId: projectRoom.id,
                    senderId: rajesh.id,
                    content: 'Site update: Electrical conduit laying is 80% complete. False ceiling framing starts this Thursday.',
                },
            ],
        });
    }
    console.log('✅ Chat channels and client project room seeded.');
    // 3. Create Email Templates for Interior Designers
    const templates = [
        {
            title: 'Interior Design Concept & Moodboard Proposal',
            description: 'Standard client pitch with theme details, color palette, and 3D preview notes',
            category: 'PROPOSAL',
            subject: 'Cookscape Design Proposal: Modern Contemporary Concept for [Client Project]',
            bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; max-width: 650px; line-height: 1.6;">
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: #f8fafc; padding: 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: #fbbf24; font-size: 22px;">Cookscape Interior Designs</h2>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Crafting Elegant Living Spaces</p>
        </div>
        <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Dear <strong>[Client Name]</strong>,</p>
          <p>We are delighted to present the initial interior design concept curated specifically for your home at <strong>[Project Location]</strong>.</p>
          
          <h3 style="color: #0f172a; border-bottom: 2px solid #fbbf24; padding-bottom: 6px;">1. Design Aesthetic & Theme</h3>
          <ul>
            <li><strong>Theme:</strong> Warm Scandinavian Minimalist with Brass & Veneer Accents</li>
            <li><strong>Palette:</strong> Warm Beige (#F5F5DC), Muted Charcoal, Natural Oak, and Sage Green</li>
            <li><strong>Lighting:</strong> Warm 3000K ambient cove lighting with magnetic track spotlights</li>
          </ul>

          <h3 style="color: #0f172a; border-bottom: 2px solid #fbbf24; padding-bottom: 6px;">2. Included Deliverables</h3>
          <ul>
            <li>Full 3D Photorealistic Visualizations</li>
            <li>Detailed 2D Electrical, Plumbing & False Ceiling CAD Drawings</li>
            <li>Complete Material & Hardware Bill of Quantities (BOQ)</li>
          </ul>

          <p>Please review the attached presentation and let us know your preferred time for a 3D walkthrough presentation.</p>
          <p>Warm regards,<br/><strong>Cookscape Design Team</strong></p>
        </div>
      </div>`,
        },
        {
            title: 'Modular Kitchen Quotation & Hardware Specs',
            description: 'Cost estimate breakdown with plywood grade, acrylic/PU shutters, and Blum fittings',
            category: 'QUOTATION',
            subject: 'Cookscape Modular Kitchen Estimate & Specifications: [Project Name]',
            bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; max-width: 650px; line-height: 1.6;">
        <div style="background: #1e293b; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: #fbbf24;">Cookscape Modular Kitchen Estimate</h2>
        </div>
        <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>[Client Name]</strong>,</p>
          <p>Here is the detailed quotation for the modular kitchen cabinetry and hardware specifications:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Component</th>
                <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Specification</th>
                <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Warranty</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1;"><strong>Carcass</strong></td>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">710 Grade Boiling Waterproof (BWP) Marine Ply</td>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">10 Years</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1;"><strong>Shutter Finish</strong></td>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Anti-Scratch Seamless Acrylic / Polyurethane (PU) Matte</td>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">5 Years</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1;"><strong>Fittings & Hinges</strong></td>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Blum Soft-Close Tandembox & Aventos Lift-Ups</td>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Lifetime</td>
              </tr>
            </tbody>
          </table>

          <p>Total Estimated Value: <strong>[Enter Amount] + GST</strong></p>
          <p>Please find the detailed line-item breakdown in the attached PDF.</p>
        </div>
      </div>`,
        },
        {
            title: 'Site Progress Milestone Sign-off',
            description: 'Formal update to client after completing woodwork, tiling, or false ceiling',
            category: 'SITE_UPDATE',
            subject: 'Milestone Completed: [Milestone Name] - Cookscape Site Update',
            bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; color: #334155;">
        <h3 style="color: #0f172a; border-left: 4px solid #10b981; padding-left: 10px;">Milestone Status Update: Complete</h3>
        <p>Dear <strong>[Client Name]</strong>,</p>
        <p>We are pleased to inform you that our site team has successfully completed the <strong>[e.g., False Ceiling & Electrical Rough-in]</strong> phase for your property.</p>
        
        <h4>Key Accomplishments:</h4>
        <ul>
          <li>Precision gypsum channel alignment according to CAD plan</li>
          <li>A/C copper piping pressure tested and sealed</li>
          <li>Recessed spotlight and profile LED light cutouts verified</li>
        </ul>
        <p>Our quality supervisor has signed off on the inspection. Next phase: <strong>Primer coating and modular carcass installation</strong>.</p>
      </div>`,
        },
    ];
    for (const t of templates) {
        const existing = await index_js_1.prisma.emailTemplate.findFirst({ where: { title: t.title } });
        if (!existing) {
            await index_js_1.prisma.emailTemplate.create({
                data: {
                    title: t.title,
                    description: t.description,
                    category: t.category,
                    subject: t.subject,
                    bodyHtml: t.bodyHtml,
                    isDefault: true,
                    createdById: admin.id,
                },
            });
        }
    }
    console.log('✅ Email templates seeded.');
    // 4. Create Initial Starter Emails
    const existingEmails = await index_js_1.prisma.email.count();
    if (existingEmails === 0) {
        await mailEngine_js_1.MailEngine.sendEmail({
            senderId: admin.id,
            senderEmail: admin.email,
            senderName: admin.name,
            to: [priya.email, rajesh.email, vikram.email],
            subject: 'Welcome to Cookscape Enterprise Mail & Workspace',
            category: 'GENERAL',
            importance: 'HIGH',
            bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.6;">
        <h2 style="color: #0f172a;">Welcome to our new In-House Cookscape Communication Hub! 🏢🎨</h2>
        <p>Hello Team Cookscape,</p>
        <p>We are officially moving all employee email communication, client proposals, quotation submissions, and project chats to our private, secure Cookscape workspace.</p>
        <h3>What this means for you:</h3>
        <ul>
          <li><strong>Secure Employee Emails:</strong> All correspondence remains strictly confidential and archived on company infrastructure.</li>
          <li><strong>Interior Design Templates:</strong> Easily generate high-converting design pitches and modular kitchen quotes using the template selector in the compose modal.</li>
          <li><strong>Real-Time Project Rooms:</strong> Seamlessly collaborate with site supervisors, modular carpenters, and homeowners.</li>
        </ul>
        <p>If you need any adjustments to your department mailbox or aliases, please reach out to the Admin panel.</p>
        <p>Let's design wonderful spaces together!<br/><strong>Karthik Raja</strong><br/>Cookscape Interior Designs</p>
      </div>`,
        });
        await mailEngine_js_1.MailEngine.sendEmail({
            senderId: priya.id,
            senderEmail: priya.email,
            senderName: priya.name,
            to: [admin.email, vikram.email],
            subject: 'Villa 402 - 3D Render & Material Selection Ready for Review',
            category: 'PROPOSAL',
            importance: 'HIGH',
            bodyHtml: `<p>Hi Karthik and Vikram,</p>
      <p>I have finalized the living room 3D renders for Ms. Ananya's villa. We are going with Fluted Charcoal Wall panels behind the 75-inch TV with warm bronze strip LED accents.</p>
      <p>Vikram, can you verify if we have the matte charcoal acrylic sheets in stock for the kitchen island base cabinets?</p>
      <p>Thanks,<br/>Priya</p>`,
        });
        await mailEngine_js_1.MailEngine.sendEmail({
            senderId: rajesh.id,
            senderEmail: rajesh.email,
            senderName: rajesh.name,
            to: [priya.email],
            subject: 'Site Inspection Report: Villa 402 - Tile Leveling & Electrical Grid',
            category: 'SITE_UPDATE',
            importance: 'NORMAL',
            bodyHtml: `<p>Hi Priya,</p>
      <p>Completed the site visit this morning. Italian marble flooring leveling in the dining area is complete. Switchboard conduit depths match the modular wardrobe drawings.</p>
      <p>We are on schedule for carcass delivery next Monday.</p>
      <p>Regards,<br/>Rajesh Sharma</p>`,
        });
    }
    console.log('✅ Starter emails seeded.');
    console.log('✨ Seeding complete! All Cookscape systems ready.');
}
// Auto-run if called directly
if (process.argv[1]?.endsWith('seedService.ts') || process.argv[1]?.endsWith('seedService.js')) {
    seedDatabase()
        .then(async () => {
        await index_js_1.prisma.$disconnect();
        process.exit(0);
    })
        .catch(async (e) => {
        console.error(e);
        await index_js_1.prisma.$disconnect();
        process.exit(1);
    });
}
