const API = "https://cryptodigitalpro-api.onrender.com/api";
const token = localStorage.getItem("adminToken");

fetch(API + "/admin/audit", {
  headers: { Authorization: "Bearer " + token }
})
.then(r=>r.json())
.then(logs=>{
  document.getElementById("logs").innerHTML = logs.map(l=>`
    <div>
      <b>${l.action}</b>
      | actor:${l.actor_id}
      | target:${l.target_id}
      | ${new Date(l.created_at).toLocaleString()}
    </div>
  `).join("");
});
