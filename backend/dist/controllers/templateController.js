"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateController = void 0;
const index_js_1 = require("../config/index.js");
class TemplateController {
    static async listTemplates(req, res) {
        try {
            const templates = await index_js_1.prisma.emailTemplate.findMany({
                orderBy: { createdAt: 'asc' },
            });
            res.json({ templates });
        }
        catch (error) {
            console.error('List templates error:', error);
            res.status(500).json({ error: 'Failed to retrieve email templates.' });
        }
    }
    static async createTemplate(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { title, description, category, subject, bodyHtml } = req.body;
            if (!title || !subject || !bodyHtml) {
                res.status(400).json({ error: 'Title, Subject, and Body HTML are required.' });
                return;
            }
            const template = await index_js_1.prisma.emailTemplate.create({
                data: {
                    title: title.trim(),
                    description: description ? description.trim() : null,
                    category: category || 'PROPOSAL',
                    subject: subject.trim(),
                    bodyHtml,
                    createdById: req.user.id,
                },
            });
            res.status(201).json({ message: 'Template created', template });
        }
        catch (error) {
            console.error('Create template error:', error);
            res.status(500).json({ error: 'Failed to create template.' });
        }
    }
    static async updateTemplate(req, res) {
        try {
            const id = String(req.params.id);
            const { title, description, category, subject, bodyHtml } = req.body;
            const template = await index_js_1.prisma.emailTemplate.update({
                where: { id },
                data: {
                    title: title ? title.trim() : undefined,
                    description: description !== undefined ? description : undefined,
                    category: category || undefined,
                    subject: subject ? subject.trim() : undefined,
                    bodyHtml: bodyHtml || undefined,
                },
            });
            res.json({ message: 'Template updated', template });
        }
        catch (error) {
            console.error('Update template error:', error);
            res.status(500).json({ error: 'Failed to update template.' });
        }
    }
    static async deleteTemplate(req, res) {
        try {
            const id = String(req.params.id);
            await index_js_1.prisma.emailTemplate.delete({
                where: { id },
            });
            res.json({ message: 'Template deleted.' });
        }
        catch (error) {
            console.error('Delete template error:', error);
            res.status(500).json({ error: 'Failed to delete template.' });
        }
    }
}
exports.TemplateController = TemplateController;
