import { GoogleGenerativeAI } from '@google/generative-ai';

const key = "AIzaSyDf5P_eiWCp7tGSSHGp7E_8H7rHYpL36A8";

async function test() {
  console.log("--- Testing v1 ---");
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
    const data = await res.json();
    console.log("v1 models:", data.models?.map(m => m.name) || "none");
  } catch (e) {
     console.log("v1 error:", e.message);
  }

  console.log("\n--- Testing v1beta ---");
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    console.log("v1beta models:", data.models?.map(m => m.name) || "none");
     if (data.error) console.log("v1beta error details:", data.error.message);
  } catch (e) {
     console.log("v1beta error:", e.message);
  }
}

test();
