import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import snippetController from '../controllers/snippet.controller.js';

const router = express.Router();

// Public route to browse public snippets
router.get('/public', snippetController.getPublicSnippets);

// Authenticated routes
router.get('/', authMiddleware, snippetController.getAllSnippets);
router.get('/:id', authMiddleware, snippetController.getSnippetById);
router.post('/', authMiddleware, snippetController.createSnippet);
router.put('/:id', authMiddleware, snippetController.updateSnippet);
router.delete('/:id', authMiddleware, snippetController.deleteSnippet);

export default router;




