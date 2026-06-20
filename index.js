const express = require("express");
const cors = require("cors");
const supabase = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

/* ============================
   ✅ CHECK-IN VISUAL PRO
============================ */

app.get("/checkin", async (req, res) => {
  try {
    const token = req.query.token?.trim();

    if (!token) {
      return res.send(`
        <body style="background:red;color:white;text-align:center;font-size:40px;">
          ❌ ACCESO DENEGADO
        </body>
      `);
    }

    const { data, error } = await supabase
      .from("guests")
      .select("*");

    if (error) {
      return res.send("Error DB");
    }

    const guest = data.find(g =>
      g.qr_token.trim().toLowerCase() === token.toLowerCase()
    );

    if (!guest) {
      return res.send(`
        <body style="background:red;color:white;text-align:center;font-size:40px;">
          ❌ ACCESO DENEGADO
        </body>
      `);
    }

    if (guest.status === "checked_in") {
      return res.send(`
        <body style="background:orange;color:white;text-align:center;font-size:40px;">
          ⚠️ YA INGRESÓ<br>${guest.name}
        </body>
      `);
    }

    await supabase
      .from("guests")
      .update({ status: "checked_in" })
      .eq("qr_token", guest.qr_token);

    return res.send(`
      <body style="background:green;color:white;text-align:center;font-size:40px;">
        ✅ BIENVENIDO<br>${guest.name}
      </body>
    `);

  } catch (err) {
    return res.send("Error servidor");
  }
});


/* ============================
   ✅ DASHBOARD PRO
============================ */

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
      body {
        font-family: Arial;
        background: black;
        color: white;
        text-align: center;
      }

      input {
        padding:10px;
        width:300px;
        border-radius:5px;
      }

      button {
        padding:10px;
        border-radius:5px;
        margin-top:10px;
      }

      .card {
        margin:20px;
        padding:20px;
        border-radius:10px;
        display:inline-block;
      }

      .green { background:green; }
      .blue { background:blue; }

      table {
        margin:auto;
        margin-top:30px;
        border-collapse:collapse;
      }

      td, th {
        padding:10px;
        border-bottom:1px solid gray;
      }
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

  <br>

  <input type="text" id="search" placeholder="🔍 Buscar nombre..." onkeyup="filterTable()"/>

  <br>

  <button onclick="downloadCSV()">⬇️ Descargar CSV</button>

  <h2>Lista en Vivo</h2>

  <table>
    <tr>
      <th>Nombre</th>
      <th>Empresa</th>
      <th>Estado</th>
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

  <script>

  function filterTable() {
    let input = document.getElementById("search").value.toLowerCase();
    let rows = document.querySelectorAll("table tr");

    rows.forEach((row, index) => {
      if (index === 0) return;

      let name = row.children[0].innerText.toLowerCase();

      row.style.display = name.includes(input) ? "" : "none";
    });
  }

  function downloadCSV() {
    let table = document.querySelector("table");
    let rows = table.querySelectorAll("tr");

    let csv = [];

    rows.forEach(row => {
      let cols = row.querySelectorAll("td, th");
      let rowData = [];

      cols.forEach(col => rowData.push(col.innerText));
      csv.push(rowData.join(","));
    });

    let blob = new Blob([csv.join("\\n")], { type: "text/csv" });
    let url = window.URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "reporte_evento.csv";
    a.click();
  }

  </script>

  </body>
  </html>
  `;

  res.send(html);
});


/* ============================
   ✅ SERVER
============================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto" + PORT);
});