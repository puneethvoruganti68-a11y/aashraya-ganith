import { spawn } from 'child_process';
import path from 'path';

export interface MLPredictionInput {
  location: string;
  timestamp?: string;

  outdoor_temperature: number;
  outdoor_humidity: number;
  outdoor_wind_speed: number;
  outdoor_solar_radiation: number;

  nasa_temperature?: number;
  nasa_humidity?: number;
  nasa_wind_speed?: number;
  nasa_solar_radiation?: number;

  indoor_temperature?: number;
  indoor_humidity?: number;

  indoor_temperature_history?: number[];
  indoor_humidity_history?: number[];
}

function getPythonPath() {
  return process.env.PYTHON_PATH || 'python3';
}

export function predictWithML(
  input: MLPredictionInput
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const inferencePath = path.resolve(
      process.cwd(),
      'backend/ml/inference.py'
    );

    const python = spawn(getPythonPath(), [inferencePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    python.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    python.on('error', (error) => {
      reject(
        new Error(
          `Unable to start Python ML service: ${error.message}`
        )
      );
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `ML inference failed (exit ${code}): ${stderr || stdout}`
          )
        );
        return;
      }

      try {
        const result = JSON.parse(stdout);

        if (!result.success) {
          reject(
            new Error(result.error || 'ML inference returned an error')
          );
          return;
        }

        resolve(result);
      } catch {
        reject(
          new Error(
            `Invalid ML response: ${stdout}`
          )
        );
      }
    });

    python.stdin.write(JSON.stringify(input));
    python.stdin.end();
  });
}
