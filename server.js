const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Настройка сессий
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

const users = {};

// Middleware для проверки авторизации
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Необходима авторизация' });
};

// Кэширование данных
const CACHE_DIR = path.join(__dirname, 'cache');
const CACHE_DURATION = 60 * 1000;

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

const getCachedData = () => {
  const cacheFile = path.join(CACHE_DIR, 'data.json');
  
  // Проверяем существование и актуальность кэша
  if (fs.existsSync(cacheFile)) {
    const stats = fs.statSync(cacheFile);
    const now = new Date();
    const fileTime = new Date(stats.mtime);
    
    // Если кэш актуален (не старше 1 минуты)
    if (now - fileTime < CACHE_DURATION) {
      console.log('Возвращаем данные из кэша');
      return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    }
  }
  
  // Генерируем новые данные
  console.log('Генерируем новые данные и сохраняем в кэш');
  const newData = {
    timestamp: new Date().toISOString(),
    items: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: Math.floor(Math.random() * 100)
    }))
  };
  
  // Сохраняем в кэш
  fs.writeFileSync(cacheFile, JSON.stringify(newData), 'utf8');
  
  return newData;
};

// Роуты
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Необходимо указать логин и пароль' });
    }
    
    if (users[username]) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Сохраняем пользователя
    users[username] = {
      username,
      password: hashedPassword
    };
    
    res.status(201).json({ message: 'Регистрация успешна' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Необходимо указать логин и пароль' });
    }
    
    const user = users[username];
    
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    
    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    
    // Создаем сессию
    req.session.userId = username;
    
    res.status(200).json({ message: 'Вход выполнен успешно' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/profile', isAuthenticated, (req, res) => {
  const username = req.session.userId;
  res.json({ username });
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при выходе' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Выход выполнен успешно' });
  });
});

app.get('/data', (req, res) => {
  const data = getCachedData();
  res.json(data);
});

// Маршрут для всех остальных запросов - отдаем index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});