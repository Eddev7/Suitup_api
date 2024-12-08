import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const prisma = new PrismaClient();
const app = express();
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

// Função para gerar token JWT
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
};

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token necessário' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Rota para registro de cliente
app.post('/register', async (req, res) => {
  const { nome, sobrenome, email, cpf, genero, senha } = req.body;
  const hashedPassword = await bcrypt.hash(senha, 10);
  try {
    const customer = await prisma.customer.create({
      data: { nome, sobrenome, email, cpf, genero, senha: hashedPassword },
    });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar usuário', details: error.message });
  }
});

// Rota de login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const customer = await prisma.customer.findUnique({ where: { email } });

  if (customer && (await bcrypt.compare(senha, customer.senha))) {
    const token = generateToken(customer);
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Credenciais inválidas' });
  }
});

// Rotas de Customers (Autenticadas)
app.get('/customers', authenticateToken, async (req, res) => {
  const customers = await prisma.customer.findMany();
  res.json(customers);
});

// CRUD Products
app.get('/products', async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products)
});

app.get('/products/delay', async (req, res) => {
  const products = await prisma.product.findMany();
  setTimeout(() => {res.json(products)}, 2000)
});


app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id: Number(id) }})
  res.json(product);
})

app.post('/products', async (req, res) => {
  const product = await prisma.product.create({ data: req.body });
  res.json(product);
});

app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.update({
    where: { id: Number(id) },
    data: req.body,
  });
  res.json(product);
});

app.delete('/products/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: 'Produto deletado' });
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
