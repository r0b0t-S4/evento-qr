const express = require("express");
const cors = require("cors");
const supabase = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/checkin", async (req, res) => {
app.get("/dashboard", async (req, res) => {

  const { data, error } = await supabase
    .from("guests")
    .select("*");

  if (error) {
    return res.send("Error obteniendo datos");
  }

  const total = data.length;
  const checked = data.filter(g => g.status === "checked_in").length;

  let html = `
  <html>
  <head>
    <title>Dashboard Evento</title>
    <meta http-equiv="refresh" content="5">
    <style>
      body { font-family: Arial; background:black; color:white; text-align:center; }
      .card { margin:20px; padding:20px; border-radius:10px; display:inline-block; }
      .green { background:green; }
      .blue { background:blue; }
      table { margin:auto; margin-top:30px; border-collapse: collapse; }
      td, th { padding:10px; border-bottom:1px solid gray; }
    </style>
  </head>

  <body>

  <h1>📊 Dashboard Evento</h1>

  <div class="card blue">
    <h2>Total Invitados</h2>
    <h1>${total}</h1>
  </div>

  <div class="card green">
    <h2>Ya Entraron</h2>
    <h1>${checked}</h1>
  </div>

  <h2>Lista en Vivo</h2>

  <table>
  <tr>
    <th>Nombre</th>
    <th>Empresa</th>
    <th>Estatus</th>
  </tr>
  `;

  data.forEach(g => {
    html += `
    <tr>
      <td>${g.name}</td>
      <td>${g.company}</td>
      <td>${g.status}</td>
    </tr>
    `;
  });

  html += `
  </table>

  </body>
  </html>
  `;

  res.send(html);
});
  try {
    const token = req.query.token?.trim();

    if (!token) {
      return res.json({ status: "invalid" });
    }

    // Traer todos los invitados
    const { data, error } = await supabase
      .from("guests")
      .select("*");

    if (error) {
      console.log("ERROR DB:", error);
      return res.json({ status: "error" });
    }

    // Buscar coincidencia manual (evita bugs de encoding)
    const guest = data.find(g =>
      g.qr_token.trim().toLowerCase() === token.toLowerCase()
    );

    if (!guest) {
      return res.json({ status: "invalid" });
    }

    // Validar duplicados
    if (guest.status === "checked_in") {
      return res.json({ status: "already_used", guest });
    }

    // Marcar como usado
    await supabase
      .from("guests")
      .update({
        status: "checked_in"
      })
      .eq("qr_token", guest.qr_token);

    return res.json({ status: "success", guest });

  } catch (err) {
    console.log("ERROR:", err);
    return res.json({ status: "error" });
  }
});

app.listen(3000, () => {
  console.log("✅ Backend corriendo en puerto 3000");
});