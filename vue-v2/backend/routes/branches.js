const express = require('express');
const branchController = require('../controllers/branchController');

const router = express.Router();

router.get('/', branchController.getAll);
router.get('/tree', branchController.getTree);
router.get('/:id', branchController.getById);
router.post('/', branchController.create);
router.put('/:id', branchController.update);
router.delete('/:id', branchController.delete);

module.exports = router;