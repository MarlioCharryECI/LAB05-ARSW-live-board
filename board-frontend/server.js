const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// Servir archivos estáticos del directorio dist
app.use(express.static(path.join(__dirname, 'dist')));

// Para SPA - enviar todas las rutas a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
