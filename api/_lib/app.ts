import express from "express";
import crypto from "crypto";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { PoolClient } from "pg";
import { pool, withTransaction } from "./db";

const app = express();

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

function asyncRoute(
  handler: (req: express.Request, res: express.Response) => Promise<unknown>
) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    handler(req, res).catch(next);
  };
}

const prioridadeEnum = z.enum(["Baixa", "Media", "Alta", "Critica"]);
const dateStr = z.string().trim().max(10);
const text = (max: number) => z.string().trim().max(max);

const demandaSchema = z
  .object({
    titulo: text(200).min(1),
    descricao: text(5000).optional().default(""),
    solicitante: text(200).optional().default("Não informado"),
    dataRecebimento: dateStr.optional().default(() => today()),
    prioridade: prioridadeEnum.optional().default("Media"),
    status: z.enum(["Nova", "Em analise", "Aprovada", "Rejeitada", "Transformada em Projeto"]).optional(),
  })
  .partial({ titulo: true })
  .refine((d) => d.titulo === undefined || d.titulo.length > 0, { message: "titulo é obrigatório" });

const projetoSchema = z
  .object({
    nome: text(200),
    descricao: text(5000).optional(),
    area: text(100).optional(),
    dataInicio: dateStr.optional(),
    dataPrevistaConclusao: dateStr.optional(),
    prioridade: prioridadeEnum.optional(),
    status: z.enum(["Planejamento", "Em andamento", "Pausado", "Concluido"]).optional(),
  })
  .partial();

const responsavelSchema = z
  .object({
    nome: text(200),
    cargo: text(200).optional(),
    area: text(200).optional(),
    email: text(200).optional(),
    telefone: text(50).optional(),
  })
  .partial();

const atividadeSchema = z
  .object({
    projetoId: z.string().max(100),
    nome: text(200),
    descricao: text(5000).optional(),
    responsavelId: z.string().max(100).optional(),
    dataInicio: dateStr.optional(),
    dataLimite: dateStr.optional(),
    prioridade: prioridadeEnum.optional(),
    status: z.enum(["Pendente", "Em andamento", "Pausado", "Em validacao", "Concluido", "Cancelado"]).optional(),
  })
  .partial();

const comentarioSchema = z.object({
  autor: text(200).optional().default("Vilar"),
  texto: text(5000).min(1),
});

const anexoSchema = z.object({
  nomeArquivo: text(300).optional().default("anexo.png"),
  tamanho: text(50).optional().default("150 KB"),
});

// --- SQL HELPERS ---
// Table/column names below always come from fixed call sites in this file
// (never from request input), so building SQL text with them is safe;
// values are always passed as parameters.
type Queryable = Pick<PoolClient, "query">;

async function insertRow<T>(
  client: Queryable,
  table: string,
  fields: Record<string, unknown>
): Promise<T> {
  const keys = Object.keys(fields);
  const cols = keys.map((k) => `"${k}"`).join(", ");
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  const values = keys.map((k) => fields[k]);
  const { rows } = await client.query(
    `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return rows[0] as T;
}

async function updateRow<T>(
  client: Queryable,
  table: string,
  id: string,
  fields: Record<string, unknown>
): Promise<T | undefined> {
  const keys = Object.keys(fields).filter((k) => fields[k] !== undefined);
  if (keys.length === 0) {
    const { rows } = await client.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return rows[0] as T | undefined;
  }
  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
  const values = keys.map((k) => fields[k]);
  const { rows } = await client.query(
    `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return rows[0] as T | undefined;
}

async function getRow<T>(client: Queryable, table: string, id: string): Promise<T | undefined> {
  const { rows } = await client.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  return rows[0] as T | undefined;
}

function insertHistorico(client: Queryable, atividadeId: string, descricao: string, data: string) {
  return insertRow(client, "historico", { id: newId("hist"), atividadeId, descricao, data });
}

// --- HEALTH CHECK ---
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

// --- 1. DEMANDAS API ---
app.get(
  "/api/demandas",
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM demandas ORDER BY created_at DESC");
    res.json(rows);
  })
);

app.post(
  "/api/demandas",
  validateBody(demandaSchema),
  asyncRoute(async (req, res) => {
    const nova = {
      id: newId("dem"),
      titulo: req.body.titulo ?? "",
      descricao: req.body.descricao ?? "",
      solicitante: req.body.solicitante ?? "Não informado",
      dataRecebimento: req.body.dataRecebimento || today(),
      prioridade: req.body.prioridade ?? "Media",
      status: req.body.status ?? "Nova",
    };
    const row = await insertRow(pool, "demandas", nova);
    res.status(201).json(row);
  })
);

app.put(
  "/api/demandas/:id",
  validateBody(demandaSchema),
  asyncRoute(async (req, res) => {
    const existing = await getRow(pool, "demandas", req.params.id);
    if (!existing) return res.status(404).json({ error: "Demanda não encontrada" });
    const row = await updateRow(pool, "demandas", req.params.id, req.body);
    res.json(row);
  })
);

app.post(
  "/api/demandas/:id/converter",
  asyncRoute(async (req, res) => {
    const demanda = await getRow<any>(pool, "demandas", req.params.id);
    if (!demanda) return res.status(404).json({ error: "Demanda não encontrada" });

    const result = await withTransaction(async (client) => {
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
      await insertRow(client, "projetos", novoProjeto);
      const demandaAtualizada = await updateRow(client, "demandas", demanda.id, {
        status: "Transformada em Projeto",
        projetoCriadoId: novoProjeto.id,
      });
      return { projeto: novoProjeto, demanda: demandaAtualizada };
    });

    res.json({ success: true, ...result });
  })
);

app.delete(
  "/api/demandas/:id",
  asyncRoute(async (req, res) => {
    await pool.query("DELETE FROM demandas WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  })
);

// --- 2. PROJETOS API ---
app.get(
  "/api/projetos",
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM projetos ORDER BY created_at DESC");
    res.json(rows);
  })
);

app.post(
  "/api/projetos",
  validateBody(projetoSchema),
  asyncRoute(async (req, res) => {
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
    const row = await insertRow(pool, "projetos", novo);
    res.status(201).json(row);
  })
);

app.put(
  "/api/projetos/:id",
  validateBody(projetoSchema),
  asyncRoute(async (req, res) => {
    const existing = await getRow(pool, "projetos", req.params.id);
    if (!existing) return res.status(404).json({ error: "Projeto não encontrado" });
    const row = await updateRow(pool, "projetos", req.params.id, req.body);
    res.json(row);
  })
);

app.delete(
  "/api/projetos/:id",
  asyncRoute(async (req, res) => {
    // ON DELETE CASCADE takes care of atividades, comentarios, anexos and historico.
    await pool.query("DELETE FROM projetos WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  })
);

// --- 3. RESPONSÁVEIS API ---
app.get(
  "/api/responsables",
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM responsables ORDER BY created_at ASC");
    res.json(rows);
  })
);

app.post(
  "/api/responsables",
  validateBody(responsavelSchema),
  asyncRoute(async (req, res) => {
    const novo = {
      id: newId("resp"),
      nome: req.body.nome ?? "",
      cargo: req.body.cargo ?? "",
      area: req.body.area ?? "",
      email: req.body.email ?? "",
      telefone: req.body.telefone ?? "",
    };
    const row = await insertRow(pool, "responsables", novo);
    res.status(201).json(row);
  })
);

app.put(
  "/api/responsables/:id",
  validateBody(responsavelSchema),
  asyncRoute(async (req, res) => {
    const existing = await getRow(pool, "responsables", req.params.id);
    if (!existing) return res.status(404).json({ error: "Responsável não encontrado" });
    const row = await updateRow(pool, "responsables", req.params.id, req.body);
    res.json(row);
  })
);

app.delete(
  "/api/responsables/:id",
  asyncRoute(async (req, res) => {
    await withTransaction(async (client) => {
      await client.query("DELETE FROM responsables WHERE id = $1", [req.params.id]);
      await client.query('UPDATE atividades SET "responsavelId" = $1 WHERE "responsavelId" = $2', [
        "",
        req.params.id,
      ]);
    });
    res.json({ success: true });
  })
);

// --- 4. ATIVIDADES API ---
app.get(
  "/api/atividades",
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM atividades ORDER BY created_at DESC");
    res.json(rows);
  })
);

app.post(
  "/api/atividades",
  validateBody(atividadeSchema.required({ nome: true, projetoId: true })),
  asyncRoute(async (req, res) => {
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

    await withTransaction(async (client) => {
      await insertRow(client, "atividades", nova);
      await insertHistorico(client, nova.id, "Atividade criada", nowTimestamp());
    });

    res.status(201).json(nova);
  })
);

app.put(
  "/api/atividades/:id",
  validateBody(atividadeSchema),
  asyncRoute(async (req, res) => {
    const antiga = await getRow<any>(pool, "atividades", req.params.id);
    if (!antiga) return res.status(404).json({ error: "Atividade não encontrada" });

    const atualizada = await withTransaction(async (client) => {
      const row = await updateRow(client, "atividades", req.params.id, req.body);
      const timestamp = nowTimestamp();

      if (req.body.status !== undefined && req.body.status !== antiga.status) {
        await insertHistorico(client, req.params.id, `Status alterado para ${req.body.status}`, timestamp);
      }
      if (req.body.dataLimite !== undefined && req.body.dataLimite !== antiga.dataLimite) {
        await insertHistorico(client, req.params.id, `Prazo alterado para ${req.body.dataLimite}`, timestamp);
      }
      if (req.body.responsavelId !== undefined && req.body.responsavelId !== antiga.responsavelId) {
        const resp = req.body.responsavelId
          ? await getRow<any>(client, "responsables", req.body.responsavelId)
          : null;
        await insertHistorico(
          client,
          req.params.id,
          `Responsável alterado para ${resp ? resp.nome : "Nenhum"}`,
          timestamp
        );
      }
      return row;
    });

    res.json(atualizada);
  })
);

app.delete(
  "/api/atividades/:id",
  asyncRoute(async (req, res) => {
    // ON DELETE CASCADE takes care of comentarios, anexos and historico.
    await pool.query("DELETE FROM atividades WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  })
);

// --- 5. COMENTARIOS API ---
app.get(
  "/api/atividades/:ativId/comentarios",
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT * FROM comentarios WHERE "atividadeId" = $1 ORDER BY created_at ASC',
      [req.params.ativId]
    );
    res.json(rows);
  })
);

app.post(
  "/api/atividades/:ativId/comentarios",
  validateBody(comentarioSchema),
  asyncRoute(async (req, res) => {
    const ativ = await getRow(pool, "atividades", req.params.ativId);
    if (!ativ) return res.status(404).json({ error: "Atividade não encontrada" });

    const novo = {
      id: newId("com"),
      atividadeId: req.params.ativId,
      autor: req.body.autor,
      texto: req.body.texto,
      data: nowTimestamp(),
    };

    await withTransaction(async (client) => {
      await insertRow(client, "comentarios", novo);
      await insertHistorico(client, req.params.ativId, "Comentário adicionado", novo.data);
    });

    res.status(201).json(novo);
  })
);

// --- 6. HISTORICO API ---
app.get(
  "/api/atividades/:ativId/historico",
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT * FROM historico WHERE "atividadeId" = $1 ORDER BY created_at ASC',
      [req.params.ativId]
    );
    res.json(rows);
  })
);

// --- 7. ANEXOS API ---
app.get(
  "/api/atividades/:ativId/anexos",
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM anexos WHERE "atividadeId" = $1 ORDER BY created_at ASC', [
      req.params.ativId,
    ]);
    res.json(rows);
  })
);

app.post(
  "/api/atividades/:ativId/anexos",
  validateBody(anexoSchema),
  asyncRoute(async (req, res) => {
    const ativ = await getRow(pool, "atividades", req.params.ativId);
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

    await withTransaction(async (client) => {
      await insertRow(client, "anexos", novo);
      await insertHistorico(client, req.params.ativId, `Anexo adicionado: ${novo.nomeArquivo}`, nowTimestamp());
    });

    res.status(201).json(novo);
  })
);

app.delete(
  "/api/anexos/:id",
  asyncRoute(async (req, res) => {
    const target = await getRow<any>(pool, "anexos", req.params.id);
    if (target) {
      await withTransaction(async (client) => {
        await client.query("DELETE FROM anexos WHERE id = $1", [req.params.id]);
        await insertHistorico(
          client,
          target.atividadeId,
          `Anexo removido: ${target.nomeArquivo}`,
          nowTimestamp()
        );
      });
    }
    res.json({ success: true });
  })
);

// --- 8. DASHBOARD METRICS API ---
// A single aggregate query (conditional counts) instead of pulling per-status
// group-bys and reducing in JS: one round trip to the database, which matters
// more here than on a local SQLite file since every query now pays network
// latency to Supabase.
app.get(
  "/api/dashboard",
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM projetos) AS "totalProjetos",
         (SELECT COUNT(*) FROM projetos WHERE status IN ('Em andamento', 'Planejamento')) AS "projetosAtivos",
         (SELECT COUNT(*) FROM projetos WHERE status = 'Pausado') AS "projetosPausados",
         (SELECT COUNT(*) FROM projetos WHERE status = 'Concluido') AS "projetosConcluidos",
         (SELECT COUNT(*) FROM atividades) AS "totalAtividades",
         (SELECT COUNT(*) FROM atividades WHERE status = 'Pendente') AS "atividadesPendentes",
         (SELECT COUNT(*) FROM atividades WHERE status IN ('Em andamento', 'Em validacao', 'Pausado')) AS "atividadesEmAndamento",
         (SELECT COUNT(*) FROM atividades WHERE status = 'Concluido') AS "atividadesConcluidas",
         (SELECT COUNT(*) FROM atividades
            WHERE status NOT IN ('Concluido', 'Cancelado')
              AND "dataLimite" <> ''
              AND "dataLimite" < $1) AS "atividadesAtrasadas"
      `,
      [today()]
    );

    const metrics = rows[0] as Record<string, string>;
    const numeric = Object.fromEntries(Object.entries(metrics).map(([k, v]) => [k, Number(v)]));
    res.json(numeric);
  })
);

// --- 9. SYSTEM MAINTENANCE API (Reset Database) ---
// Protected: requires ADMIN_RESET_TOKEN to be set and matched via header, to avoid
// exposing a destructive, unauthenticated data-wipe endpoint in production.
app.post(
  "/api/reset-db",
  asyncRoute(async (req, res) => {
    const configuredToken = process.env.ADMIN_RESET_TOKEN;
    if (!configuredToken) {
      return res.status(403).json({ error: "Recurso desabilitado: ADMIN_RESET_TOKEN não configurado." });
    }
    if (req.get("x-admin-token") !== configuredToken) {
      return res.status(401).json({ error: "Token de administrador inválido." });
    }

    await withTransaction(async (client) => {
      await client.query(
        "DELETE FROM historico; DELETE FROM anexos; DELETE FROM comentarios; DELETE FROM atividades; DELETE FROM demandas; DELETE FROM projetos; DELETE FROM responsables;"
      );
      await insertRow(client, "responsables", {
        id: "r1",
        nome: "Vilar",
        cargo: "Gerente de Inovação e Projetos",
        area: "Inovação",
        email: "vilar@empresa.com",
        telefone: "",
      });
    });

    res.json({ success: true, message: "Banco de dados limpo com sucesso!" });
  })
);

// --- ERROR HANDLER ---
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

export default app;
