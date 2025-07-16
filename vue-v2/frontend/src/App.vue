<template>
  <div class="panel-header">Система управления сотрудниками</div>
  <div class="admin-app">
    <!-- Дерево структуры -->
    <div class="tree-panel">
      <div class="panel-header">
        <button @click="loadInitialData">Обновить данные</button>
      </div>
      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else>
        <div 
          v-for="item in treeData" 
          :key="item.id"
          class="tree-branch"
        >
          <TreeNode 
            :item="item"
            :level="0"
            :selected-id="selectedItemId"
            :collapsed-items="collapsedItems"
            @select="selectItem"
            @toggle="toggleCollapse"
            @context-menu="openContextMenu"
          />
        </div>
      </div>
    </div>

    <!-- Основная панель с сотрудниками -->
    <div class="main-panel">
      <div class="panel-header">
        <button @click="addEmployee" :disabled="!selectedItemId">
          Добавить сотрудника
        </button>
        <span v-if="selectedItemId" class="selected-info">
          Выбрано: {{ getSelectedItemName() }}
        </span>
      </div>

      <div v-if="loadingEmployees" class="loading">Загрузка сотрудников...</div>
      <div v-else-if="displayedEmployees.length" class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Должность</th>
              <th>Оклад</th>
              <th>Дата приема</th>
              <th>Дата рождения</th>
              <th>Филиал</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in displayedEmployees" :key="employee.id">
              <td>{{ employee.full_name }}</td>
              <td>{{ employee.position_name }}</td>
              <td>{{ Number(employee.salary).toLocaleString() }} ₽</td>
              <td>{{ formatDate(employee.hire_date) }}</td>
              <td>{{ formatDate(employee.birth_date) }}</td>
              <td>{{ employee.branch_name }}</td>
              <td>
                <button @click="editEmployee(employee)" class="btn-edit">
                  Изменить
                </button>
                <button @click="deleteEmployee(employee.id)" class="btn-delete">
                  Удалить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        {{ selectedItemId ? 'Нет сотрудников в выбранном подразделении' : 'Выберите элемент для просмотра сотрудников' }}
      </div>
    </div>

    <!-- Контекстное меню -->
    <div 
      v-if="contextMenu.visible" 
      class="context-menu" 
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="addChildItem(contextMenu.itemId)">
        Добавить подчиненное подразделение
      </div>
      <div class="context-menu-item" @click="addEmployeeToItem(contextMenu.itemId)">
        Добавить сотрудника
      </div>
      <div class="context-menu-item danger" @click="deleteItem(contextMenu.itemId)">
        Удалить элемент
      </div>
    </div>

    <!-- Модальное окно для редактирования/добавления сотрудника -->
    <div v-if="showEmployeeModal" class="modal-overlay" @click="closeEmployeeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника' }}</h3>
          <button @click="closeEmployeeModal" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveEmployee" class="employee-form">
          <div class="form-group">
            <label>ФИО:</label>
            <input 
              v-model="employeeForm.full_name" 
              type="text" 
              required
              placeholder="Иванов Иван Иванович"
            />
          </div>
          <div class="form-group">
            <label>Должность:</label>
            <select v-model="employeeForm.position_id" required>
              <option value="">Выберите должность</option>
              <option 
                v-for="position in positions" 
                :key="position.id" 
                :value="position.id"
              >
                {{ position.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Оклад:</label>
            <input 
              v-model="employeeForm.salary" 
              type="number" 
              required
              min="0"
              step="1000"
            />
          </div>
          <div class="form-group">
            <label>Дата приема:</label>
            <input 
              v-model="employeeForm.hire_date" 
              type="date" 
              required
            />
          </div>
          <div class="form-group">
            <label>Дата рождения:</label>
            <input 
              v-model="employeeForm.birth_date" 
              type="date" 
              required
            />
          </div>
          <div class="form-group">
            <label>Филиал:</label>
            <select v-model="employeeForm.branch_id" required>
              <option value="">Выберите филиал</option>
              <option 
                v-for="branch in allBranches" 
                :key="branch.id" 
                :value="branch.id"
              >
                {{ branch.name }}
              </option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-save">
              {{ editingEmployee ? 'Сохранить' : 'Добавить' }}
            </button>
            <button type="button" @click="closeEmployeeModal" class="btn-cancel">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, h, onMounted } from 'vue'
import axios from 'axios'

// API базовый URL
const API_BASE = 'http://localhost:3000/api'

// Состояние данных
const treeData = ref([])
const allBranches = ref([])
const positions = ref([])
const selectedItemId = ref(null)
const collapsedItems = ref([])
const displayedEmployees = ref([])
const loading = ref(false)
const loadingEmployees = ref(false)

// Состояние UI
const contextMenu = ref({ visible: false, x: 0, y: 0, itemId: null })
const showEmployeeModal = ref(false)
const editingEmployee = ref(null)

// Форма сотрудника
const employeeForm = ref({
  full_name: '',
  position_id: '',
  salary: '',
  hire_date: '',
  birth_date: '',
  branch_id: ''
})

// API функции
const api = {
  // Ветки
  getBranchTree: () => axios.get(`${API_BASE}/branches/tree`),
  getAllBranches: () => axios.get(`${API_BASE}/branches`),
  createBranch: (data) => axios.post(`${API_BASE}/branches`, data),
  deleteBranch: (id) => axios.delete(`${API_BASE}/branches/${id}`),
  
  // Сотрудники
  getEmployeesByBranchTree: (branchId) => axios.get(`${API_BASE}/employees/branch-tree/${branchId}`),
  createEmployee: (data) => axios.post(`${API_BASE}/employees`, data),
  updateEmployee: (id, data) => axios.put(`${API_BASE}/employees/${id}`, data),
  deleteEmployee: (id) => axios.delete(`${API_BASE}/employees/${id}`),
  
  // Должности
  getPositions: () => axios.get(`${API_BASE}/positions`)
}

// Загрузка данных
async function loadInitialData() {
  loading.value = true
  try {
    const [treeResponse, branchesResponse, positionsResponse] = await Promise.all([
      api.getBranchTree(),
      api.getAllBranches(),
      api.getPositions()
    ])
    
    treeData.value = treeResponse.data
    allBranches.value = branchesResponse.data
    positions.value = positionsResponse.data
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    alert('Ошибка загрузки данных. Проверьте подключение к серверу.')
  } finally {
    loading.value = false
  }
}

// Загрузка сотрудников для выбранной ветки
async function loadEmployeesForBranch(branchId) {
  if (!branchId) {
    displayedEmployees.value = []
    return
  }
  
  loadingEmployees.value = true
  try {
    const response = await api.getEmployeesByBranchTree(branchId)
    displayedEmployees.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки сотрудников:', error)
    alert('Ошибка загрузки сотрудников')
  } finally {
    loadingEmployees.value = false
  }
}

// Компонент узла дерева
const TreeNode = {
  props: ['item', 'level', 'selectedId', 'collapsedItems'],
  emits: ['select', 'toggle', 'context-menu'],
  render() {
    return h('div', { class: 'tree-node-container' }, [
      h('div', {
        class: ['tree-node', { selected: this.selectedId === this.item.id }],
        onClick: () => this.$emit('select', this.item.id),
        style: { paddingLeft: (this.level * 20) + 'px' }
      }, [
        this.item.children?.length 
          ? h('span', {
              class: 'toggle-icon',
              onClick: (e) => {
                e.stopPropagation()
                this.$emit('toggle', this.item.id)
              }
            }, this.collapsedItems.includes(this.item.id) ? '▸' : '▾')
          : null,
        h('span', { class: 'node-name' }, this.item.name),
        h('span', {
          class: 'menu-icon',
          onClick: (e) => {
            e.stopPropagation()
            this.$emit('context-menu', this.item.id, e)
          }
        }, '⁝')
      ]),
      
      this.item.children?.length && !this.collapsedItems.includes(this.item.id)
        ? h('div', { class: 'tree-children' }, 
            this.item.children.map(child => 
              h(TreeNode, {
                item: child,
                level: this.level + 1,
                selectedId: this.selectedId,
                collapsedItems: this.collapsedItems,
                onSelect: id => this.$emit('select', id),
                onToggle: id => this.$emit('toggle', id),
                onContextMenu: (id, e) => this.$emit('context-menu', id, e)
              })
            )
          )
        : null
    ])
  }
}

// Основные функции
function findItem(items, id) {
  for (const item of items) {
    if (item.id === id) return item
    if (item.children) {
      const found = findItem(item.children, id)
      if (found) return found
    }
  }
  return null
}

function getSelectedItemName() {
  const buildPath = (items, id, path = []) => {
    for (const item of items) {
      const currentPath = [...path, item.name]
      if (item.id === id) {
        return currentPath
      }
      if (item.children) {
        const foundPath = buildPath(item.children, id, currentPath)
        if (foundPath) return foundPath
      }
    }
    return null
  }

  const path = buildPath(treeData.value, selectedItemId.value)
  return path ? path.join('/') : ''
}

function selectItem(id) {
  selectedItemId.value = id
  closeContextMenu()
  loadEmployeesForBranch(id)
}

function toggleCollapse(id) {
  const index = collapsedItems.value.indexOf(id)
  index === -1 ? collapsedItems.value.push(id) : collapsedItems.value.splice(index, 1)
}

function openContextMenu(id, event) {
  contextMenu.value = { 
    visible: true, 
    x: event.clientX, 
    y: event.clientY, 
    itemId: id 
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

// Модальное окно сотрудника
function openEmployeeModal(employee = null) {
  editingEmployee.value = employee
  if (employee) {
    employeeForm.value = {
      full_name: employee.full_name,
      position_id: employee.position_id,
      salary: employee.salary,
      hire_date: employee.hire_date,
      birth_date: employee.birth_date,
      branch_id: employee.branch_id
    }
  } else {
    employeeForm.value = {
      full_name: '',
      position_id: '',
      salary: '',
      hire_date: '',
      birth_date: '',
      branch_id: selectedItemId.value || ''
    }
  }
  showEmployeeModal.value = true
}

function closeEmployeeModal() {
  showEmployeeModal.value = false
  editingEmployee.value = null
}

async function saveEmployee() {
  try {
    const data = {
      fullname: employeeForm.value.full_name,
      positionId: employeeForm.value.position_id,
      salary: Number(employeeForm.value.salary),
      hireDate: employeeForm.value.hire_date,
      birthDate: employeeForm.value.birth_date,
      branchId: employeeForm.value.branch_id
    }

    if (editingEmployee.value) {
      await api.updateEmployee(editingEmployee.value.id, data)
    } else {
      await api.createEmployee(data)
    }

    closeEmployeeModal()
    loadEmployeesForBranch(selectedItemId.value)
  } catch (error) {
    console.error('Ошибка сохранения сотрудника:', error)
    alert('Ошибка сохранения сотрудника')
  }
}

// Действия с сотрудниками
function addEmployee() {
  if (!selectedItemId.value) return
  openEmployeeModal()
}

function addEmployeeToItem(itemId) {
  selectedItemId.value = itemId
  openEmployeeModal()
  closeContextMenu()
}

function editEmployee(employee) {
  openEmployeeModal(employee)
}

async function deleteEmployee(employeeId) {
  if (!confirm('Удалить сотрудника?')) return
  
  try {
    await api.deleteEmployee(employeeId)
    loadEmployeesForBranch(selectedItemId.value)
  } catch (error) {
    console.error('Ошибка удаления сотрудника:', error)
    alert('Ошибка удаления сотрудника')
  }
}

// Действия с ветками
async function addChildItem(parentId) {
  const name = prompt('Введите название нового подразделения:')
  if (!name) return
  
  try {
    await api.createBranch({ name, parent_id: parentId })
    loadInitialData()
  } catch (error) {
    console.error('Ошибка создания подразделения:', error)
    alert('Ошибка создания подразделения')
  }
  closeContextMenu()
}

async function deleteItem(itemId) {
  if (!confirm('Удалить подразделение? Все связанные сотрудники будут также удалены.')) return
  
  try {
    await api.deleteBranch(itemId)
    if (selectedItemId.value === itemId) {
      selectedItemId.value = null
      displayedEmployees.value = []
    }
    loadInitialData()
  } catch (error) {
    console.error('Ошибка удаления подразделения:', error)
    alert('Ошибка удаления подразделения')
  }
  closeContextMenu()
}

function expandAll(item) {
  collapsedItems.value = collapsedItems.value.filter(id => id !== item.id)
  item.children?.forEach(expandAll)
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU')
}

// Закрытие контекстного меню при клике вне его
document.addEventListener('click', closeContextMenu)

// Загрузка данных при монтировании
onMounted(() => {
  loadInitialData()
})
</script>

<style>
.admin-app {
  display: flex;
  height: auto;
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri;
  
}

.panel-header {
  padding: 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}


.tree-panel {
  width: auto;
  border-right: 2px solid #eee;
  background: #ffffff;
  overflow-y: auto;
  
}

.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  
}

.tree-node-container {
  user-select: none;
}

.tree-node {
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  border-bottom: 1px solid #eee;
}

.tree-node:hover {
  background: #f0f0f0;
}

.tree-node.selected {
  background: #e3f2fd;
  color: #1976d2;
}

.toggle-icon {
  width: 12px;
  text-align: center;
  font-size: 12px;
  border-radius: 5px;
}

.node-name {
  flex: 1;
}

.menu-icon {
  opacity: 0;
  cursor: pointer;
  padding: 0 5px;
}
.tree-node:hover .menu-icon {
  opacity: 1;
}

.menu-icon:hover {
  background: #ddd;
  border-radius: 3px;
}

.table-container {
  flex: 1;
  overflow: auto;
  padding: 0px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0px;
}

.data-table th,
.data-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.data-table th {
  background: #f5f5f5;
  font-weight: bold;
}

.data-table tr:nth-child(even) {
  background: #f9f9f9;
}

.empty-state {
  text-align: center;
  padding: 50px;
  color: #666;
}

.context-menu {
  position: absolute;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1000;
  min-width: 200px;
}

.context-menu-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.context-menu-item:last-child {
  border-bottom: none;
}

.context-menu-item:hover {
  background: #f0f0f0;
}

.context-menu-item.danger {
  color: #d32f2f;
}

.context-menu-item.danger:hover {
  background: #ffebee;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.selected-info {
  margin-left: 10px;
  color: #666;
  font-style: italic;
}

.btn-edit {
  background: #1976d2;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  margin-right: 5px;
}

.btn-edit:hover {
  background: #1565c0;
}

.btn-delete {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
}

.btn-delete:hover {
  background: #c62828;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.employee-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: bold;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1976d2;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-save {
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save:hover {
  background: #45a049;
}

.btn-cancel {
  background: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #da190b;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>