<template>
  <div class="theme-customizer">
    <h3>Настроить тему</h3>
    <div class="form-group">
      <label>Цвет фона панели:</label>
      <input type="color" v-model="theme.panelBg" @input="updateTheme" />
    </div>
    <div class="form-group">
      <label>Цвет фона заголовка:</label>
      <input type="color" v-model="theme.headerBg" @input="updateTheme" />
    </div>
    <div class="form-group">
      <label>Стиль шрифта:</label>
      <select v-model="theme.fontFamily" @change="updateTheme">
        <option value="'Gill Sans', 'Gill Sans MT', Calibri">Gill Sans</option>
        <option value="'Times New Roman', Times, serif">Times New Roman</option>
        <option value="'Arial', sans-serif">Arial</option>
        <option value="'Courier New', Courier, monospace">Courier New</option>
      </select>
    </div>
    <div class="form-group">
      <label>Размер шрифта:</label>
      <input type="range" min="12" max="20" v-model="theme.fontSize" @input="updateTheme" />
      <span>{{ theme.fontSize }}px</span>
    </div>
    <button @click="resetTheme">Сбросить настройки</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const theme = ref({
  panelBg: '#ffffff',
  headerBg: '#f5f5f5',
  fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri",
  fontSize: 14,
});

const updateTheme = () => {
  localStorage.setItem('themeSettings', JSON.stringify(theme.value));
  applyTheme();
};

const applyTheme = () => {
  const root = document.documentElement;
  root.style.setProperty('--panel-bg', theme.value.panelBg);
  root.style.setProperty('--header-bg', theme.value.headerBg);
  root.style.setProperty('--font-family', theme.value.fontFamily);
  root.style.setProperty('--font-size', `${theme.value.fontSize}px`);
};

const resetTheme = () => {
  theme.value = {
    panelBg: '#ffffff',
    headerBg: '#f5f5f5',
    fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri",
    fontSize: 14,
  };
  updateTheme();
};

onMounted(() => {
  const savedTheme = localStorage.getItem('themeSettings');
  if (savedTheme) {
    theme.value = JSON.parse(savedTheme);
  }
  applyTheme();
});
</script>

<style scoped>
.theme-customizer {
  padding: 15px;
  background: #f9f9f9;
  border-left: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
label {
  font-weight: bold;
}
input[type="color"] {
  width: 100%;
  height: 30px;
  padding: 0;
  border: 1px solid #ccc;
  cursor: pointer;
}
select, input[type="range"] {
  width: 100%;
  padding: 5px;
}
</style>
