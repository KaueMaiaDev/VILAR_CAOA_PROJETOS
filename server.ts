import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import Database from "better-sqlite3";
import { z } from "zod";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

// --- DATABASE SETUP ---
// DATA_DIR should point at a persistent volume in production (e.g. Render Disk mounted at /data).
// Falls back to a local ./data folder for development.
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, "database.sqlite");

const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS responsables (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL DEFAULT '',
    area TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    telefone TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS projetos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL DEFAULT '',
    area TEXT NOT NULL DEFAULT 'Geral',
    dataInicio TEXT NOT NULL DEFAULT '',
    dataPrevistaConclusao TEXT NOT NULL DEFAULT '',
    prioridade TEXT NOT NULL DEFAULT 'Media',
    status TEXT NOT NULL DEFAULT 'Planejamento'
  );

  CREATE TABLE IF NOT EXISTS demandas (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL DEFAULT '',
    solicitante TEXT NOT NULL DEFAULT 'Não informado',
    dataRecebimento TEXT NOT NULL DEFAULT '',
    prioridade TEXT NOT NULL DEFAULT 'Media',
    status TEXT NOT NULL DEFAULT 'Nova',
    projetoCriadoId TEXT
  );

  CREATE TABLE IF NOT EXISTS atividades (
    id TEXT PRIMARY KEY,
    projetoId TEXT NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL DEFAULT '',
    responsavelId TEXT NOT NULL DEFAULT '',
    dataInicio TEXT NOT NULL DEFAULT '',
    dataLimite TEXT NOT NULL DEFAULT '',
    prioridade TEXT NOT NULL DEFAULT 'Media',
    status TEXT NOT NULL DEFAULT 'Pendente'
  );

  CREATE TABLE IF NOT EXISTS comentarios (
    id TEXT PRIMARY KEY,
    atividadeId TEXT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
    autor TEXT NOT NULL DEFAULT '',
    texto TEXT NOT NULL DEFAULT '',
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS anexos (
    id TEXT PRIMARY KEY,
    atividadeId TEXT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
    nomeArquivo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    tamanho TEXT NOT NULL DEFAULT '',
    dataAnexo TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS historico (
    id TEXT PRIMARY KEY,
    atividadeId TEXT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_atividades_projeto ON atividades(projetoId);
  CREATE INDEX IF NOT EXISTS idx_atividades_responsavel ON atividades(responsavelId);
  CREATE INDEX IF NOT EXISTS idx_comentarios_atividade ON comentarios(atividadeId);
  CREATE INDEX IF NOT EXISTS idx_anexos_atividade ON anexos(atividadeId);
  CREATE INDEX IF NOT EXISTS idx_historico_atividade ON historico(atividadeId);
`);

// Seed a default responsible on first run only
const seedCount = db.prepare("SELECT COUNT(*) as c FROM responsables").get() as { c: number };
if (seedCount.c === 0) {
  db.prepare(
    "INSERT INTO responsables (id, nome, cargo, area, email, telefone) VALUES (?, ?, ?, ?, ?, ?)"
  ).run("r1", "Vilar", "Gerente de Inovação e Projetos", "Inovação", "vilar@empresa.com", "");
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function nowTimestamp() {
  return new Date().toISOString().replace("T", " ").substring(0, 16);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// --- SECURITY & MIDDLEWARE ---
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: "2mb" }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Dados inválidos", details: result.error.flatten() });
    }
    req.body = result.data;
    next();
  };
}

const prioridadeEnum = z.enum(["Baixa", "Media", "Alta", "Critica"]);
const dateStr = z.string().trim().max(10);
const text = (max: number) => z.string().trim().max(max);

const demandaSchema = z.object({
  titulo: text(200).min(1),
  descricao: text(5000).optional().default(""),
  solicitante: text(200).optional().default("Não informado"),
  dataRecebimento: dateStr.optional().default(() => today()),
  prioridade: prioridadeEnum.optional().default("Media"),
  status: z.enum(["Nova", "Em analise", "Aprovada", "Rejeitada", "Transformada em Projeto"]).optional(),
}).partial({ titulo: true }).refine((d) => d.titulo === undefined || d.titulo.length > 0, { message: "titulo é obrigatório" });

const projetoSchema = z.object({
  nome: text(200),
  descricao: text(5000).optional(),
  area: text(100).optional(),
  dataInicio: dateStr.optional(),
  dataPrevistaConclusao: dateStr.optional(),
  prioridade: prioridadeEnum.optional(),
  status: z.enum(["Planejamento", "Em andamento", "Pausado", "Concluido"]).optional(),
}).partial();

const responsavelSchema = z.object({
  nome: text(200),
  cargo: text(200).optional(),
  area: text(200).optional(),
  email: text(200).optional(),
  telefone: text(50).optional(),
}).partial();

const atividadeSchema = z.object({
  projetoId: z.string().max(100),
  nome: text(200),
  descricao: text(5000).optional(),
  responsavelId: z.string().max(100).optional(),
  dataInicio: dateStr.optional(),
  dataLimite: dateStr.optional(),
  prioridade: prioridadeEnum.optional(),
  status: z.enum(["Pendente", "Em andamento", "Pausado", "Em validacao", "Concluido", "Cancelado"]).optional(),
}).partial();

const comentarioSchema = z.object({
  autor: text(200).optional().default("Vilar"),
  texto: text(5000).min(1),
});

const anexoSchema = z.object({
  nomeArquivo: text(300).optional().default("anexo.png"),
  tamanho: text(50).optional().default("150 KB"),
});

// --- PREPARED STATEMENTS ---
const stmts = {
  listDemandas: db.prepare("SELECT * FROM demandas ORDER BY rowid DESC"),
  insertDemanda: db.prepare(
    "INSERT INTO demandas (id, titulo, descricao, solicitante, dataRecebimento, prioridade, status) VALUES (@id, @titulo, @descricao, @solicitante, @dataRecebimento, @prioridade, @status)"
  ),
  getDemanda: db.prepare("SELECT * FROM demandas WHERE id = ?"),
  deleteDemanda: db.prepare("DELETE FROM demandas WHERE id = ?"),

  listProjetos: db.prepare("SELECT * FROM projetos ORDER BY rowid DESC"),
  insertProjeto: db.prepare(
    "INSERT INTO projetos (id, nome, descricao, area, dataInicio, dataPrevistaConclusao, prioridade, status) VALUES (@id, @nome, @descricao, @area, @dataInicio, @dataPrevistaConclusao, @prioridade, @status)"
  ),
  getProjeto: db.prepare("SELECT * FROM projetos WHERE id = ?"),
  deleteProjeto: db.prepare("DELETE FROM projetos WHERE id = ?"),

  listResponsables: db.prepare("SELECT * FROM responsables ORDER BY rowid ASC"),
  insertResponsavel: db.prepare(
    "INSERT INTO responsables (id, nome, cargo, area, email, telefone) VALUES (@id, @nome, @cargo, @area, @email, @telefone)"
  ),
  getResponsavel: db.prepare("SELECT * FROM responsables WHERE id = ?"),
  deleteResponsavel: db.prepare("DELETE FROM responsables WHERE id = ?"),
  clearResponsavelFromAtividades: db.prepare("UPDATE atividades SET responsavelId = '' WHERE responsavelId = ?"),

  listAtividades: db.prepare("SELECT * FROM atividades ORDER BY rowid DESC"),
  insertAtividade: db.prepare(
    "INSERT INTO atividades (id, projetoId, nome, descricao, responsavelId, dataInicio, dataLimite, prioridade, status) VALUES (@id, @projetoId, @nome, @descricao, @responsavelId, @dataInicio, @dataLimite, @prioridade, @status)"
  ),
  getAtividade: db.prepare("SELECT * FROM atividades WHERE id = ?"),
  deleteAtividade: db.prepare("DELETE FROM atividades WHERE id = ?"),

  listComentarios: db.prepare("SELECT * FROM comentarios WHERE atividadeId = ? ORDER BY rowid ASC"),
  insertComentario: db.prepare(
    "INSERT INTO comentarios (id, atividadeId, autor, texto, data) VALUES (@id, @atividadeId, @autor, @texto, @data)"
  ),

  listHistorico: db.prepare("SELECT * FROM historico WHERE atividadeId = ? ORDER BY rowid ASC"),
  insertHistorico: db.prepare(
    "INSERT INTO historico (id, atividadeId, descricao, data) VALUES (@id, @atividadeId, @descricao, @data)"
  ),

  listAnexos: db.prepare("SELECT * FROM anexos WHERE atividadeId = ? ORDER BY rowid ASC"),
  insertAnexo: db.prepare(
    "INSERT INTO anexos (id, atividadeId, nomeArquivo, tipo, tamanho, dataAnexo) VALUES (@id, @atividadeId, @nomeArquivo, @tipo, @tamanho, @dataAnexo)"
  ),
  getAnexo: db.prepare("SELECT * FROM anexos WHERE id = ?"),
  deleteAnexo: db.prepare("DELETE FROM anexos WHERE id = ?"),
};

function buildUpdate(table: string, id: string, fields: Record<string, unknown>) {
  const keys = Object.keys(fields).filter((k) => fields[k] !== undefined);
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = @id`).run({ ...fields, id });
}

// --- HEALTH CHECK ---
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

// --- 1. DEMANDAS API ---
app.get("/api/demandas", (req, res) => {
  res.json(stmts.listDemandas.all());
});

app.post("/api/demandas", validateBody(demandaSchema), (req, res) => {
  const nova = {
    id: newId("dem"),
    titulo: req.body.titulo ?? "",
    descricao: req.body.descricao ?? "",
    solicitante: req.body.solicitante ?? "Não informado",
    dataRecebimento: req.body.dataRecebimento || today(),
    prioridade: req.body.prioridade ?? "Media",
    status: req.body.status ?? "Nova",
  };
  stmts.insertDemanda.run(nova);
  res.status(201).json(nova);
});

app.put("/api/demandas/:id", validateBody(demandaSchema), (req, res) => {
  const existing = stmts.getDemanda.get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Demanda não encontrada" });
  buildUpdate("demandas", req.params.id, req.body);
  res.json(stmts.getDemanda.get(req.params.id));
});

app.post("/api/demandas/:id/converter", (req, res) => {
  const demanda = stmts.getDemanda.get(req.params.id) as any;
  if (!demanda) return res.status(404).json({ error: "Demanda não encontrada" });

  const result = db.transaction(() => {
    const novoProjeto = {
      id: newId("proj"),
      nome: demanda.titulo,
      descricao: demanda.descricao,
      area: "Inovação",
      dataInicio: today(),
      dataPrevistaConclusao: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      prioridade: demanda.prioridade,
      status: "Planejamento",
    };
    stmts.insertProjeto.run(novoProjeto);
    buildUpdate("demandas", demanda.id, { status: "Transformada em Projeto", projetoCriadoId: novoProjeto.id });
    return { projeto: novoProjeto, demanda: stmts.getDemanda.get(demanda.id) };
  })();

  res.json({ success: true, ...result });
});

app.delete("/api/demandas/:id", (req, res) => {
  stmts.deleteDemanda.run(req.params.id);
  res.json({ success: true });
});

// --- 2. PROJETOS API ---
app.get("/api/projetos", (req, res) => {
  res.json(stmts.listProjetos.all());
});

app.post("/api/projetos", validateBody(projetoSchema), (req, res) => {
  const novo = {
    id: newId("proj"),
    nome: req.body.nome ?? "",
    descricao: req.body.descricao ?? "",
    area: req.body.area || "Geral",
    dataInicio: req.body.dataInicio || today(),
    dataPrevistaConclusao: req.body.dataPrevistaConclusao ?? "",
    prioridade: req.body.prioridade ?? "Media",
    status: req.body.status ?? "Planejamento",
  };
  stmts.insertProjeto.run(novo);
  res.status(201).json(novo);
});

app.put("/api/projetos/:id", validateBody(projetoSchema), (req, res) => {
  const existing = stmts.getProjeto.get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Projeto não encontrado" });
  buildUpdate("projetos", req.params.id, req.body);
  res.json(stmts.getProjeto.get(req.params.id));
});

app.delete("/api/projetos/:id", (req, res) => {
  // ON DELETE CASCADE takes care of atividades, comentarios, anexos and historico.
  stmts.deleteProjeto.run(req.params.id);
  res.json({ success: true });
});

// --- 3. RESPONSÁVEIS API ---
app.get("/api/responsables", (req, res) => {
  res.json(stmts.listResponsables.all());
});

app.post("/api/responsables", validateBody(responsavelSchema), (req, res) => {
  const novo = {
    id: newId("resp"),
    nome: req.body.nome ?? "",
    cargo: req.body.cargo ?? "",
    area: req.body.area ?? "",
    email: req.body.email ?? "",
    telefone: req.body.telefone ?? "",
  };
  stmts.insertResponsavel.run(novo);
  res.status(201).json(novo);
});

app.put("/api/responsables/:id", validateBody(responsavelSchema), (req, res) => {
  const existing = stmts.getResponsavel.get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Responsável não encontrado" });
  buildUpdate("responsables", req.params.id, req.body);
  res.json(stmts.getResponsavel.get(req.params.id));
});

app.delete("/api/responsables/:id", (req, res) => {
  db.transaction(() => {
    stmts.deleteResponsavel.run(req.params.id);
    stmts.clearResponsavelFromAtividades.run(req.params.id);
  })();
  res.json({ success: true });
});

// --- 4. ATIVIDADES API ---
app.get("/api/atividades", (req, res) => {
  res.json(stmts.listAtividades.all());
});

app.post("/api/atividades", validateBody(atividadeSchema.required({ nome: true, projetoId: true })), (req, res) => {
  const nova = {
    id: newId("ativ"),
    projetoId: req.body.projetoId,
    nome: req.body.nome,
    descricao: req.body.descricao ?? "",
    responsavelId: req.body.responsavelId ?? "",
    dataInicio: req.body.dataInicio || today(),
    dataLimite: req.body.dataLimite ?? "",
    prioridade: req.body.prioridade ?? "Media",
    status: req.body.status ?? "Pendente",
  };

  db.transaction(() => {
    stmts.insertAtividade.run(nova);
    stmts.insertHistorico.run({
      id: newId("hist"),
      atividadeId: nova.id,
      descricao: "Atividade criada",
      data: nowTimestamp(),
    });
  })();

  res.status(201).json(nova);
});

app.put("/api/atividades/:id", validateBody(atividadeSchema), (req, res) => {
  const antiga = stmts.getAtividade.get(req.params.id) as any;
  if (!antiga) return res.status(404).json({ error: "Atividade não encontrada" });

  db.transaction(() => {
    buildUpdate("atividades", req.params.id, req.body);
    const timestamp = nowTimestamp();

    if (req.body.status !== undefined && req.body.status !== antiga.status) {
      stmts.insertHistorico.run({
        id: newId("hist"),
        atividadeId: req.params.id,
        descricao: `Status alterado para ${req.body.status}`,
        data: timestamp,
      });
    }
    if (req.body.dataLimite !== undefined && req.body.dataLimite !== antiga.dataLimite) {
      stmts.insertHistorico.run({
        id: newId("hist"),
        atividadeId: req.params.id,
        descricao: `Prazo alterado para ${req.body.dataLimite}`,
        data: timestamp,
      });
    }
    if (req.body.responsavelId !== undefined && req.body.responsavelId !== antiga.responsavelId) {
      const resp = req.body.responsavelId ? (stmts.getResponsavel.get(req.body.responsavelId) as any) : null;
      stmts.insertHistorico.run({
        id: newId("hist"),
        atividadeId: req.params.id,
        descricao: `Responsável alterado para ${resp ? resp.nome : "Nenhum"}`,
        data: timestamp,
      });
    }
  })();

  res.json(stmts.getAtividade.get(req.params.id));
});

app.delete("/api/atividades/:id", (req, res) => {
  // ON DELETE CASCADE takes care of comentarios, anexos and historico.
  stmts.deleteAtividade.run(req.params.id);
  res.json({ success: true });
});

// --- 5. COMENTARIOS API ---
app.get("/api/atividades/:ativId/comentarios", (req, res) => {
  res.json(stmts.listComentarios.all(req.params.ativId));
});

app.post("/api/atividades/:ativId/comentarios", validateBody(comentarioSchema), (req, res) => {
  const ativ = stmts.getAtividade.get(req.params.ativId);
  if (!ativ) return res.status(404).json({ error: "Atividade não encontrada" });

  const novo = {
    id: newId("com"),
    atividadeId: req.params.ativId,
    autor: req.body.autor,
    texto: req.body.texto,
    data: nowTimestamp(),
  };

  db.transaction(() => {
    stmts.insertComentario.run(novo);
    stmts.insertHistorico.run({
      id: newId("hist"),
      atividadeId: req.params.ativId,
      descricao: "Comentário adicionado",
      data: novo.data,
    });
  })();

  res.status(201).json(novo);
});

// --- 6. HISTORICO API ---
app.get("/api/atividades/:ativId/historico", (req, res) => {
  res.json(stmts.listHistorico.all(req.params.ativId));
});

// --- 7. ANEXOS API ---
app.get("/api/atividades/:ativId/anexos", (req, res) => {
  res.json(stmts.listAnexos.all(req.params.ativId));
});

app.post("/api/atividades/:ativId/anexos", validateBody(anexoSchema), (req, res) => {
  const ativ = stmts.getAtividade.get(req.params.ativId);
  if (!ativ) return res.status(404).json({ error: "Atividade não encontrada" });

  const name = req.body.nomeArquivo;
  let ext = "Outro";
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) ext = "PDF";
  else if (lower.endsWith(".docx")) ext = "DOCX";
  else if (lower.endsWith(".xlsx")) ext = "XLSX";
  else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) ext = "JPG";
  else if (lower.endsWith(".png")) ext = "PNG";

  const novo = {
    id: newId("ax"),
    atividadeId: req.params.ativId,
    nomeArquivo: name,
    tipo: ext,
    tamanho: req.body.tamanho,
    dataAnexo: today(),
  };

  db.transaction(() => {
    stmts.insertAnexo.run(novo);
    stmts.insertHistorico.run({
      id: newId("hist"),
      atividadeId: req.params.ativId,
      descricao: `Anexo adicionado: ${novo.nomeArquivo}`,
      data: nowTimestamp(),
    });
  })();

  res.status(201).json(novo);
});

app.delete("/api/anexos/:id", (req, res) => {
  const target = stmts.getAnexo.get(req.params.id) as any;
  if (target) {
    db.transaction(() => {
      stmts.deleteAnexo.run(req.params.id);
      stmts.insertHistorico.run({
        id: newId("hist"),
        atividadeId: target.atividadeId,
        descricao: `Anexo removido: ${target.nomeArquivo}`,
        data: nowTimestamp(),
      });
    })();
  }
  res.json({ success: true });
});

// --- 8. DASHBOARD METRICS API (agregações no banco, sem carregar tudo em memória) ---
app.get("/api/dashboard", (req, res) => {
  const projetosPorStatus = db
    .prepare("SELECT status, COUNT(*) as c FROM projetos GROUP BY status")
    .all() as { status: string; c: number }[];
  const atividadesPorStatus = db
    .prepare("SELECT status, COUNT(*) as c FROM atividades GROUP BY status")
    .all() as { status: string; c: number }[];

  const pCount = (statuses: string[]) =>
    projetosPorStatus.filter((p) => statuses.includes(p.status)).reduce((sum, p) => sum + p.c, 0);
  const aCount = (statuses: string[]) =>
    atividadesPorStatus.filter((a) => statuses.includes(a.status)).reduce((sum, a) => sum + a.c, 0);

  const totalProjetos = projetosPorStatus.reduce((sum, p) => sum + p.c, 0);
  const totalAtividades = atividadesPorStatus.reduce((sum, a) => sum + a.c, 0);

  const atrasadas = db
    .prepare(
      "SELECT COUNT(*) as c FROM atividades WHERE status NOT IN ('Concluido','Cancelado') AND dataLimite != '' AND dataLimite < ?"
    )
    .get(today()) as { c: number };

  res.json({
    totalProjetos,
    projetosAtivos: pCount(["Em andamento", "Planejamento"]),
    projetosPausados: pCount(["Pausado"]),
    projetosConcluidos: pCount(["Concluido"]),
    totalAtividades,
    atividadesPendentes: aCount(["Pendente"]),
    atividadesEmAndamento: aCount(["Em andamento", "Em validacao", "Pausado"]),
    atividadesConcluidas: aCount(["Concluido"]),
    atividadesAtrasadas: atrasadas.c,
  });
});

// --- 9. SYSTEM MAINTENANCE API (Reset Database) ---
// Protected: requires ADMIN_RESET_TOKEN to be set and matched via header, to avoid
// exposing a destructive, unauthenticated data-wipe endpoint in production.
app.post("/api/reset-db", (req, res) => {
  const configuredToken = process.env.ADMIN_RESET_TOKEN;
  if (!configuredToken) {
    return res.status(403).json({ error: "Recurso desabilitado: ADMIN_RESET_TOKEN não configurado." });
  }
  if (req.get("x-admin-token") !== configuredToken) {
    return res.status(401).json({ error: "Token de administrador inválido." });
  }

  db.transaction(() => {
    db.exec(
      "DELETE FROM historico; DELETE FROM anexos; DELETE FROM comentarios; DELETE FROM atividades; DELETE FROM demandas; DELETE FROM projetos; DELETE FROM responsables;"
    );
    stmts.insertResponsavel.run({
      id: "r1",
      nome: "Vilar",
      cargo: "Gerente de Inovação e Projetos",
      area: "Inovação",
      email: "vilar@empresa.com",
      telefone: "",
    });
  })();

  res.json({ success: true, message: "Banco de dados limpo com sucesso!" });
});

// --- Vite (dev) / static (prod) serving ---
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { maxAge: "1y", index: false }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer();
