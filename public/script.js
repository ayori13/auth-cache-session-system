document.addEventListener('DOMContentLoaded', () => {
    // Переключение вкладок
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Убираем активный класс со всех кнопок и контентов
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Добавляем активный класс к нажатой кнопке и соответствующему контенту
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`${tabId}-form`).classList.add('active');
      });
    });
    
    // Применение темы
    const applyTheme = (theme) => {
        const themeToggle = document.getElementById('theme-toggle');
        const themeText = document.getElementById('theme-text');
        
        if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.checked = true;
        themeText.textContent = 'Тёмная тема';
        } else {
        document.body.classList.remove('dark-theme');
        themeToggle.checked = false;
        themeText.textContent = 'Светлая тема';
        }
        
        localStorage.setItem('theme', theme);
    };
    
    // Загрузка темы из localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    // Обработка переключения темы
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        applyTheme(theme);
        });
    }
  
    // Проверка авторизации при загрузке страницы
    const checkAuth = async () => {
      try {
        const response = await fetch('/profile');
        if (response.ok) {
          const data = await response.json();
          showProfile(data.username);
          loadData();
        } else {
          showAuth();
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        showAuth();
      }
    };
  
    // Отображение профиля
    const showProfile = (username) => {
      document.getElementById('auth-container').style.display = 'none';
      document.getElementById('profile-container').style.display = 'block';
      document.getElementById('username').textContent = username;
    };
  
    // Отображение авторизации
    const showAuth = () => {
      document.getElementById('auth-container').style.display = 'block';
      document.getElementById('profile-container').style.display = 'none';
    };
  
    // Загрузка данных
    const loadData = async () => {
      try {
        const response = await fetch('/data');
        if (response.ok) {
          const data = await response.json();
          displayData(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };
  
    // Отображение данных
    const displayData = (data) => {
      const dataContent = document.getElementById('data-content');
      
      let html = `<p>Данные от: ${new Date(data.timestamp).toLocaleString()}</p>`;
      html += `<table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Значение</th>
          </tr>
        </thead>
        <tbody>`;
      
      data.items.forEach(item => {
        html += `<tr>
          <td>${item.id}</td>
          <td>${item.name}</td>
          <td>${item.value}</td>
        </tr>`;
      });
      
      html += `</tbody></table>`;
      dataContent.innerHTML = html;
    };
  
    // Обработка формы регистрации
    const registerForm = document.getElementById('register');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (password !== confirmPassword) {
          showMessage('Пароли не совпадают', 'error');
          return;
        }
        
        try {
          const response = await fetch('/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            showMessage(data.message, 'success');
            // Переключаемся на вкладку входа
            document.querySelector('[data-tab="login"]').click();
          } else {
            showMessage(data.error, 'error');
          }
        } catch (error) {
          console.error('Ошибка регистрации:', error);
          showMessage('Ошибка соединения с сервером', 'error');
        }
      });
    }
  
    // Обработка формы входа
    const loginForm = document.getElementById('login');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        try {
          const response = await fetch('/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            showMessage(data.message, 'success');
            // Проверяем авторизацию
            setTimeout(checkAuth, 1000);
          } else {
            showMessage(data.error, 'error');
          }
        } catch (error) {
          console.error('Ошибка входа:', error);
          showMessage('Ошибка соединения с сервером', 'error');
        }
      });
    }
  
    // Обработка выхода
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          const response = await fetch('/logout', {
            method: 'POST'
          });
          
          if (response.ok) {
            showAuth();
            showMessage('Выход выполнен успешно', 'success');
          }
        } catch (error) {
          console.error('Ошибка выхода:', error);
        }
      });
    }
  
    // Обработка обновления данных
    const refreshDataBtn = document.getElementById('refresh-data');
    if (refreshDataBtn) {
      refreshDataBtn.addEventListener('click', loadData);
    }
  
    // Функция отображения сообщений
    const showMessage = (message, type) => {
      const messageElement = document.getElementById('message');
      messageElement.textContent = message;
      messageElement.className = `message ${type}`;
      
      // Автоматическое скрытие сообщения через 3 секунды
      setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
      }, 3000);
    };
  
    // Проверяем авторизацию при загрузке страницы
    checkAuth();
  });