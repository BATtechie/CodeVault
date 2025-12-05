import prisma from '../db/prisma.js';

const snippetController = {
  // Get all snippets for the authenticated user
  async getAllSnippets(req, res) {
    try {
      const userId = req.user.id;
      
      const snippets = await prisma.snippet.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        data: snippets
      });
    } catch (error) {
      console.error('Get snippets error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch snippets'
      });
    }
  },

  // Get a single snippet by ID
  async getSnippetById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const snippet = await prisma.snippet.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!snippet) {
        return res.status(404).json({
          success: false,
          message: 'Snippet not found'
        });
      }

      res.status(200).json({
        success: true,
        data: snippet
      });
    } catch (error) {
      console.error('Get snippet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch snippet'
      });
    }
  },

  // Create a new snippet
  async createSnippet(req, res) {
    try {
      const { title, description, code, language, tags, isPublic } = req.body;
      const userId = req.user.id;

      if (!title || !code || !language) {
        return res.status(400).json({
          success: false,
          message: 'Title, code, and language are required'
        });
      }

      const snippet = await prisma.snippet.create({
        data: {
          title,
          description: description || null,
          code,
          language: language.toUpperCase(),
          tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []),
          isPublic: isPublic || false,
          userId
        }
      });

      res.status(201).json({
        success: true,
        message: 'Snippet created successfully',
        data: snippet
      });
    } catch (error) {
      console.error('Create snippet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create snippet'
      });
    }
  },

  // Update a snippet
  async updateSnippet(req, res) {
    try {
      const { id } = req.params;
      const { title, description, code, language, tags, isPublic } = req.body;
      const userId = req.user.id;

      // Check if snippet exists and belongs to user
      const existingSnippet = await prisma.snippet.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingSnippet) {
        return res.status(404).json({
          success: false,
          message: 'Snippet not found'
        });
      }

      const updatedSnippet = await prisma.snippet.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description: description || null }),
          ...(code !== undefined && { code }),
          ...(language !== undefined && { language: language.toUpperCase() }),
          ...(tags !== undefined && { 
            tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [])
          }),
          ...(isPublic !== undefined && { isPublic })
        }
      });

      res.status(200).json({
        success: true,
        message: 'Snippet updated successfully',
        data: updatedSnippet
      });
    } catch (error) {
      console.error('Update snippet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update snippet'
      });
    }
  },

  // Delete a snippet
  async deleteSnippet(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if snippet exists and belongs to user
      const existingSnippet = await prisma.snippet.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingSnippet) {
        return res.status(404).json({
          success: false,
          message: 'Snippet not found'
        });
      }

      await prisma.snippet.delete({
        where: { id }
      });

      res.status(200).json({
        success: true,
        message: 'Snippet deleted successfully'
      });
    } catch (error) {
      console.error('Delete snippet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete snippet'
      });
    }
  },

  // Public: get all public snippets across users
  async getPublicSnippets(_req, res) {
    try {
      if (!process.env.DATABASE_URL) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No database configured; returning empty list.'
        });
      }

      const snippets = await prisma.snippet.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      res.status(200).json({
        success: true,
        data: snippets
      });
    } catch (error) {
      console.error('Get public snippets error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch public snippets'
      });
    }
  }
};

export default snippetController;




