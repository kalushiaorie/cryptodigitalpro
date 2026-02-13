import fetch from "node-fetch";

const API = "https://cryptodigitalpro-api.onrender.com/api";
const users = [...Array(20).keys()].map(i => ({
  email: `test${i+1}@cryptodigitalpro.fake`,
  password: "Password123!"
}));

async function run() {
  for (const u of users) {
    const login = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(u)
    });

    const { token } = await login.json();

    fetch(API + "/loans/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ amount: 500 })
    });
  }
}

run();
