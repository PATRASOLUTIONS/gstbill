import { exec } from "child_process"
import Company from "@/models/company"
import Bank from "@/models/bank"
import { companySeedData, bankSeedData } from "./seed-data"

// Run the seed script
console.log("Starting database seeding...")

// Seed Company data
try {
  await Company.deleteMany({})
  const companyResult = await Company.insertMany(companySeedData)
  console.log(`${companyResult.length} company records inserted.`)
} catch (error) {
  console.error("Error seeding company data:", error)
}

// Seed Bank data
try {
  await Bank.deleteMany({})
  const bankResult = await Bank.insertMany(bankSeedData)
  console.log(`${bankResult.length} bank records inserted.`)
} catch (error) {
  console.error("Error seeding bank data:", error)
}

exec("npx ts-node -r tsconfig-paths/register scripts/seed-data.ts", (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`)
    return
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`)
    return
  }
  console.log(stdout)
})
