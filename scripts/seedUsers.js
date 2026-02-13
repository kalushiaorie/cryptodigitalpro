import User from "../models/User.js";

for (let i = 1; i <= 20; i++) {
  await User.create({
    email: `test${i}@cryptodigitalpro.fake`,
    password: "Password123!",
    balance: 10000,
    kyc_status: "approved",
    is_test: true
  });
}

console.log("Fake users created");
process.exit();
