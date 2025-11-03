🏡 Wellington Imóveis — Sistema FullStack
📖 Descrição do Projeto

O Wellington Imóveis é um site completo desenvolvido para o corretor Wellington N. Pereira (CRECI: 282327-F), com foco em:

📋 Cadastro e gerenciamento de imóveis (venda e aluguel);

🖼️ Upload de imagens e vídeos dos imóveis via área administrativa;

🔍 Visualização pública dos anúncios com informações detalhadas;

☁️ Armazenamento de mídias no Cloudinary;

💾 Banco de dados PostgreSQL hospedado no Render;

🌐 Deploy automático no Render (Free Plan) com monitoramento pelo UptimeRobot.

🧰 Tecnologias Utilizadas

Node.js + Express.js

EJS (Embedded JavaScript Templates)

Prisma ORM

PostgreSQL (Render Database)

Cloudinary (armazenamento de mídias)

Multer (upload de arquivos)

Render (deploy fullstack)

UptimeRobot (mantém o site ativo no plano gratuito)

🗂️ Estrutura de Pastas
📦 wellington-imoveis
 ┣ 📂 src
 ┃ ┣ 📂 routes
 ┃ ┃ ┗ 📜 admin.js
 ┃ ┣ 📂 lib
 ┃ ┃ ┗ 📜 cloudinary.js
 ┃ ┗ 📂 controllers
 ┣ 📂 views
 ┃ ┣ 📂 admin
 ┃ ┃ ┣ 📜 new-property.ejs
 ┃ ┃ ┗ 📜 upload-media.ejs
 ┃ ┗ 📂 public
 ┃ ┃ ┗ 📜 home.ejs
 ┣ 📂 prisma
 ┃ ┗ 📜 schema.prisma
 ┣ 📜 server.js
 ┣ 📜 package.json
 ┣ 📜 .env.example
 ┗ 📜 README.md

⚙️ Instalação Local
1️⃣ Clonar o repositório
git clone https://github.com/seuusuario/wellington-imoveis.git
cd wellington-imoveis

2️⃣ Instalar dependências
npm install

3️⃣ Configurar variáveis de ambiente

Crie um arquivo .env na raiz com:

DATABASE_URL="postgres://USER:PASS@HOST:5432/DBNAME"
SESSION_SECRET="sua_senha"
CLOUDINARY_CLOUD_NAME="nome_cloud"
CLOUDINARY_API_KEY="api_key"
CLOUDINARY_API_SECRET="api_secret"

4️⃣ Configurar o Prisma
npx prisma generate
npx prisma migrate dev --name init

5️⃣ Rodar o servidor localmente
npm start


Acesse em:
👉 http://localhost:3000

☁️ Deploy no Render

Web Service

Runtime: Node.js

Build Command: npm install && npx prisma generate

Start Command:

npx prisma migrate deploy && node server.js


Banco de Dados

Render → PostgreSQL → copie a Internal Database URL

Adicione no Environment Variables do Web Service:

DATABASE_URL

SESSION_SECRET

CLOUDINARY_CLOUD_NAME

CLOUDINARY_API_KEY

CLOUDINARY_API_SECRET

Monitoramento

Configure o UptimeRobot pingando:
https://wellington-imoveis.onrender.com
a cada 5 minutos.

🧩 Funcionalidades Principais
🔑 Área do Corretor

Login (autenticação por sessão)

Criar novos imóveis

Editar e excluir anúncios

Upload de imagens e vídeos para cada imóvel

🏘️ Página Pública

Listagem de imóveis

Exibição de fotos e vídeos

Informações de localização, tipo, valor, etc.

Interações (ex.: “Ver mais”, “Contato via WhatsApp”)

🖼️ Banco de Dados (modelo Prisma)
model Property {
  id          Int       @id @default(autoincrement())
  title       String
  description String
  price       Decimal   @db.Numeric(12,2)
  type        String
  city        String
  state       String
  bedrooms    Int?
  bathrooms   Int?
  areaM2      Int?
  status      String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  media       Media[]
}

model Media {
  id          Int      @id @default(autoincrement())
  url         String
  thumbUrl    String?
  publicId    String
  kind        String
  orderIndex  Int      @default(0)
  propertyId  Int
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
}
