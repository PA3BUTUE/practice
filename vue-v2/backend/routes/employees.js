const express = require('express');
const employeeController = require('../controllers/employeeController');

const router = express.Router();

router.get('/', employeeController.getAll);
router.get('/branch/:branchId', employeeController.getByBranch);
router.get('/branch-tree/:branchId', employeeController.getByBranchTree);
router.get('/:id', employeeController.getById);
router.post('/', employeeController.create);
router.put('/:id', employeeController.update);
router.delete('/:id', employeeController.delete);

module.exports = router;