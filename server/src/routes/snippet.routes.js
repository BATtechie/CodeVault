import express from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import snippetController from '../controllers/snippet.controller.js';

const router = express.Router();

// Public route to browse public snippets
router.get('/public', optionalAuthMiddleware, snippetController.getPublicSnippets);

// Authenticated routes
router.get('/', authMiddleware, snippetController.getAllSnippets);
router.get('/:id/comments', authMiddleware, snippetController.getSnippetComments);
router.get('/:id', authMiddleware, snippetController.getSnippetById);
router.post('/', authMiddleware, snippetController.createSnippet);
router.post('/:id/comments', authMiddleware, snippetController.createSnippetComment);
router.put('/:id', authMiddleware, snippetController.updateSnippet);
router.delete('/:id', authMiddleware, snippetController.deleteSnippet);

export default router;



