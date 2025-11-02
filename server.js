const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const session = require("express-session");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const expressLayouts = require("express-ejs-layouts");

dotenv.config();
const app = express();

/* ---------- View engine + Layout ---------- */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout"); // views/layout.ejs

/* ---------- Middlewares ---------- */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
  })
);

/* ---------- “Banco” JSON ---------- */
const DB_PATH = path.join(__dirname, "data", "db.json");
function readDB() {
  if (!fs.existsSync(DB_PATH)) return { properties: [] };
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw || "{}") || { properties: [] };
  } catch {
    return { properties: [] };
  }
}
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

/* ---------- Uploads ---------- */
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname || "")}`),
});
const upload = multer({ storage });

/* ---------- Auth ---------- */
function requireLogin(req, res, next) {
  if (req.session && req.session.isAuth) return next();
  return res.redirect("/admin/login");
}

/* ---------- Variáveis globais p/ views ---------- */
app.use((req, res, next) => {
  res.locals.sessao = req.session;
  res.locals.SITE_NOME = process.env.SITE_NOME || "Corretor de Imóveis";
  next();
});

/* ---------- Rotas Públicas ---------- */
app.get("/", (req, res) => {
  const db = readDB();
  const props = db.properties.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.render("index", { properties: props });
});

app.get("/imovel/:id", (req, res) => {
  const db = readDB();
  const prop = db.properties.find((p) => p.id === req.params.id);
  if (!prop) return res.status(404).send("Imóvel não encontrado.");
  res.render("property", { property: prop });
});

/* ---------- Admin ---------- */
app.get("/admin/login", (req, res) => {
  if (req.session.isAuth) return res.redirect("/admin");
  res.render("admin/login", { error: null });
});

app.post("/admin/login", (req, res) => {
  const { user, pass } = req.body;
  const u = process.env.ADMIN_USER || "admin";
  const p = process.env.ADMIN_PASS || "123456";
  if (user === u && pass === p) {
    req.session.isAuth = true;
    return res.redirect("/admin");
  }
  res.status(401).render("admin/login", { error: "Credenciais inválidas." });
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

app.get("/admin", requireLogin, (req, res) => {
  const db = readDB();
  const props = db.properties.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.render("admin/dashboard", { properties: props });
});

app.get("/admin/novo", requireLogin, (req, res) => {
  res.render("admin/new");
});

app.post("/admin/novo", requireLogin, upload.array("images", 12), (req, res) => {
  const { title, description, price, address } = req.body;
  if (!title) return res.status(400).send("Título é obrigatório.");

  const db = readDB();
  const images = (req.files || []).map((f) => `/public/uploads/${f.filename}`);

  const novo = {
    id: uuidv4(),
    title,
    description: description || "",
    price: price || "",
    address: address || "",
    images,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  db.properties.push(novo);
  writeDB(db);
  res.redirect("/admin");
});

app.get("/admin/editar/:id", requireLogin, (req, res) => {
  const db = readDB();
  const prop = db.properties.find((p) => p.id === req.params.id);
  if (!prop) return res.status(404).send("Imóvel não encontrado.");
  res.render("admin/edit", { property: prop });
});

app.post("/admin/editar/:id", requireLogin, upload.array("newImages", 12), (req, res) => {
  const db = readDB();
  const prop = db.properties.find((p) => p.id === req.params.id);
  if (!prop) return res.status(404).send("Imóvel não encontrado.");

  const { title, description, price, address } = req.body;
  if (title) prop.title = title;
  if (description !== undefined) prop.description = description;
  if (price !== undefined) prop.price = price;
  if (address !== undefined) prop.address = address;

  if (req.files && req.files.length) {
    const imgs = req.files.map((f) => `/public/uploads/${f.filename}`);
    prop.images.push(...imgs);
  }

  prop.updatedAt = Date.now();
  writeDB(db);
  res.redirect("/admin");
});

app.post("/admin/deletar/:id", requireLogin, (req, res) => {
  const db = readDB();
  db.properties = db.properties.filter((p) => p.id !== req.params.id);
  writeDB(db);
  res.redirect("/admin");
});

/* ---------- Seed (temporário, protegido) ----------
   Acesse /admin/seed após logar uma vez para criar 1 imóvel de exemplo.
   Depois REMOVA essa rota. */
app.get("/admin/seed", requireLogin, (req, res) => {
  const db = readDB();
  if (!db.properties.some((p) => p.title === "Casa de Exemplo - Centro")) {
    db.properties.push({
      id: uuidv4(),
      title: "Casa de Exemplo - Centro",
      description:
        "Casa térrea com 2 quartos, 1 suíte, sala ampla, cozinha planejada e garagem para 2 carros.",
      price: "R$ 350.000",
      address: "Centro - Cesário Lange/SP",
      images: [], // adicione depois via edição ou novo cadastro
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    writeDB(db);
  }
  res.redirect("/admin");
});

/* ---------- Start ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
