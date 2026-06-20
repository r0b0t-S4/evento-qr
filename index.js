const express = require("express");
const cors = require("cors");
const supabase = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/checkin", async (req, res) => {
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