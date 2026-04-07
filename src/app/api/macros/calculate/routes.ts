import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
  const { ingredients } = await req.json();

  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'src/Algorithms/Macronutrients/macro.py');
    const pythonProcess = spawn('python3', [scriptPath]);

    let result = '';
    pythonProcess.stdin.write(JSON.stringify(ingredients));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => { result += data.toString(); });
    pythonProcess.on('close', () => {
      try {
        resolve(NextResponse.json(JSON.parse(result)));
      } catch (e) {
        resolve(NextResponse.json({ error: "Python logic failed" }, { status: 500 }));
      }
    });
  });
}